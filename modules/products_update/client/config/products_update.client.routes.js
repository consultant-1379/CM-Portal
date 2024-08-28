import ListController from '../controllers/products_update-list.client.controller';
import CreateController from '../controllers/products_update-create.client.controller';
import ViewController from '../controllers/products_update-view.client.controller';
import CommonListTemplate from '../../../core/client/views/common-list.view.html';
import CreateTemplate from '../views/products_update-create.client.view.html';
import ViewTemplate from '../views/products_update-view.client.view.html';

routeConfig.$inject = ['$stateProvider'];
export default function routeConfig($stateProvider) {
  $stateProvider
    .state('productsUpdate', {
      abstract: true,
      url: '/productsUpdate',
      template: '<ui-view/>'
    })

    .state('productsUpdate.list', {
      url: '',
      template: CommonListTemplate,
      controller: ListController,
      controllerAs: 'vm',
      resolve: {
        allProductsUpdates: getAllProductsUpdates,
        allRoles: getAllRoles
      }
    })
    .state('productsUpdate.create', {
      url: '/create',
      template: CreateTemplate,
      controller: CreateController,
      controllerAs: 'vm',
      resolve: {
        productsUpdate: newProductsUpdate,
        allUsers: getUsers
      }
    })
    .state('productsUpdate.view', {
      url: '/view/{productsUpdateId}',
      template: ViewTemplate,
      controller: ViewController,
      controllerAs: 'vm',
      resolve: {
        productsUpdate: getProductsUpdate
      }
    });
}

getProductsUpdate.$inject = ['$stateParams', 'ProductsUpdateService'];
function getProductsUpdate($stateParams, ProductsUpdateService) {
  return ProductsUpdateService.get({
    productsUpdateId: $stateParams.productsUpdateId
  }).$promise;
}

getAllProductsUpdates.$inject = ['ProductsUpdateService'];
function getAllProductsUpdates(productsUpdateService) {
  return productsUpdateService.query().$promise;
}

newProductsUpdate.$inject = ['ProductsUpdateService'];
function newProductsUpdate(ProductsUpdateService) {
  return new ProductsUpdateService();
}

getAllRoles.$inject = ['RolesService'];
function getAllRoles(rolesService) {
  return rolesService.query().$promise;
}

getUsers.$inject = ['UsersService'];
function getUsers(UsersService) {
  return UsersService.query().$promise;
}
