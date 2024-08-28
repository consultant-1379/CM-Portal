'use strict';

var requests = require('../controllers/requests.server.controller');
var adminPolicy = require('../../../../config/lib/policy');

module.exports = function (app) {
  app.route('/api/requests')
    .get(requests.list)
    .post(adminPolicy.isAllowed, requests.create);

  app.route('/api/requests/:requestId')
    .get(requests.read)
    .delete(adminPolicy.isAllowed, requests.delete);

  app.param('requestId', requests.findById);
};
