RequestsViewController.$inject = ['request', 'schema', 'program'];

export default function RequestsViewController(request, schema, program) {
  var vm = this;
  vm.request = request;
  vm.schema = schema;
  vm.program = program;
  vm.jiraIssueUrl = `https://${schema.content.definitions.jiraUrl.default}/browse/${request.jira}`;

  vm.preFilter = function (obj) {
    var jsonArray = [];
    for (var key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        jsonArray.push([key, obj[key]]);
      }
    }
    return jsonArray;
  };
}
