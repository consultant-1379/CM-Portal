import routes from './config/products_update.client.routes';
import menus from './config/products_update.client.menus';
import service from './services/products_update.client.service';

export const productsUpdate = angular
  .module('productsUpdate', [])
  .config(routes)
  .run(menus)
  .factory('ProductsUpdateService', service)
  .name;
