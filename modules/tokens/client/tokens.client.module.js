import routes from './config/tokens.client.routes';
import menus from './config/tokens.client.menus';
import service from './services/tokens.client.service';

export const tokens = angular
  .module('tokens', [])
  .config(routes)
  .run(menus)
  .factory('TokensService', service)
  .name;
