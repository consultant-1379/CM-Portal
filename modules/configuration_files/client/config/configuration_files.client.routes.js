import ListController from '../controllers/configuration_files-list.client.controller';
import CreateController from '../controllers/configuration_files-create.client.controller';
import ViewController from '../controllers/configuration_files-view.client.controller';
import CommonListTemplate from '../../../core/client/views/common-list.view.html';
import CreateTemplate from '../views/configuration_files-create.client.view.html';
import ViewTemplate from '../views/configuration_files-view.client.view.html';

routeConfig.$inject = ['$stateProvider'];
export default function routeConfig($stateProvider) {
  $stateProvider
    .state('configurationFiles', {
      abstract: true,
      url: '/configurationFiles',
      template: '<ui-view/>'
    })
    .state('configurationFiles.create', {
      url: '/create?{restoreData:json}',
      template: CreateTemplate,
      controller: CreateController,
      controllerAs: 'vm',
      resolve: {
        configurationFile: newConfigurationFile,
        restoredata: getRestoreData,
        creatingFromScratch: function () { return true; }
      }
    })
    .state('configurationFiles.list', {
      url: '',
      template: CommonListTemplate,
      controller: ListController,
      controllerAs: 'vm',
      resolve: {
        allConfigurationFiles: getAllConfigurationFiles
      }
    })
    .state('configurationFiles.edit', {
      url: '/edit/{configurationFileId}?{restoreData:json}?',
      template: CreateTemplate,
      controller: CreateController,
      controllerAs: 'vm',
      resolve: {
        configurationFile: getConfigurationFile,
        restoredata: getRestoreData,
        creatingFromScratch: function () { return false; }
      }
    })
    .state('configurationFiles.view', {
      url: '/view/{configurationFileId}',
      template: ViewTemplate,
      controller: ViewController,
      controllerAs: 'vm',
      resolve: {
        configurationFile: getConfigurationFile,
        configurationFileLogs: getConfigurationFileLogs
      }
    });
}

getRestoreData.$inject = ['$stateParams'];
function getRestoreData($stateParams) {
  return $stateParams.restoreData;
}

getConfigurationFile.$inject = ['$stateParams', 'ConfigurationFilesService'];
function getConfigurationFile($stateParams, ConfigurationFilesService) {
  return ConfigurationFilesService.get({
    configurationFileId: $stateParams.configurationFileId
  }).$promise;
}

getAllConfigurationFiles.$inject = ['ConfigurationFilesService'];
function getAllConfigurationFiles(configurationFilesService) {
  return configurationFilesService.query().$promise;
}

newConfigurationFile.$inject = ['ConfigurationFilesService'];
function newConfigurationFile(ConfigurationFilesService) {
  return new ConfigurationFilesService();
}

getUsers.$inject = ['UsersService'];
function getUsers(UsersService) {
  return UsersService.query().$promise;
}

getConfigurationFileLogs.$inject = ['$stateParams', 'ConfigurationFilesHistoryService'];
function getConfigurationFileLogs($stateParams, ConfigurationFilesHistoryService) {
  return ConfigurationFilesHistoryService.query({ q: 'associated_id=' + $stateParams.configurationFileId, fields: 'associated_id,originalData,updates/(updateData)' }).$promise;
}
