import _ from 'lodash';
import { userCompare } from '../../../core/client/controllers/helpers.client.controller';
var $ = require('jquery');
require('select2')();

var helpersController = require('../../../core/client/controllers/helpers.client.controller');

ProductsUpdateCreateController.$inject = ['$state', '$scope', 'productsUpdate', 'allUsers', 'Notification'];
export default function ProductsUpdateCreateController($state, $scope, productsUpdate, allUsers, Notification) {
  var vm = this;
  vm.productsUpdate = productsUpdate;
  vm.signums = [];
  vm.productsActions = ['Add', 'Remove'];
  vm.allUsers = allUsers.sort(userCompare);
  vm.productsUpdate.adminsOrUsers = 'Users';
  var initiateArrays = ['accessControlGroups', 'signums', 'productNumbers'];
  initiateArrays.forEach(function (array) {
    if (!vm.productsUpdate[array] || vm.productsUpdate[array].length === 0) {
      vm.productsUpdate[array] = [];
    }
  });

  $(function () {
    setSelect2('#signums-select', 'or Type Signum(s)');
    $('#signums-select').on('select2:select select2:unselect', async function () {
      var data = $('#signums-select').select2('data');
      vm.signums = data.map(item => { return item.id.replace('string:', ''); });
      _.defer(() => $scope.$apply());
    });
  });

  function setSelect2(selectId, placeholderName) {
    $(selectId).select2({
      tags: true,
      placeholder: `--Select ${placeholderName}--`,
      allowClear: true
    });
  }

  vm.submitForm = async function () {
    vm.productsUpdate.signums = vm.signums;
    try {
      // Remove whitespace, trailing comma,
      var productNumbers = vm.productNumbers.replace(/\s/g, '').replace(/(,$)/g, '').split(/[,]+/);
      productNumbers.forEach(productNumber => helpersController.validateProductNumber(productNumber));
      // Remove Duplicates
      vm.productsUpdate.productNumbers = helpersController.removeDuplicates(productNumbers);
      // Convert Groups String into Array, trim and remove Duplicate entries
      if (vm.accessControlGroups) {
        var accessControlGroups = vm.accessControlGroups.split(/[,]+/);
        var array = helpersController.removeDuplicates(accessControlGroups);
        vm.productsUpdate.accessControlGroups = array.map(element => {
          return element.trim();
        });
      }
      vm.formSubmitting = true;
      await vm.productsUpdate.createOrUpdate();
    } catch (submitFormError) {
      vm.formSubmitting = false;
      var message = submitFormError.data ? submitFormError.data.message : submitFormError.message;
      Notification.error({
        message: message.replace(/\n/g, '<br/>'),
        title: '<i class="glyphicon glyphicon-remove"></i> Products Update error!'
      });
      return;
    }
    $state.go('productsUpdate.view', { productsUpdateId: vm.productsUpdate._id });
  };
}
