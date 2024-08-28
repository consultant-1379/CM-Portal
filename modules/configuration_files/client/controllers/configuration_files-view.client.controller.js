import _ from 'lodash';
var $ = require('jquery');
var fileSaver = require('file-saver');

ConfigurationFilesViewController.$inject = ['configurationFile', 'configurationFileLogs'];
export default function ConfigurationFilesViewController(configurationFile, configurationFileLogs) {
  var vm = this;
  vm.configurationFile = configurationFile;
  vm.configurationFileLogs = configurationFileLogs[0];
  vm.numberOfVersions = vm.configurationFile.version;
  vm.versionToDownload = undefined;
  vm.isJSON = vm.configurationFile.type === 'json';
  vm.configurationFile.content = (vm.isJSON && typeof vm.configurationFile.content === 'string') ? JSON.parse(vm.configurationFile.content) : stripExtraDataFields(vm.configurationFile.content); // eslint-disable-line max-len
  vm.allVersions = [];

  function createVersionsArray() {
    for (var i = vm.numberOfVersions; i > 0; i -= 1) {
      vm.allVersions.push(`Version: ${i}`);
    }
  }
  createVersionsArray();

  function stripExtraDataFields(content) {
    // e.g. content.data.data.data => content.data
    if (typeof content === 'object' && content !== null) {
      if ('data' in content && typeof content.data === 'object' && content.data !== null) {
        return stripExtraDataFields(content.data);
      }
    }
    return content;
  }

  $(function () {
    $('#content').each(function (index, elem) { elem.style.height = `${elem.scrollHeight}px`; });
  });

  vm.downloadFile = function () {
    var configurationFile = _.cloneDeep(vm.configurationFile);
    var requestedFileVersion = vm.versionToDownload.split('Version: ')[1];

    if (requestedFileVersion && (requestedFileVersion !== configurationFile.version.toString())) {
      var configurationFileLogs = vm.configurationFileLogs;
      if (requestedFileVersion === '1') {
        configurationFile.type = configurationFileLogs.originalData.type;
        configurationFile.content = configurationFileLogs.originalData.content;
      } else {
        configurationFile.type = returnFileTypeFromLogs(configurationFileLogs, requestedFileVersion);
        configurationFile.content = undefined;
        // if content was not changed in version x, check version before up to original data
        for (var i = requestedFileVersion; i > 0; i -= 1) {
          if (i === 1 && !configurationFile.content) configurationFile.content = configurationFileLogs.originalData.content;
          if (configurationFile.content) break;
          configurationFile.content = configurationFileLogs.updates[requestedFileVersion - 2].updateData.content;
        }
      }
    }
    if (configurationFile.content && typeof configurationFile.content === 'object') configurationFile.content = JSON.stringify(configurationFile.content, null, 2);
    var fileContents = new Blob([configurationFile.content.data || configurationFile.content], { type: 'text/plain;charset=utf-8' });
    fileSaver.saveAs(fileContents, `${configurationFile.name}.${configurationFile.type}`);
  };

  function returnFileTypeFromLogs(configurationFileLog, version) {
    if (!configurationFileLog.updates[version - 2].updateData.type) {
      var arrayIndex = version - 2;
      for (var i = arrayIndex; i >= 0; i -= 1) {
        if (configurationFileLog.updates[i].updateData.type) return configurationFileLog.updates[i].updateData.type;
        // if no changes found, use original type
        if (i === 0 && !configurationFileLog.updates[0].updateData.type) return configurationFileLog.originalData.type;
      }
    }
    return configurationFileLog.updates[version - 2].updateData.type;
  }
}
