'use strict';

var Ajv = require('ajv');
var _ = require('lodash');
var Request = require('../models/requests.server.model').Schema;
var commonController = require('../../../core/server/controllers/common.server.controller');

var sortOrder = 'name';
commonController = commonController(Request, [], sortOrder);

exports.list = commonController.list;
exports.delete = commonController.delete;
exports.findById = commonController.findById;
exports.read = commonController.read;
exports.create = commonController.create;
