import CreateController from '../controllers/products-create.client.controller';
import CreateTemplate from '../views/products-create.client.view.html';

routeConfig.$inject = ['$stateProvider'];
export default function routeConfig($stateProvider) {
  $stateProvider
    .state('products', {
      abstract: true,
      url: '/products',
      template: '<ui-view/>'
    })
    .state('products.create', {
      url: '/create',
      template: CreateTemplate,
      controller: CreateController,
      controllerAs: 'vm',
      resolve: {
        product: newProduct,
        allUsers: getUsers
      }
    });
}

newProduct.$inject = ['ProductsService'];
function newProduct(ProductsService) {
  return new ProductsService();
}

getUsers.$inject = ['UsersService'];
function getUsers(UsersService) {
  return UsersService.query().$promise;
}
