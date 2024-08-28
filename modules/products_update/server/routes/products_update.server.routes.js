'use strict';

var productsUpdate = require('../controllers/products_update.server.controller');
var adminPolicy = require('../../../../config/lib/policy');

module.exports = function (app) {
  app.route('/api/productsUpdate')
    .get(adminPolicy.isAllowed, productsUpdate.list)
    .post(adminPolicy.isAllowed, productsUpdate.create);

  app.route('/api/productsUpdate/:productsUpdateId')
    .get(adminPolicy.isAllowed, productsUpdate.read)
    .delete(adminPolicy.isAllowed, productsUpdate.delete);

  app.param('productsUpdateId', productsUpdate.findById);
};
