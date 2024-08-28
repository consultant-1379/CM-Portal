import routes from './config/requests.client.routes';
import menus from './config/requests.client.menus';
import service from './services/requests.client.service';

export const requests = angular
  .module('requests', ['schemaForm', 'btorfs.multiselect', 'ui.toggle'])
  .config(routes)
  .run(menus)
  .factory('RequestsService', service)
  .name;
