exports.getService = function (objType) {
  getHistoryService.$inject = ['$resource'];
  async function getHistoryService($resource) {
    var Log = await $resource(`/api/logs/${objType}/:objId`, {
      objId: '@associated_id'
    });
    return Log;
  }
  return getHistoryService;
};
