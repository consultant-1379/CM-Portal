'use strict';

var querystring = require('querystring');
var mongoMask = require('mongo-mask');
var ConfigurationFile = require('../models/configuration_files.server.model').Schema;
var commonController = require('../../../core/server/controllers/common.server.controller');
var Schema = require('../../../schemas/server/models/schemas.server.model').Schema;
var helperHandler = require('../../../core/server/controllers/helpers.server.controller');
var errorHandler = require('../../../core/server/controllers/errors.server.controller'); var validatorsController = require('../../../core/server/controllers/validators.server.controller');
var Logs = require('../../../history/server/models/history.server.model.js').getSchema('configurationfiles');

var dependentModelsDetails = [{ modelObject: Schema, modelKey: 'configuration_file_id' }];
var sortOrder = 'name';
commonController = commonController(ConfigurationFile, dependentModelsDetails, sortOrder);

exports.create = commonController.create;
exports.read = commonController.read;
exports.list = commonController.list;
exports.findById = commonController.findById;
exports.delete = commonController.delete;
exports.update = commonController.update;


exports.download = async function (req, res) {
  var configurationFile = req.ConfigurationFile ? req.ConfigurationFile.toJSON() : {};
  var requestedFileVersion = req.params.configurationFileVersion;
  var errorsFound;
  if (requestedFileVersion) errorsFound = validatorsController.isValidFileVersionNumber(requestedFileVersion, configurationFile);
  if (errorsFound) {
    res.status(422).send({
      message: errorsFound
    });
  } else {
    if (requestedFileVersion && (requestedFileVersion !== configurationFile.version.toString())) {
      var configurationFileLogs = await Logs.findOne({ associated_id: req.ConfigurationFile._id });
      if (requestedFileVersion === '1') {
        configurationFile.type = configurationFileLogs.originalData.type;
        configurationFile.content = configurationFileLogs.originalData.content;
      } else {
        configurationFile.type = returnFileTypeFromLogs(configurationFileLogs, requestedFileVersion);
        configurationFile.content = undefined;
        // if content was not changed in version x, check version before up to original data
        for (var i = requestedFileVersion; i > 0; i -= 1) {
          if (i === 1 && !configurationFile.content) configurationFile.content = configurationFileLogs.originalData.content;
          if (configurationFile.content) break;
          configurationFile.content = configurationFileLogs.updates[requestedFileVersion - 2].updateData.content;
        }
      }
    }
    res.attachment(`${configurationFile.name}.${configurationFile.type}`);
    res.type(`.${configurationFile.type}`);
    res.send(configurationFile.content.data || configurationFile.content);
  }
};

exports.findByNameAndType = async function (req, res, next, configurationFileName) {
  var configurationFileType = req.params.configurationFileType;
  var searchParam = { name: configurationFileName, type: configurationFileType };
  var fields = (req.query.fields) ? mongoMask(req.query.fields, {}) : null;

  ConfigurationFile.findOne(searchParam).select(fields).exec(function (err, modelInstance) {
    if (err) return next(err);
    if (!modelInstance) {
      return res.status(404)
        .send({ message: `A ConfigurationFile with name '${configurationFileName}' and type '${configurationFileType}' does not exist` });
    }
    req.ConfigurationFile = modelInstance;
    return next();
  });
};

exports.listConfigurationFiles = async function (req, res) {
  var isSuperAdmin = req.user.roles[0] === 'superAdmin';
  var currentUser = req.user;
  var query;
  var fields = null;
  var allowedConfigurationFiles = [];

  if (!helperHandler.isValidSearch(req.query)) {
    return res.status(422).send({
      message: 'Improperly structured query. Make sure to use ?q=<key>=<value> syntax'
    });
  }

  if (req.query.q) query = querystring.parse(req.query.q);
  if (req.query.fields) fields = mongoMask(req.query.fields, {});

  ConfigurationFile.find(query).select(fields).sort(sortOrder).exec(async function (configurationFileFindError, modelInstances) {
    if (configurationFileFindError) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(configurationFileFindError)
      });
    }

    if (isSuperAdmin) res.json(modelInstances);
    var moduleInstancesLength = Object.keys(modelInstances).length;
    for (var i = 0; i < moduleInstancesLength; i += 1) {
      var configurationFile = modelInstances[i];
      allowedConfigurationFiles.push(configurationFile);
    }
    res.json(allowedConfigurationFiles);
  });
};

function returnFileTypeFromLogs(configurationFileLog, version) {
  if (!configurationFileLog.updates[version - 2].updateData.type) {
    var arrayIndex = version - 2;
    for (var i = arrayIndex; i >= 0; i -= 1) {
      if (configurationFileLog.updates[i].updateData.type) return configurationFileLog.updates[i].updateData.type;
      // if no changes found, use original type
      if (i === 0 && !configurationFileLog.updates[0].updateData.type) return configurationFileLog.originalData.type;
    }
  }
  return configurationFileLog.updates[version - 2].updateData.type;
}
