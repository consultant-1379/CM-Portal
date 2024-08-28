import _ from 'lodash';
import yamljs from 'yamljs';
var $ = require('jquery');
ConfigurationFilesCreateController.$inject = [
  '$scope', '$state', '$window', 'configurationFile',
  'Notification', 'restoredata', 'creatingFromScratch'];
export default function ConfigurationFilesCreateController(
  $scope, $state, $window, configurationFile,
  Notification, restoredata, creatingFromScratch
) {
  var vm = this;
  vm.configurationFile = configurationFile;
  vm.fileTypeOptions = ['yaml', 'json', 'txt'];

  handleInputBoxForJSON();


  vm.contentBoxChangeHandler = function () {
    try {
      reassignFileContent();
      if (vm.configurationFile.type === 'yaml' && vm.configurationFile.content) yamljs.parse(vm.configurationFile.content);
      if (typeof vm.configurationFile.content === 'object') vm.configurationFile.content = JSON.stringify(vm.configurationFile.content, null, 2);
      $scope.form.filecontent.$setValidity('parse', true);
    } catch (parseErr) {
      vm.invalidContentMessage = `Parsing Error: ${parseErr.message} Area of Error: '${parseErr.snippet}'`;
      $scope.form.filecontent.$setValidity('parse', false);
    }
    _.defer(() => $scope.$apply());
  };

  vm.submitForm = async function () {
    try {
      handleInputBoxForJSON();
      reassignFileContent();

      vm.formSubmitting = true;

      await vm.configurationFile.createOrUpdate();
    } catch (err) {
      vm.formSubmitting = false;
      var message = err.data ? err.data.message : err.message;
      Notification.error({
        message: message.replace(/\n/g, '<br/>'),
        title: `<i class="glyphicon glyphicon-remove"></i> Configuration-File ${vm.jobType} error!`
      });
      return;
    }
    $state.go('configurationFiles.view', { configurationFileId: vm.configurationFile._id });
    Notification.success({ message: `<i class="glyphicon glyphicon-ok"></i> Configuration-File ${vm.jobType} successful!` });
  };


  if (restoredata) {
    Object.keys(restoredata).forEach(function (key) {
      vm.configurationFile[key] = restoredata[key];
    });
    if (restoredata.type === 'json') vm.configurationFile.content = JSON.stringify(restoredata.content);

    vm.pageTitle = 'Restoring';
    vm.jobType = 'restoration';
    vm.submitForm();
  } else {
    vm.pageTitle = creatingFromScratch ? 'Creating' : 'Editing';
    vm.jobType = creatingFromScratch ? 'creation' : 'update';
  }

  $(function () {
    vm.contentBoxChangeHandler();
    var contentBox = document.getElementById('filecontent');
    contentBox.onkeydown = textAreaTabOut;
  });

  function reassignFileContent() {
    // Reassign content of non-JSON configurationFiles so it will display in the editor
    if (vm.configurationFile.type !== 'json' && vm.configurationFile.content.data && !vm.configurationFile.content.data.data) {
      vm.configurationFile.content = `${vm.configurationFile.content.data}`;
    }

    // handle old incorrectly created non json files
    if (vm.configurationFile.type !== 'json' && vm.configurationFile.content.data && vm.configurationFile.content.data.data) {
      vm.configurationFile.content = vm.configurationFile.content.data.data;
    }
  }

  function handleInputBoxForJSON() {
    try {
      if (vm.configurationFile.type === 'json' && vm.configurationFile.content) {
        vm.configurationFile.content = (typeof vm.configurationFile.content === 'string') ? JSON.parse(vm.configurationFile.content) : JSON.stringify(vm.configurationFile.content, null, 2);
      }
    } catch (errorJSON) {
      $scope.form.filecontent.$setValidity('parse', false);
      throw new Error(errorJSON);
    }
  }

  function textAreaTabOut(e) {
    if (e.keyCode === 9) { // TAB = keyCode 9
      var oldCaretPosition = this.getCaretPosition();
      this.value = this.value.substring(0, oldCaretPosition) + '  ' + this.value.substring(oldCaretPosition, this.value.length);
      this.setCaretPosition(oldCaretPosition + 2);
      if (e.preventDefault) e.preventDefault();
    }
  }

  // For Adding Tab Support to Content Field
  HTMLTextAreaElement.prototype.getCaretPosition = function () {
    return this.selectionStart;
  };
  HTMLTextAreaElement.prototype.setCaretPosition = function (pos) {
    this.selectionStart = pos;
    this.selectionEnd = pos;
    this.focus();
  };
}
