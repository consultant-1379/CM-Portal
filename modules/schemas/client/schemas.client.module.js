import routes from './config/schemas.client.routes';
import menus from './config/schemas.client.menus';
import service from './services/schemas.client.service';

export const schemas = angular
  .module('schemas', [])
  .config(routes)
  .run(menus)
  .factory('SchemasService', service)
  .name;
