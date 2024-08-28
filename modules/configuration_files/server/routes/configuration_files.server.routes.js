'use strict';

var configurationFiles = require('../controllers/configuration_files.server.controller');
var adminPolicy = require('../../../../config/lib/policy');

module.exports = function (app) {
  app.route('/api/configurationFiles')
    .get(adminPolicy.isAllowed, configurationFiles.list)
    .post(adminPolicy.isAllowed, configurationFiles.create);

  app.route('/api/configurationFiles/:configurationFileId')
    .get(adminPolicy.isAllowed, configurationFiles.read)
    .put(adminPolicy.isAllowed, configurationFiles.update)
    .delete(adminPolicy.isAllowed, configurationFiles.delete);

  app.route('/api/configurationFiles/name/:configurationFileName/:configurationFileType')
    .get(adminPolicy.isAllowed, configurationFiles.read)
    .put(adminPolicy.isAllowed, configurationFiles.update)
    .delete(adminPolicy.isAllowed, configurationFiles.delete);

  app.param('configurationFileId', configurationFiles.findById);
  app.param('configurationFileName', configurationFiles.findByNameAndType);
};
