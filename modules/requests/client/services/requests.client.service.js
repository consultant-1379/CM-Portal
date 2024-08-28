RequestsService.$inject = ['$resource', '$log'];

export default function RequestsService($resource, $log) {
  var Request = $resource('/api/requests/:requestId', {
    requestId: '@_id'
  }, {
    update: {
      method: 'PUT'
    }
  });

  angular.extend(Request.prototype, {
    createOrUpdate: function () {
      var request = this;
      return createOrUpdate(request);
    }
  });
  return Request;

  function createOrUpdate(request) {
    if (request._id) {
      return request.$update(onSuccess, onError);
    }
    return request.$save(onSuccess, onError);

    function onSuccess() {
    }

    function onError(errorResponse) {
      $log.error(errorResponse.data);
    }
  }
}
