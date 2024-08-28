ProductsService.$inject = ['$resource', '$log'];

export default function ProductsService($resource, $log) {
  var Product = $resource('/api/products/:productId', {
    productId: '@_id'
  }, {
    update: {
      method: 'PUT'
    }
  });

  angular.extend(Product.prototype, {
    createOrUpdate: function () {
      var product = this;
      return createOrUpdate(product);
    }
  });
  return Product;

  function createOrUpdate(product) {
    if (product._id) {
      return product.$update(onSuccess, onError);
    }
    return product.$save(onSuccess, onError);

    function onSuccess() {
    }

    function onError(errorResponse) {
      $log.error(errorResponse.data);
    }
  }
}
