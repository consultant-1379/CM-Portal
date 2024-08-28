TokensCreateController.$inject = ['$state', 'token', 'Notification', 'restoredata', 'creatingFromScratch'];
export default function TokensCreateController($state, token, Notification, restoredata, creatingFromScratch) {
  var vm = this;
  vm.token = token;

  vm.submitForm = async function () {
    try {
      vm.formSubmitting = true;
      await vm.token.createOrUpdate();
    } catch (err) {
      vm.formSubmitting = false;
      var message = err.data ? err.data.message : err.message;
      Notification.error({
        message: message.replace(/\n/g, '<br/>'),
        title: `<i class="glyphicon glyphicon-remove"></i> Token ${vm.jobType} error!`
      });
      return;
    }
    $state.go('tokens.view', { tokenId: vm.token._id });
    Notification.success({ message: `<i class="glyphicon glyphicon-ok"></i> Token ${vm.jobType} successful!` });
  };

  if (restoredata) {
    Object.keys(restoredata).forEach(function (key) {
      vm.token[key] = restoredata[key];
    });
    vm.pageTitle = 'Restoring';
    vm.jobType = 'restoration';
    vm.submitForm();
  } else {
    vm.pageTitle = creatingFromScratch ? 'Creating' : 'Editing';
    vm.jobType = creatingFromScratch ? 'creation' : 'update';
  }
}
