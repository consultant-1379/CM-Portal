ProductsUpdateService.$inject = ['$resource', '$log'];
export default function ProductsUpdateService($resource, $log) {
  var ProductsUpdate = $resource('/api/productsUpdate/:productsUpdateId', {
    productsUpdateId: '@_id'
  }, {
    update: {
      method: 'PUT'
    }
  });

  angular.extend(ProductsUpdate.prototype, {
    createOrUpdate: function () {
      var productsUpdate = this;
      return createOrUpdate(productsUpdate);
    }
  });
  return ProductsUpdate;

  function createOrUpdate(productsUpdate) {
    if (productsUpdate._id) {
      return productsUpdate.$update(onSuccess, onError);
    }
    return productsUpdate.$save(onSuccess, onError);

    function onSuccess() {
    }

    function onError(errorResponse) {
      $log.error(errorResponse.data);
    }
  }
}
