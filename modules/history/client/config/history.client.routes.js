import ListController from '../controllers/history-list.client.controller';
import ListTemplate from '../views/history-list.client.view.html';
import ViewTemplate from '../views/history-view.client.view.html';
import ViewController from '../controllers/history-view.client.controller';

routeConfig.$inject = ['$stateProvider'];
export default function routeConfig($stateProvider) {
  $stateProvider
    .state('logs', {
      abstract: true,
      url: '/logs',
      template: '<ui-view/>'
    })

    .state('logs.list', {
      url: '/{objType}',
      template: ListTemplate,
      controller: ListController,
      controllerAs: 'vm',
      resolve: {
        historyservice: getHistoryService,
        logs: ['historyservice', getObjectLogs]
      }
    })

    .state('logs.view', {
      url: '/{objType}/view/{objId}?emailFocus',
      params: { // dynamic params allow param-update without page-reload
        emailFocus: { dynamic: true }
      },
      template: ViewTemplate,
      controller: ViewController,
      controllerAs: 'vm',
      resolve: {
        historyservice: getHistoryService,
        log: ['$stateParams', 'historyservice', getObjectLog],
        emailFocus: getEmailFocus
      }
    });
}

getHistoryService.$inject = [
  '$state', '$stateParams', 'RolesHistoryService', 'TokensHistoryService', 'ProgramsHistoryService',
  'SchemasHistoryService', 'RequestsHistoryService', 'ConfigurationFilesHistoryService'
];
function getHistoryService(
  $state, $stateParams, RolesHistoryService, TokensHistoryService, ProgramsHistoryService,
  SchemasHistoryService, RequestsHistoryService, ConfigurationFilesHistoryService
) {
  switch ($stateParams.objType) {
    case 'roles': return RolesHistoryService;
    case 'tokens': return TokensHistoryService;
    case 'programs': return ProgramsHistoryService;
    case 'schemas': return SchemasHistoryService;
    case 'requests': return RequestsHistoryService;
    case 'configurationFiles': return ConfigurationFilesHistoryService;
    default: $state.go('not-found', { message: `Logs do not exist for object-type '${$stateParams.objType}'` });
  }
}

function getObjectLogs(historyservice) {
  return historyservice.query({ fields: 'associated_id,originalData(name,schema_id,version),currentName,createdAt,createdBy,deletedAt,deletedBy,updates/(updatedAt,updatedBy)' }).$promise;
}

function getObjectLog($stateParams, historyservice) {
  return historyservice.get({ objId: $stateParams.objId }).$promise;
}

getEmailFocus.$inject = ['$stateParams'];
function getEmailFocus($stateParams) {
  return $stateParams.emailFocus;
}
