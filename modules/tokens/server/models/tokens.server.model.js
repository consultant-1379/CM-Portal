'use strict';

var mongoose = require('mongoose');
var MongooseSchema = mongoose.Schema;
var MongooseHistory = require('../../../history/server/plugins/history.server.plugin');

var Token = new MongooseSchema({
  name: {
    type: String,
    trim: true,
    required: true,
    minlength: 2,
    unique: true
  },
  refreshToken: {
    type: String,
    trim: true,
    required: true,
    unique: true,
    minlength: 2,
    maxlength: 3000
  },
  accessToken: {
    type: String,
    trim: true,
    required: true,
    unique: true,
    minlength: 2,
    maxlength: 3000
  },
  updateRate: {
    type: String,
    default: '0 0 1 * *'
  },
  nextUpdateTime: {
    type: String
  },
  updateStatus: {
    type: Boolean,
    default: true
  }
}, { strict: 'throw' });

Token.plugin(MongooseHistory);

module.exports.Schema = mongoose.model('Token', Token);
