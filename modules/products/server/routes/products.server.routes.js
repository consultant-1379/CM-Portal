'use strict';

var products = require('../controllers/products.server.controller');
var adminPolicy = require('../../../../config/lib/policy');

module.exports = function (app) {
  app.route('/api/products')
    .post(adminPolicy.isAllowed, products.create);
};
