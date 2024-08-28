import { permissionsCheck, historyFormatDate } from '../../../core/client/controllers/helpers.client.controller';
var _ = require('lodash');
var $ = require('jquery');
var moment = require('moment');
require('datatables')();
require('datatables.net-scroller')(window, $);

HistoryViewController.$inject = ['$scope', '$state', '$stateParams', '$window', 'log'];
export default function HistoryViewController($scope, $state, $stateParams, $window, log) {
  $scope.range = _.range;
  var vm = this;
  vm.log = parseLogData(log);
  vm.log.updates = sortOfLogData(_.cloneDeep(vm.log.updates));
  vm.objType = $stateParams.objType.substring(0, $stateParams.objType.length - 1);
  vm.htmlViewArtifact = `${vm.objType}s`;
  // Dynamically set object type name: providing capital first letter and adding a hyphen before additional uppercase letters.
  vm.objectType = vm.objType.substring(0, 1).toUpperCase() + vm.objType.substring(1, vm.objType.length).replace(/([a-z])([A-Z])/g, '$1-$2');

  vm.successIcon = '<i class="fas fa-check-circle fa-lg"></i>';
  vm.errorIcon = '<i class="fas fa-times-circle fa-lg"></i>';

  vm.formatDate = function (dateTimeString) {
    return historyFormatDate(dateTimeString, 'view');
  };

  vm.downloadJSONFile = function (jsonObj, fileName) {
    var tempElement = document.createElement('a');
    tempElement.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(jsonObj, null, '\t')));
    tempElement.setAttribute('download', fileName);
    tempElement.style.display = 'none';
    document.body.appendChild(tempElement);
    tempElement.click();
    document.body.removeChild(tempElement);
  };

  vm.restoreObject = async function (jsonObj) {
    var alertMessage = `Are you sure you want to restore this ${vm.objType}?`;
    if (log.deletedAt) {
      alertMessage += 'If restored, it will be created with a new id.';
    }
    if ($window.confirm(alertMessage)) {
      var crudState = (log.deletedAt) ? 'create' : 'edit';
      var currentObjType = (vm.objType === 'hardware') ? 'hardware' : `${vm.objType}s`;
      $state.go(`${currentObjType}.${crudState}`, { [`${vm.objType}Id`]: vm.log.associated_id, restoreData: jsonObj });
    }
  };

  vm.toggleAllVisibility = () => {
    $('[id^="update-container-"]').toggle(!$('#update-container-0').is(':visible'));
    $('[id^="update-button-"]').html(($('#update-container-0').is(':visible')) ? 'Hide Changes' : 'Show Changes');
  };

  vm.toggleChildrenVisibility = function (objectId) {
    var trElems = $(`tr[id^="${objectId}-"]`);
    var firstElemVisible = trElems.first().is(':visible');
    trElems.toggle(!firstElemVisible);
    $(`span[id^="${objectId}-"][id$="-arrow-plus"]`).each(function () { $(this).toggle(firstElemVisible); });
    $(`span[id^="${objectId}-"][id$="-arrow-minus"]`).each(function () { $(this).toggle(!firstElemVisible); });
  };

  vm.toggleElemVisibility = objectId => {
    $(`#update-container-${objectId}`).toggle();
    $(`#update-button-${objectId}`).html(($('#update-container-' + objectId).is(':visible')) ? 'Hide Changes' : 'Show Changes');
  };

  vm.isRestoreButtonVisible = function (actionType, index) {
    // Cannot restore Requests or Tokens
    if (vm.objType === 'request' || vm.objType === 'token') return false;
    switch (actionType) {
      case 'DELETED': return false;
      case 'CREATED': return (vm.log.deletedAt || vm.log.updates.length);
      case 'UPDATED': return (vm.log.deletedAt || index !== 0);
      default: return false;
    }
  };

  $scope.openMail = function (emailAddr, objName) {
    var tmpWindow = window.open(`mailto:${emailAddr}?subject=DE CM Portal Query Regarding ${vm.objectType} Object: ${objName}`, 'mail');
    tmpWindow.close();
  };

  $(() => {
    // Merge each update log-cards tables
    $('[id^="update-container"]').each(function () {
      var updateTableBody = $(this).find('.parent-update-table-body').first();
      var tableRows = $(this).find('.child-change-table-body').children();
      for (var i = 0; i < tableRows.length; i += 1) {
        updateTableBody.append($(tableRows[i]));
      }
    });

    // Remove empty tables
    $('.child-change-table-body').each(function () {
      if ($(this).children().length === 0) $(this).closest('.log-card-body').remove();
    });
  });
}

// Parse the current object log info into the desired format for HTML output
function parseLogData(log) {
  var currentData = _.cloneDeep(log.originalData);
  for (var i = 0; i < log.updates.length; i += 1) {
    log.updates[i].index = i + 1;
    getUpdateChanges(log.updates[i], currentData);
    log.updates[i].currentData = _.cloneDeep(currentData);
  }
  log.currentData = currentData;
  return log;
}

// Get the changes made for each update
function getUpdateChanges(update, currentData) {
  update.changes = [];
  for (var key in update.updateData) {
    if (Object.prototype.hasOwnProperty.call(update.updateData, key)) {
      var changeObj = getChange(currentData, update.updateData, key);
      update.changes.push(changeObj.change);
      currentData[key] = changeObj.current[key];
    }
  }
}

// Get an individual change from an update
function getChange(current, update, key) {
  var change = {
    name: key,
    childChanges: [],
    isNew: false,
    isRemoved: false
  };
  current = current || {};
  var originalValue = current[key];
  var updateValue = update[key];
  var changeObj;

  if (updateValue === 'REMOVED') {
    if (typeof originalValue === 'object') {
      change.isRemoved = true;
      for (var origKeyA in originalValue) {
        if (Object.prototype.hasOwnProperty.call(originalValue, origKeyA)) {
          changeObj = getChange(originalValue, { [origKeyA]: 'REMOVED' }, origKeyA);
          change.childChanges.push(changeObj.change);
          delete current[key];
        }
      }
    } else {
      change.origValue = originalValue || '-';
      change.newValue = 'REMOVED';
      delete current[key];
    }
  } else if (key !== 'links' && (typeof originalValue === 'object' || typeof updateValue === 'object')) {
    change.isNew = (typeof originalValue === 'undefined');
    for (var childKeyA in updateValue) {
      if (Object.prototype.hasOwnProperty.call(updateValue, childKeyA)) {
        changeObj = getChange(originalValue, updateValue, childKeyA);
        change.childChanges.push(changeObj.change);
        if (changeObj.current.constructor === Array) {
          current[key] = changeObj.current.filter(keyValue => keyValue != null);
        } else {
          current[key] = Object.assign(current[key] || {}, changeObj.current);
        }
      }
    }
  } else {
    change.origValue = originalValue || '-';
    change.newValue = updateValue;
    current[key] = updateValue;
  }

  if (current.links && !Array.isArray(current.links)) {
    // Modify current.links from object-of-objects to array-of-objects.
    current.links = Object.values(current.links);
  }

  if (change.childChanges.length < 1) delete change.childChanges;
  return { change: change, current: _.cloneDeep(current) };
}

function sortOfLogData(logUpdateData) {
  logUpdateData = logUpdateData.sort(function (left, right) {
    return moment.utc(right.updatedAt).diff(moment.utc(left.updatedAt));
  });
  return logUpdateData;
}
