import _ from 'lodash';
import { userCompare } from '../../../core/client/controllers/helpers.client.controller';
var $ = require('jquery');
require('select2')();

ProductsCreateController.$inject = ['$window', '$state', '$scope', 'product', 'allUsers', 'Notification'];
export default function ProductsCreateController($window, $state, $scope, product, allUsers, Notification) {
  var vm = this;
  vm.product = product;
  vm.errorReturned = null;
  vm.successMessage = null;
  vm.allUsers = allUsers.sort(userCompare);
  vm.adminsAccess = [];
  vm.usersAccess = [];
  vm.productList = [];
  vm.product.designationAlias = [];
  vm.jobTypes = [
    'MS (APR-APR201, IMAGE-CXU101, SOURCE-CAV101, HELM-CXD101)',
    'Image, Source & Helm (IMAGE-CXU101, SOURCE-CAV101, HELM-CXD101)',
    'Software Library (SOFTWARE LIBRARY-CXA301, SOURCE-CAV101)',
    'SDK Library (SDK LIBRARY-CXA302, SOURCE-CAV101)',
    'Image (APR-APR201, IMAGE-CXU101, SOURCE-CAV101)',
    'Individual (IMAGE-CXU101)'
  ];

  vm.versioningScheme = ['SemVer2.0.0', 'FreeTextVersionLabel', 'Alpha-Numeric64'];

  $(function () {
    setSelect2('#adminsAccess', 'Admins');
    $('#adminsAccess').on('select2:select select2:unselect', async function () {
      var data = $('#adminsAccess').select2('data');
      vm.adminsAccess = data.map(item => { return item.id.replace('string:', ''); });
      _.defer(() => $scope.$apply());
    });

    setSelect2('#usersAccess', 'Users');
    $('#usersAccess').on('select2:select select2:unselect', async function () {
      var data = $('#usersAccess').select2('data');
      vm.usersAccess = data.map(item => { return item.id.replace('string:', ''); });
      _.defer(() => $scope.$apply());
    });
  });

  function setSelect2(selectId, placeholderName) {
    $(selectId).select2({
      tags: true,
      placeholder: `--Select ${placeholderName} or Type their Signums--`,
      allowClear: true
    });
  }

  vm.submitForm = async function () {
    try {
      vm.successMessage = [];
      vm.errorReturned = [];
      vm.formSubmitting = true;
      vm.product.adminsAccess = vm.adminsAccess;
      vm.product.usersAccess = vm.usersAccess;
      await vm.product.createOrUpdate();
    } catch (err) {
      vm.formSubmitting = false;
      if (err.data.message) {
        for (var key in err.data.message) {
          if (err.data.message[key].startsWith('Err')) vm.errorReturned.push(errorMessageHandler(err.data.message[key]));
          else vm.successMessage.push(err.data.message[key]);
        }
      }
      Notification.error({
        title: '<i class="glyphicon glyphicon-remove"></i> Some/All Products creation failed!'
      });
      return;
    }
    // if successfull, vm.product becomes response from server
    vm.successMessage = vm.product.message;
    Notification.success({ message: '<i class="glyphicon glyphicon-ok"></i> Products created successfully!' });
  };

  vm.addDesignationAlias = function () {
    vm.product.designationAlias.push('');
  };

  vm.removeDesignationAlias = function (designationAliasIndex) {
    var designationAlias = vm.product.designationAlias[designationAliasIndex];
    if ($window.confirm(`Are you sure you want to remove this Designation Alias ${designationAliasIndex + 1}: "${designationAlias}"?`)) {
      vm.product.designationAlias.splice(designationAliasIndex, 1);
    }
  };

  function errorMessageHandler(err) {
    if (!err.includes('||')) return [{ creating: err }];
    var object = [];
    var splitErr = err.split('||');
    object.push({
      creating: splitErr[0],
      code: splitErr[1],
      operation: splitErr[2],
      messages: splitErr[3]
    });
    return object;
  }
}
