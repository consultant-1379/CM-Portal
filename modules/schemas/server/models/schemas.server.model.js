'use strict';

var mje = require('mongo-json-escape');
var Ajv = require('ajv');
var ajv = new Ajv({
  allErrors: true
});
var mongoose = require('mongoose');
var MongooseSchema = mongoose.Schema;
var uniqueValidator = require('mongoose-unique-validator');
var draft06Schema = require('ajv/lib/refs/json-schema-draft-06.json');
var MongooseHistory = require('../../../history/server/plugins/history.server.plugin');
var commonValidators = require('../../../core/server/controllers/validators.server.controller');
ajv.addMetaSchema(draft06Schema);
var Program = require('../../../programs/server/models/programs.server.model').Schema;
var Schema = new MongooseSchema({
  name: {
    type: String,
    trim: true,
    required: true,
    minlength: 3,
    maxlength: 150,
    validate: commonValidators.objectNameValidator
  },
  program_id: {
    type: MongooseSchema.ObjectId,
    ref: 'Program',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['projectRequest', 'other'],
    default: 'other'

  },
  content: {
    type: Object,
    required: true
  }
}, {
  strict: 'throw',
  minimize: false,
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

Schema.index({ name: 1, version: 1 }, { unique: true });

Schema.plugin(uniqueValidator, { message: 'Error, provided name is not unique.' });

// Validate schema and escape before saving to the database
Schema.pre('save', function (next) {
  var schema = this;

  // Set Type
  schema.type = setSchemaType(schema.name);
  try {
    // Check mandatory Jira related keys
    var mandatoryJiraKeys = ['jiraUrl', 'jiraComponents', 'jiraLabels', 'jiraProject'];

    if (schema.content.definitions.jiraProject === 'CIS') {
      mandatoryJiraKeys.push('jiraProgram', 'jiraTeamName', 'jiraLocationSite');
    }

    var schemaContentKeys = [];
    if (schema.type === 'projectRequest') Object.keys(schema.content.properties.parameters.properties).forEach(key => schemaContentKeys.push(key));
    var arrayIncludesCheck = (array, targetArray) => targetArray.every(key => array.includes(key));
    if (schema.type === 'projectRequest' && !arrayIncludesCheck(schemaContentKeys, mandatoryJiraKeys)) {
      throw new Error(`Schema missing one or more of the following keys:\n${mandatoryJiraKeys}`);
    }

    // check if mandatory keys have defaut values
    mandatoryJiraKeys.forEach(function (key) {
      var noDefault = schema.type === 'projectRequest' && !schema.content.definitions[key].default && schema.content.definitions[key].default !== '';
      if (noDefault) throw new Error(`Definition '${key}' has to have a 'default' parameter.`);
    });
    ajv.compile(schema.content);
  } catch (err) {
    return next(err);
  }
  schema.content = mje.escape(schema.content);
  // reverse content object when resaving
  if (schema.content) {
    schema.content = reverseContentObject(schema.content);
    schema.content.definitions = reverseContentObject(schema.content.definitions);
    schema.content.properties.parameters.properties = reverseContentObject(schema.content.properties.parameters.properties);
  }
  return next();
});

// Unscape after saving to the database so that if we return the object in the post, its not the escaped version
Schema.post('save', function (schema) {
  schema.content = mje.unescape(schema.content);
});

// Unscape after reading out of the database
Schema.post('init', function (schema) {
  if (schema.content) {
    schema.content = mje.unescape(schema.content);
  }
});

Schema.plugin(MongooseHistory);

module.exports.Schema = mongoose.model('Schema', Schema);

function setSchemaType(schemaName) {
  if (schemaName.startsWith('projectRequest')) {
    return 'projectRequest';
  }
  return 'other';
}

function reverseContentObject(content) {
  var returnObj = {};
  Object.keys(content).reverse().forEach(function (key) {
    returnObj[key] = content[key];
  });
  return returnObj;
}
