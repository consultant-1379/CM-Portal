import Ajv from 'ajv';
import _ from 'lodash';
import 'angular-bootstrap-multiselect';
import { sleep, floatingSaveButton } from '../../../core/client/controllers/helpers.client.controller';
var http = require('http');
var $ = require('jquery');
require('select2')();
var draft06Schema = require('ajv/lib/refs/json-schema-draft-06.json');

RequestsCreateController.$inject = ['$scope', '$state', 'request', 'schemas', 'programs', 'Notification'];
export default function RequestsCreateController($scope, $state, request, schemas, programs, Notification) {
  var vm = this;
  vm.pageTitle = 'Creating';
  var ajv = new Ajv({ useDefaults: true, removeAdditional: true });
  ajv.addMetaSchema(draft06Schema);
  var ajvAddDefaultsAndRemoveAdditionalKeys;
  vm.request = request;
  vm.request.content = {};
  vm.schemas = schemas.filter(sche => sche.category === 'projectRequest');
  vm.programs = programs;

  function setSelect2(selectId, placeholderName) {
    $(selectId).select2({
      placeholder: `--Select ${placeholderName}--`,
      allowClear: true
    });
  }

  $(document).ready(function () {
    setSelect2('#program-select', 'Program');
    $('#program-select').on('select2:select select2:unselecting', async function () {
      if ($(this).val() === null || $(this).val() === '') {
        $(this).data('unselecting', true);
        vm.request.program_id = undefined;
      } else {
        vm.request.program_id = $(this).val().replace('string:', '');
        updateVisibleSchemas(vm.request.program_id);
        setSelect2('#schema', 'Schema');
      }
      _.defer(() => $scope.$apply());
    });
    setSelect2('#schema-select', 'Schema');
    $('#schema-select').on('select2:select select2:unselecting', async function () {
      if ($(this).val() === null || $(this).val() === '') {
        $(this).data('unselecting', true);
        vm.request.schema_id = undefined;
      } else {
        vm.request.schema_id = $(this).val().replace('string:', '');
        var currentSchema = vm.schemas.find(schema => schema._id === vm.request.schema_id);
        vm.request.content = {};
        var unmodifiedSchema = currentSchema;
        if (!_.isEqual(vm.modifiedSchema, unmodifiedSchema.content)) {
          vm.modifiedSchema = unmodifiedSchema.content;
          ajvAddDefaultsAndRemoveAdditionalKeys = ajv.compile(unmodifiedSchema.content);
          vm.addDefaultsAndRemoveAdditionalKeys();
        }
        if (unmodifiedSchema.content.properties.parameters) {
          vm.schemaForm = getSchemaForm(currentSchema);
        }
      }
      _.defer(() => $scope.$apply());
    });
    floatingSaveButton();
  });

  function updateVisibleSchemas(programId) {
    vm.schemas = schemas.filter(sche => sche.program_id === programId);
    vm.schemaForm = ['*'];
  }

  vm.schemaFormOptions = {
    validateOnRender: true
  };
  vm.schemaForm = ['*'];

  function getSchemaForm(schema) {
    var refValue;
    var defKeyName;
    var validationMsg;
    var title;
    var description;
    var formList = [];
    var propertiesParameters = schema.content.properties.parameters;
    var hiddenFields = ['jiraUrl', 'jiraProgram', 'jiraComponents', 'jiraLabels', 'jiraTeamName', 'jiraLocationSite', 'jiraProject'];
    for (var keyName in propertiesParameters.properties) {
      if (Object.prototype.hasOwnProperty.call(propertiesParameters.properties, keyName) && !hiddenFields.includes(keyName)) {
        validationMsg = '';
        title = '';
        description = 'Info: ';
        var formType = 'text';

        if (propertiesParameters.required && propertiesParameters.required.indexOf(keyName) !== -1) validationMsg = 'Required: ';
        if (propertiesParameters.properties[keyName].title) {
          title += propertiesParameters.properties[keyName].title;
          validationMsg += schema.content.definitions[defKeyName].error_message;
          description += schema.content.definitions[defKeyName].description || 'N/A';
          if (propertiesParameters.properties[keyName].enum) formType = 'select';
        } else {
          refValue = propertiesParameters.properties[keyName].$ref;
          defKeyName = refValue.substring(refValue.lastIndexOf('/') + 1, refValue.length);
          title += schema.content.definitions[defKeyName].title;
          validationMsg += schema.content.definitions[defKeyName].error_message;
          description += schema.content.definitions[defKeyName].description || 'N/A';
          if (schema.content.definitions[defKeyName].enum) formType = 'select';
        }

        formList.push({
          key: 'parameters.' + keyName,
          title: title,
          type: formType,
          validationMessage: validationMsg, // when there is error show it.
          description: description // description before error
        });
      }
    }
    return formList;
  }

  vm.addDefaultsAndRemoveAdditionalKeys = function () {
    ajvAddDefaultsAndRemoveAdditionalKeys(vm.request.content);
  };

  vm.submitForm = async function () {
    try {
      vm.formSubmitting = true;
      await vm.request.createOrUpdate();
    } catch (err) {
      vm.formSubmitting = false;
      Notification.error({ message: err.data.message.replace(/\n/g, '<br/>'), title: '<i class="glyphicon glyphicon-remove"></i> Request creation error!' });
      return;
    }
    $state.go('requests.view', { requestId: vm.request._id });
    Notification.success({ message: '<i class="glyphicon glyphicon-ok"></i> Request creation successful!' });
  };
}
