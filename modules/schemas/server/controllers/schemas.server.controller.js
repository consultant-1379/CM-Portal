'use strict';

var commonController = require('../../../core/server/controllers/common.server.controller');
var sortOrder = 'name';
var Schema = require('../models/schemas.server.model').Schema;
var Request = require('../../../requests/server/models/requests.server.model').Schema;

var dependentModelsDetails = [{ modelObject: Request, modelKey: 'schema_id' }];

commonController = commonController(Schema, dependentModelsDetails, sortOrder);

exports.create = commonController.create;
exports.update = commonController.update;
exports.read = commonController.read;
exports.list = commonController.list;
exports.delete = commonController.delete;
exports.findById = commonController.findById;
