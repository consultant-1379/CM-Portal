SchemasService.$inject = ['$resource', '$log'];
export default function SchemasService($resource, $log) {
  var Schema = $resource('/api/schemas/:schemaId', {
    schemaId: '@_id'
  }, {
    update: {
      method: 'PUT'
    }
  });

  angular.extend(Schema.prototype, {
    createOrUpdate: function () {
      var schema = this;
      return createOrUpdate(schema);
    }
  });
  return Schema;

  function createOrUpdate(schema) {
    if (schema._id) {
      return schema.$update(onSuccess, onError);
    }
    return schema.$save(onSuccess, onError);

    function onSuccess() {
    }

    function onError(errorResponse) {
      $log.error(errorResponse.data);
    }
  }
}
