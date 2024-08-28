'use strict';

var jsonlint = require('jsonlint');
var YAML = require('yamljs');
var yamlLint = require('yaml-lint');
var moment = require('moment');

var mongoose = require('mongoose');
var MongooseSchema = mongoose.Schema;
var uniqueValidator = require('mongoose-unique-validator');
var MongooseHistory = require('../../../history/server/plugins/history.server.plugin');
var commonValidators = require('../../../core/server/controllers/validators.server.controller');


var ConfigurationFile = new MongooseSchema({
  name: {
    type: String,
    trim: true,
    required: true,
    unique: true,
    minlength: 2,
    maxlength: 100,
    validate: commonValidators.objectNameValidator
  },
  type: {
    type: String,
    trim: true,
    lowercase: true,
    required: true
  },
  additionalInfo: {
    type: String,
    trim: true,
    maxlength: 150
  },
  locations: {
    type: String,
    trim: true,
    maxlength: 350
  },
  content: {
    type: Object,
    required: true
  },
  version: {
    type: Number,
    default: 1
  },
  testVar: {
    type: Boolean
  }
}, { strict: 'throw' });

ConfigurationFile.index({ name: 1, type: 1 }, { unique: true });
ConfigurationFile.plugin(uniqueValidator, { message: 'Error, provided combination of name and type is not unique.' });

ConfigurationFile.pre('save', async function (next) {
  var configurationFile = this;
  var currentContent = configurationFile.content;
  try {
    // creation
    if (configurationFile.isNew) {
      if (configurationFile.type === 'yaml') {
        if (typeof configurationFile.content !== 'string') throw new Error('Non JSON configurationFile content has to be a string. e.g. content: "abc"');
        await yamlLint.lint(configurationFile.content)
          .then(() => {
            configurationFile.content = { data: configurationFile.content };
            if (configurationFile.content && configurationFile.content.data && configurationFile.content.data.data) {
              configurationFile.content = { data: stripExtraDataFields(configurationFile.content) };
            }
          })
          .catch((lintError) => {
            throw new Error(`There were Errors found when validating the given YAML. ${lintError}`);
          });
      }
      if (configurationFile.type === 'json') {
        configurationFile.content = await lintJSON(configurationFile);
      }
      if (configurationFile.type !== 'json' && configurationFile.type !== 'yaml') {
        configurationFile.content = { data: configurationFile.content };
      }
    }

    // update
    if (!configurationFile.isNew) {
      // modifying type
      if (configurationFile.isModified('type')) {
        // json if new type is json
        if (configurationFile.type === 'json' && (configurationFile.content.data || typeof configurationFile.content !== 'object')) {
          throw new Error('Could not update type/content. JSON type configurationFile has to have a JSON content.');
        }
        // yaml if new type is yaml
        if (configurationFile.type === 'yaml') {
          await yamlLint.lint(configurationFile.content.data)
            .catch((lintError) => {
              throw new Error(`Could not update type/content. YAML type configurationFile has to have a YAML content. ${lintError}`);
            });
        }
      }

      if (configurationFile.type === 'json') {
        configurationFile.content = await lintJSON(configurationFile);
      }
      if (configurationFile.type === 'yaml') {
        if (typeof configurationFile.content !== 'object') {
          await yamlLint.lint(configurationFile.content)
            .then(() => {
              configurationFile.content = { data: configurationFile.content };
              if (configurationFile.content && configurationFile.content.data && configurationFile.content.data.data) {
                configurationFile.content = { data: stripExtraDataFields(configurationFile.content) };
              }
            })
            .catch((lintError) => {
              throw new Error(`There were Errors found when validating the given YAML. ${lintError}`);
            });
        } else if (!configurationFile.content.data) {
          throw new Error('Cannot update YAML configurationFile, as current or received content/type is not YAML.');
        }
      }
      if (configurationFile.type !== 'json') {
        configurationFile.content = stripExtraDataFields({ data: currentContent });
      }
    }
    // if update
    if (!configurationFile.isNew) configurationFile.version += 1;
    else configurationFile.version = 1;
    return next();
  } catch (error) {
    return next(error);
  }
});

ConfigurationFile.plugin(MongooseHistory);

module.exports.Schema = mongoose.model('ConfigurationFile', ConfigurationFile);

function stripExtraDataFields(content) {
  // e.g. content.data.data.data => content.data
  if (typeof content === 'object' && content !== null) {
    if ('data' in content && typeof content.data === 'object' && content.data !== null) {
      return stripExtraDataFields(content.data);
    }
  }
  return content;
}

async function lintJSON(configurationFile) {
  try {
    if (typeof (configurationFile.content) === 'string') {
      return jsonlint.parse(configurationFile.content);
    } else if (typeof (configurationFile.content) === 'object') {
      var stringifiedDataContent = JSON.stringify(configurationFile.content);
      return jsonlint.parse(stringifiedDataContent);
    }
  } catch (lintError) {
    throw new Error(`There were Errors found when validating the given JSON. ${lintError}`);
  }
}
