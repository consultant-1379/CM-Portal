'use strict';

var Ajv = require('ajv');
var draft06Schema = require('ajv/lib/refs/json-schema-draft-06.json');
var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');
var _ = require('lodash');
var Schema = require('../../../schemas/server/models/schemas.server.model.js').Schema;
var Program = require('../../../programs/server/models/programs.server.model.js').Schema;
var commonValidators = require('../../../core/server/controllers/validators.server.controller');
var jiraHandler = require('../../../core/server/controllers/jira.server.controller');

var MongooseSchema = mongoose.Schema;
var MongooseHistory = require('../../../history/server/plugins/history.server.plugin');
var ajv = new Ajv({
  unknownFormats: true,
  allErrors: true
});
ajv.addMetaSchema(draft06Schema);

var Request = new MongooseSchema({
  schema_id: {
    type: MongooseSchema.ObjectId,
    ref: 'Schema'
  },
  program_id: {
    type: MongooseSchema.ObjectId,
    ref: 'Program'
  },
  name: {
    type: String,
    trim: true,
    required: true,
    unique: true,
    minlength: 5,
    maxlength: 80,
    validate: commonValidators.objectNameValidator
  },
  content: {
    type: Object,
    trim: true,
    required: true
  },
  jira: {
    type: String,
    trim: true,
    default: 'None'
  }
}, {
  strict: 'throw',
  minimize: false,
  timestamps: {
    createdAt: 'created_at'
  }
});

Request.plugin(uniqueValidator, { message: 'Error, provided name is not unique.' });

Request.pre('save', async function (next) {
  try {
    var request = this;

    // Remove all Keys that are empty
    request = removeAllEmptyKeysFromObject(request);
    var schema = await Schema.findOne({ _id: request.schema_id }).exec();

    var validate = ajv.compile(schema.content);
    var valid = validate(request.content);
    if (!valid) {
      return await Promise.reject(new Error('There were ' + validate.errors.length
        + ' errors found when validating the given request against the schema: '
        + JSON.stringify(validate.errors)));
    }

    // Create Jira for new Request
    await jiraHandler.createJiraIssue(request);

    return next();
  } catch (error) {
    return next(error);
  }
});

function removeAllEmptyKeysFromObject(request) {
  if (request.managedconfig || !request.content.parameters) {
    return request;
  }
  for (var key in request.content.parameters) {
    if (Object.prototype.hasOwnProperty.call(request.content.parameters, key)) {
      if (!request.content.parameters[key]) {
        delete request.content.parameters[key];
      }
    }
  }
  return request;
}

Request.plugin(MongooseHistory);

module.exports.Schema = mongoose.model('Request', Request);
