'use strict';

var tokens = require('../controllers/tokens.server.controller');
var adminPolicy = require('../../../../config/lib/policy');

module.exports = function (app) {
  app.route('/api/tokens')
    .get(adminPolicy.isAllowed, tokens.list)
    .post(adminPolicy.isAllowed, tokens.create);

  app.route('/api/tokens/:tokenId')
    .get(adminPolicy.isAllowed, tokens.read)
    .put(adminPolicy.isAllowed, tokens.update)
    .delete(adminPolicy.isAllowed, tokens.delete);

  app.route('/api/tokens/changeUpdateRate/:tokenId')
    .put(adminPolicy.isAllowed, tokens.changeUpdateRate);

  app.route('/api/mimerOperationsEnabled').get(tokens.mimerOperationsEnabled);

  app.param('tokenId', tokens.findById);
};
