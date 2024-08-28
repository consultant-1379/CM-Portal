import ListController from '../controllers/tokens-list.client.controller';
import CreateController from '../controllers/tokens-create.client.controller';
import ViewController from '../controllers/tokens-view.client.controller';
import CommonListTemplate from '../../../core/client/views/common-list.view.html';
import CreateTemplate from '../views/tokens-create.client.view.html';
import ViewTemplate from '../views/tokens-view.client.view.html';

routeConfig.$inject = ['$stateProvider'];
export default function routeConfig($stateProvider) {
  $stateProvider
    .state('tokens', {
      abstract: true,
      url: '/tokens',
      template: '<ui-view/>'
    })

    .state('tokens.list', {
      url: '',
      template: CommonListTemplate,
      controller: ListController,
      controllerAs: 'vm',
      resolve: {
        allTokens: getAllTokens,
        allTokenLogs: getAllTokenLogs
      }
    })
    .state('tokens.create', {
      url: '/create?{restoreData:json}',
      template: CreateTemplate,
      controller: CreateController,
      controllerAs: 'vm',
      resolve: {
        token: newToken,
        restoredata: getRestoreData,
        creatingFromScratch: function () { return true; }
      }
    })
    .state('tokens.edit', {
      url: '/edit/{tokenId}?{restoreData:json}?',
      template: CreateTemplate,
      controller: CreateController,
      controllerAs: 'vm',
      resolve: {
        token: getToken,
        restoredata: getRestoreData,
        clonedata: function () { return null; },
        creatingFromScratch: function () { return false; },
        allTokens: getAllTokens
      }
    })
    .state('tokens.view', {
      url: '/view/{tokenId}',
      template: ViewTemplate,
      controller: ViewController,
      controllerAs: 'vm',
      resolve: {
        token: getToken,
        allTokenLogs: getAllTokenLogs
      }
    });
}

getRestoreData.$inject = ['$stateParams'];
function getRestoreData($stateParams) {
  return $stateParams.restoreData;
}

getToken.$inject = ['$stateParams', 'TokensService'];
function getToken($stateParams, TokensService) {
  return TokensService.get({
    tokenId: $stateParams.tokenId, fields: '_id,name,refreshToken,updateRate,nextUpdateTime'
  }).$promise;
}

getAllTokens.$inject = ['TokensService'];
function getAllTokens(tokensService) {
  return tokensService.query({ fields: '_id,name,updateRate,nextUpdateTime' }).$promise;
}

newToken.$inject = ['TokensService'];
function newToken(TokensService) {
  return new TokensService();
}

getAllTokenLogs.$inject = ['TokensHistoryService'];
function getAllTokenLogs(TokensHistoryService) {
  return TokensHistoryService.query({ fields: 'associated_id,createdBy,updates/(updatedAt,updatedBy)' }).$promise;
}
