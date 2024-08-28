ConfigurationFilesService.$inject = ['$resource', '$log'];
export default function ConfigurationFilesService($resource, $log) {
  var ConfigurationFile = $resource('/api/configurationFiles/:configurationFileId', {
    configurationFileId: '@_id'
  }, {
    update: {
      method: 'PUT'
    }
  });

  angular.extend(ConfigurationFile.prototype, {
    createOrUpdate: function () {
      var configurationFile = this;
      return createOrUpdate(configurationFile);
    }
  });
  return ConfigurationFile;

  function createOrUpdate(configurationFile) {
    if (configurationFile._id) {
      return configurationFile.$update(onSuccess, onError);
    }
    return configurationFile.$save(onSuccess, onError);

    function onSuccess() {
    }

    function onError(errorResponse) {
      $log.error(errorResponse.data);
    }
  }
}
