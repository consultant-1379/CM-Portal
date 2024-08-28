'use strict';

// Root routing
var core = require('../controllers/core.server.controller');

function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.sendStatus(401);
  }
}

module.exports = function (app) {
  app.route('/api/logintest').get(checkAuthenticated, core.loginTest);
  app.route('/api/version').get(core.getVersion);
  app.route('/api/upgradeEmail').get(core.getUpgradeEmail);
  app.route('/api/toolnotifications').get(core.getToolNotifications);
  // Return a 404 for all undefined api, module or lib routes
  app.route('/:url(api|modules|lib)/*').get(core.renderNotFound);
  // Define application route
  app.route('/*').get(core.renderIndex);
};
