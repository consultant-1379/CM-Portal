'use strict';

var schemas = require('../controllers/schemas.server.controller');
var adminPolicy = require('../../../../config/lib/policy');

module.exports = function (app) {
  app.route('/api/schemas')
    .get(schemas.list)
    .post(adminPolicy.isAllowed, schemas.create);

  app.route('/api/schemas/:schemaId')
    .get(schemas.read)
    .put(adminPolicy.isAllowed, schemas.update)
    .delete(adminPolicy.isAllowed, schemas.delete);

  app.param('schemaId', schemas.findById);
};
