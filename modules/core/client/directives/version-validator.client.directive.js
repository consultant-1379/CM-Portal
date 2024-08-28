import semver from 'semver';

export default function versionValidator() {
  return {
    restrict: 'A',
    require: 'ngModel',
    link: function (scope, element, attr, ngModel) {
      function validate(input) {
        ngModel.$setValidity('version', semver.valid(input));
        return input;
      }
      ngModel.$parsers.push(validate);
    }
  };
}
