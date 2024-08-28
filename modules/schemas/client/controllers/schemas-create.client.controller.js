import _ from 'lodash';
var $ = require('jquery');
require('select2')();

SchemasCreateController.$inject = ['$scope', '$state', 'schema', 'allPrograms', 'Notification', 'restoredata', 'creatingFromScratch'];

export default function SchemasCreateController($scope, $state, schema, allPrograms, Notification, restoredata, creatingFromScratch) {
  var vm = this;
  vm.allPrograms = allPrograms;
  vm.schema = schema;
  if (restoredata) {
    Object.keys(restoredata).forEach(function (key) {
      vm.schema[key] = restoredata[key];
    });
  }
  vm.formSubmitting = false;
  vm.pageTitle = (restoredata) ? 'Restoring schema' : 'Creating schema';
  vm.schemaTypes = ['projectRequest', 'other'];
  vm.submitForm = async function () {
    try {
      vm.formSubmitting = true;
      await vm.schema.createOrUpdate();
    } catch (err) {
      vm.formSubmitting = false;
      var message = err.data ? err.data.message : err.message;
      Notification.error({
        message: message.replace(/\n/g, '<br/>'),
        title: `<i class="glyphicon glyphicon-remove"></i> Schema ${vm.jobType} error!`
      });
      return;
    }
    $state.go('schemas.view', { schemaId: vm.schema._id });
    Notification.success({ message: `<i class="glyphicon glyphicon-ok"></i> Schema ${vm.jobType} successful!` });
  };

  if (restoredata) {
    Object.keys(restoredata).forEach(function (key) {
      vm.schema[key] = restoredata[key];
    });
    vm.pageTitle = 'Restoring';
    vm.jobType = 'restoration';
    vm.submitForm();
  } else {
    vm.pageTitle = creatingFromScratch ? 'Creating' : 'Editing';
    vm.jobType = creatingFromScratch ? 'creation' : 'update';
  }

  function setSelect2(selectId, placeholderName) {
    $(selectId).select2({
      placeholder: `--Select ${placeholderName}--`,
      allowClear: true
    });
  }

  $(function () {
    setSelect2('#program-select', 'Program');
    $('#program-select').on('select2:select select2:unselecting', async function () {
      var valueIsEmpty = $(this).val() === null || $(this).val() === '';
      if (valueIsEmpty) $(this).data('unselecting', true);
      vm.schema.program_id = (valueIsEmpty) ? undefined : $(this).val().replace('string:', '');
      _.defer(() => $scope.$apply());
    });
  });
}
