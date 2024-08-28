import _ from 'lodash';
var $ = require('jquery');

TokensViewController.$inject = ['token', 'allTokenLogs', '$scope', '$state', 'Notification'];
export default function TokensViewController(token, allTokenLogs, $scope, $state, Notification) {
  var vm = this;
  var rateUpdateModal;
  vm.token = token;
  token.history = allTokenLogs.find(log => log.associated_id === token._id);
  $scope.updateRate = [{ frequency: 'Daily', pattern: '0 1 * * *' }, { frequency: 'Every Sunday', pattern: '0 0 * * 0' }, { frequency: 'Every Month', pattern: '0 0 1 * *' }];

  vm.submitRateUpdateForm = async function () {
    try {
      vm.formSubmitting = true;
      await vm.token.$changeUpdateRate();
    } catch (err) {
      vm.formSubmitting = false;
      var message = err.data ? err.data.message : err.message;
      Notification.error({
        message: message.replace(/\n/g, '<br/>'),
        title: '<i class="glyphicon glyphicon-remove"></i> Token Schedule Update error!'
      });
      return;
    }
    $state.go('tokens.list');
    Notification.success({ message: '<i class="glyphicon glyphicon-ok"></i> Token Schedule Update successful!' });
  };

  vm.openRateUpdateModal = () => {
    rateUpdateModal.style.display = 'block';
  };

  vm.closeRateUpdateModal = () => { rateUpdateModal.style.display = 'none'; };

  window.onclick = function (event) {
    if (event.target === rateUpdateModal) rateUpdateModal.style.display = 'none';
  };

  $(function () {
    rateUpdateModal = document.getElementById('rate-update-modal');
    _.defer(() => $scope.$apply());
  });
}
