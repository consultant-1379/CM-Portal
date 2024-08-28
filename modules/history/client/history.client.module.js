import routes from './config/history.client.routes';
import menus from './config/history.client.menus';
import HistoryService from './services/history.client.service';
import './css/history.css';

export const history = angular
  .module('history', [])
  .config(routes)
  .run(menus)
  .factory('RolesHistoryService', HistoryService.getService('roles'))
  .factory('TokensHistoryService', HistoryService.getService('tokens'))
  .factory('ProgramsHistoryService', HistoryService.getService('programs'))
  .factory('SchemasHistoryService', HistoryService.getService('schemas'))
  .factory('RequestsHistoryService', HistoryService.getService('requests'))
  .factory('ConfigurationFilesHistoryService', HistoryService.getService('configurationFiles'))
  .name;
