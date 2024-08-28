'use strict';

var mongoose = require('mongoose');
var MongooseSchema = mongoose.Schema;
var uniqueValidator = require('mongoose-unique-validator');
var MongooseHistory = require('../../../history/server/plugins/history.server.plugin');

var Program = new MongooseSchema({
  name: {
    type: String,
    trim: true,
    required: true,
    unique: true,
    minlength: 2,
    maxlength: 50,
    validate: {
      validator: function (name) {
        return /^[a-zA-Z0-9\-_. ]*$/i.test(name);
      },
      message: '{PATH} is not valid; \'{VALUE}\' can only contain letters, numbers, dots, spaces, dashes and underscores.'
    }
  }
}, { strict: 'throw' });

Program.plugin(uniqueValidator, { message: 'Error, provided name is not unique.' });

Program.plugin(MongooseHistory);

module.exports.Schema = mongoose.model('Program', Program);
