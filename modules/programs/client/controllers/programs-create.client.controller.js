ProgramsCreateController.$inject = ['$state', 'program', 'Notification', 'restoredata', 'creatingFromScratch'];
export default function ProgramsCreateController($state, program, Notification, restoredata, creatingFromScratch) {
  var vm = this;
  vm.program = program;

  vm.submitForm = async function () {
    try {
      vm.formSubmitting = true;
      await vm.program.createOrUpdate();
    } catch (err) {
      vm.formSubmitting = false;
      var message = err.data ? err.data.message : err.message;
      Notification.error({
        message: message.replace(/\n/g, '<br/>'),
        title: `<i class="glyphicon glyphicon-remove"></i> Program ${vm.jobType} error!`
      });
      return;
    }
    $state.go('programs.view', { programId: vm.program._id });
    Notification.success({ message: `<i class="glyphicon glyphicon-ok"></i> Program ${vm.jobType} successful!` });
  };

  if (restoredata) {
    Object.keys(restoredata).forEach(function (key) {
      vm.program[key] = restoredata[key];
    });
    vm.pageTitle = 'Restoring';
    vm.jobType = 'restoration';
    vm.submitForm();
  } else {
    vm.pageTitle = creatingFromScratch ? 'Creating' : 'Editing';
    vm.jobType = creatingFromScratch ? 'creation' : 'update';
  }
}
