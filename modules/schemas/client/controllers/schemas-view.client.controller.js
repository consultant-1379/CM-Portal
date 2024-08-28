SchemasViewController.$inject = ['schema', 'program'];

export default function SchemasViewController(schema, program) {
  var vm = this;
  vm.schema = schema;
  vm.program = program;
}
