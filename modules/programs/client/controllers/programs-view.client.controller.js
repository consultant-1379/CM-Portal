ProgramsViewController.$inject = ['program', 'dependentRequests'];
export default function ProgramsViewController(program, dependentRequests) {
  var vm = this;
  vm.program = program;
  vm.dependentRequests = dependentRequests;
}
