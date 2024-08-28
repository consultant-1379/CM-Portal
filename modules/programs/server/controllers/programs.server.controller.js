'use strict';

var Program = require('../models/programs.server.model').Schema;
var commonController = require('../../../core/server/controllers/common.server.controller');
var Schema = require('../../../schemas/server/models/schemas.server.model').Schema;

var dependentModelsDetails = [{ modelObject: Schema, modelKey: 'program_id' }];
var sortOrder = 'name';
commonController = commonController(Program, dependentModelsDetails, sortOrder);

exports.create = commonController.create;
exports.read = commonController.read;
exports.list = commonController.list;
exports.findById = commonController.findById;
exports.delete = commonController.delete;
exports.update = commonController.update;
