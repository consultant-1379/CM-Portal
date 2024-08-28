TokensService.$inject = ['$resource', '$log'];
export default function TokensService($resource, $log) {
  var Token = $resource('/api/tokens/:tokenId', {
    tokenId: '@_id'
  }, {
    update: {
      method: 'PUT'
    },
    changeUpdateRate: {
      method: 'PUT',
      url: '/api/tokens/changeUpdateRate/:tokenId'
    }
  });

  angular.extend(Token.prototype, {
    createOrUpdate: function () {
      var token = this;
      return createOrUpdate(token);
    }
  });
  return Token;

  function createOrUpdate(token) {
    if (token._id) {
      return token.$update(onSuccess, onError);
    }
    return token.$save(onSuccess, onError);

    function onSuccess() {
    }

    function onError(errorResponse) {
      $log.error(errorResponse.data);
    }
  }
}
