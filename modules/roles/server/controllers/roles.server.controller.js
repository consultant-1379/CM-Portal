'use strict';

var Role = require('../models/roles.server.model').Schema;
var User = require('../../../users/server/models/user.server.model').Schema;
var commonController = require('../../../core/server/controllers/common.server.controller');

var dependentModelsDetails = [
  { modelObject: User, modelKey: 'role_id' }
];

var sortOrder = 'name';
commonController = commonController(Role, dependentModelsDetails, sortOrder);

exports.create = commonController.create;
exports.read = commonController.read;
exports.list = commonController.list;
exports.findById = commonController.findById;
exports.delete = commonController.delete;
exports.update = commonController.update;
