var logRoutes = require('../../modules/history/server/routes/history.server.routes.js');
var authRoutes = require('../../modules/users/server/routes/auth.server.routes.js');
var rolesRoutes = require('../../modules/roles/server/routes/roles.server.routes.js');
var productsUpdateRoutes = require('../../modules/products_update/server/routes/products_update.server.routes.js');
var tokensRoutes = require('../../modules/tokens/server/routes/tokens.server.routes.js');
var productsRoutes = require('../../modules/products/server/routes/products.server.routes.js');
var programsRoutes = require('../../modules/programs/server/routes/programs.server.routes.js');
var configurationFilesRoutes = require('../../modules/configuration_files/server/routes/configuration_files.server.routes.js');
var schemasRoutes = require('../../modules/schemas/server/routes/schemas.server.routes.js');
var requestsRoutes = require('../../modules/requests/server/routes/requests.server.routes.js');
var coreRoutes = require('../../modules/core/server/routes/core.server.routes.js');

module.exports = [
  logRoutes,
  authRoutes,
  rolesRoutes,
  productsUpdateRoutes,
  tokensRoutes,
  productsRoutes,
  programsRoutes,
  configurationFilesRoutes,
  schemasRoutes,
  requestsRoutes,
  coreRoutes
];
