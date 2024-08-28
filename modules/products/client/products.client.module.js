import routes from './config/products.client.routes';
import menus from './config/products.client.menus';
import service from './services/products.client.service';

export const products = angular
  .module('products', [])
  .config(routes)
  .run(menus)
  .factory('ProductsService', service)
  .name;
