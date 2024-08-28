import routes from './config/configuration_files.client.routes';
import menus from './config/configuration_files.client.menus';
import service from './services/configuration_files.client.service';

export const configurationFiles = angular
  .module('configurationFiles', [])
  .config(routes)
  .run(menus)
  .factory('ConfigurationFilesService', service)
  .name;
