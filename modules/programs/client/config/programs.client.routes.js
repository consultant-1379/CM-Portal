import ListController from '../controllers/programs-list.client.controller';
import CreateController from '../controllers/programs-create.client.controller';
import ViewController from '../controllers/programs-view.client.controller';
import CommonListTemplate from '../../../core/client/views/common-list.view.html';
import CreateTemplate from '../views/programs-create.client.view.html';
import ViewTemplate from '../views/programs-view.client.view.html';

routeConfig.$inject = ['$stateProvider'];
export default function routeConfig($stateProvider) {
  $stateProvider
    .state('programs', {
      abstract: true,
      url: '/programs',
      template: '<ui-view/>'
    })
    .state('programs.list', {
      url: '',
      template: CommonListTemplate,
      controller: ListController,
      controllerAs: 'vm',
      resolve: {
        allPrograms: getAllPrograms
      }
    })
    .state('programs.create', {
      url: '/create?{restoreData:json}',
      template: CreateTemplate,
      controller: CreateController,
      controllerAs: 'vm',
      resolve: {
        program: newProgram,
        restoredata: getRestoreData,
        creatingFromScratch: function () { return true; }
      }
    })
    .state('programs.edit', {
      url: '/edit/{programId}?{restoreData:json}?',
      template: CreateTemplate,
      controller: CreateController,
      controllerAs: 'vm',
      resolve: {
        program: getProgram,
        restoredata: getRestoreData,
        clonedata: function () { return null; },
        creatingFromScratch: function () { return false; },
        allPrograms: getAllPrograms
      }
    })
    .state('programs.view', {
      url: '/view/{programId}',
      template: ViewTemplate,
      controller: ViewController,
      controllerAs: 'vm',
      resolve: {
        program: getProgram,
        dependentRequests: ['program', 'RequestsService', getDependentRequests]
      }
    });
}

getRestoreData.$inject = ['$stateParams'];
function getRestoreData($stateParams) {
  return $stateParams.restoreData;
}

getProgram.$inject = ['$stateParams', 'ProgramsService'];
function getProgram($stateParams, ProgramsService) {
  return ProgramsService.get({
    programId: $stateParams.programId
  }).$promise;
}

getAllPrograms.$inject = ['ProgramsService'];
function getAllPrograms(programsService) {
  return programsService.query().$promise;
}

newProgram.$inject = ['ProgramsService'];
function newProgram(ProgramsService) {
  return new ProgramsService();
}

getUsers.$inject = ['UsersService'];
function getUsers(UsersService) {
  return UsersService.query().$promise;
}

function getDependentRequests(program, RequestsService) {
  return RequestsService.query({ q: 'program_id=' + program._id, fields: '_id,name' }).$promise;
}
