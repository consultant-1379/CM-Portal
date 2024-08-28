'use strict';

var mongoose = require('mongoose');
var MongooseSchema = mongoose.Schema;

var ProductsUpdate = new MongooseSchema({
  name: {
    type: String,
    trim: true
  },
  productNumbersUpdated: {
    type: [String],
    trim: true
  },
  invalidProductNumbers: {
    type: [String],
    trim: true
  },
  userTypeUpdated: {
    type: String,
    trim: true
  },
  accessControlGroups: {
    type: [String],
    trim: true
  },
  invalidAccessGroups: {
    type: [String],
    trim: true
  },
  signums: {
    type: [String],
    trim: true
  },
  invalidSignums: {
    type: [String],
    trim: true
  },
  productsAction: {
    type: String,
    trim: true
  },
  updatedBy: {
    type: String,
    trim: true
  },
  invalidDesignProductNumbers: {
    type: [String],
    trim: true
  },
  productNumbersUpdatedForDesign: {
    type: [String],
    trim: true
  },
  designResponsibleUpdated: {
    type: String,
    trim: true
  }
}, { strict: 'throw' });

module.exports.Schema = mongoose.model('ProductsUpdate', ProductsUpdate);
