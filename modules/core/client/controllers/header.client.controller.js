import { checkMimerStatus } from '../../../core/client/controllers/helpers.client.controller';
var $ = require('jquery');

HeaderController.$inject = ['$scope', 'Authentication', 'menuService', '$http', 'RolesService'];
export default function HeaderController($scope, Authentication, menuService, $http, RolesService) {
  var vm = this;
  vm.changeLogURL = 'https://arm1s11-eiffel004.eiffel.gic.ericsson.se:8443/nexus/content/sites/tor/CM-Portal/latest/changelog.html';
  var sideNavVisSetting = true;
  var userNavVisSetting = true;
  document.getElementById('sideNav-toggle-button').classList.add('icon-nav');

  if (env === 'development') { // eslint-disable-line no-undef
    document.title = 'DEV: DE CM Portal';
    vm.isDev = true;
  }
  window.documentOriginalTitle = document.title; // Saving Original App Title before manipulation
  vm.accountMenu = menuService.getMenu('account').items[0];
  vm.authentication = Authentication;
  vm.isCollapsed = false;
  vm.menu = menuService.getMenu('topbar');

  $http.get('/api/version')
    .then(function (response) {
      vm.version = response.data;
    });

  $scope.$on('$stateChangeSuccess', stateChangeSuccess);
  function stateChangeSuccess() {
    // Collapsing the menu after navigation
    vm.isCollapsed = false;
  }
  $scope.navbarActive = false;
  if (vm.authentication.user) {
    $scope.navbarActive = true;
  }

  $scope.showNavBar = function (status) {
    $scope.navbarActive = status;
  };

  vm.navbarToggle = function () {
    if ($('#navbar-toggle').is(':visible')) vm.isCollapsed = !vm.isCollapsed;
  };

  vm.sideNavToggle = function () {
    if (sideNavVisSetting) {
      document.getElementById('sideNav-Menu').style.width = '240px';
      document.getElementById('main-container').style.marginLeft = '200px';
      document.getElementById('main-container').style.width = 'calc(100% - 240px)';
      document.getElementById('sideNav-toggle-button').classList.remove('icon-nav');
      document.getElementById('sideNav-toggle-button').classList.add('icon-cross');
      sideNavVisSetting = false;
    } else {
      document.getElementById('sideNav-Menu').style.width = '0';
      document.getElementById('main-container').style.marginLeft = '0';
      document.getElementById('main-container').style.width = '100%';
      document.getElementById('sideNav-toggle-button').classList.remove('icon-cross');
      document.getElementById('sideNav-toggle-button').classList.add('icon-nav');
      sideNavVisSetting = true;
    }
  };

  vm.userNavToggle = function () {
    if (userNavVisSetting) {
      document.getElementById('userNav').style.width = '300px';
      document.getElementById('main-container').style.marginLeft = '-200px';
      document.getElementById('main-container').style.width = 'calc(100% - 50px)';
      document.getElementById('sub-bar').style.marginLeft = '-140px';
      if (!sideNavVisSetting) document.getElementById('sideNav-Menu').style.marginLeft = '-240px';
      userNavVisSetting = false;
    } else {
      document.getElementById('userNav').style.width = '0';
      document.getElementById('sub-bar').style.marginLeft = '0';
      var mainMargin = '0';
      var mainWidth = '100%';
      if (!sideNavVisSetting) {
        document.getElementById('sideNav-Menu').style.marginLeft = '0';
        mainMargin = '200px';
        mainWidth = 'calc(100% - 240px)';
      }
      document.getElementById('main-container').style.marginLeft = mainMargin;
      document.getElementById('main-container').style.width = mainWidth;
      userNavVisSetting = true;
    }
  };

  $(async () => {
    // Get User role
    var rolesId = (Authentication.user) ? Authentication.user.role_id : undefined;
    var allRoles = await RolesService.query({ fields: '_id,name,pathsPermissions' }).$promise;
    vm.role = allRoles.find(role => role._id === rolesId);

    // Notification
    try {
      var toolNotifications = await $http.get('/api/toolnotifications');
      var notificationData = toolNotifications.data;
      if (notificationData) {
        var enabled = notificationData.enabled;
        $scope.hasNotification = enabled;
        if (enabled) {
          var notification = notificationData.notification;
          var jiraLink = notificationData.jira;
          var scrollClass = ((notification.length > 90 && !jiraLink) || (notification.length > 60 && jiraLink)) ? 'scroll-left' : 'non-scroll';
          $('#div-scroll').attr('class', scrollClass);
          $('#text-span').html((jiraLink) ? `${notification} <a target="_blank" class="btn btn-info small-btn-notification" href="${jiraLink}" role="button"> Issue Ref` : notification);
          $(`#${scrollClass}`).show();
        }
      }
      $scope.$apply();
    } catch (err) { console.log(err); /* eslint-disable-line no-console */ }

    // Get information about upcoming upgrade and populate modal
    try {
      var upgradeToolResponse = await $http.get('/api/upgradeEmail'); // eslint-disable-line no-await-in-loop
      var latestUpgrade = upgradeToolResponse.data;
      if (latestUpgrade && !latestUpgrade.message) {
        // Populate footer and reduce 'content' container height
        $scope.footerActive = true;
        $('#footer-title,#upgrade-modal-title').each(function () { $(this).html(latestUpgrade.subject); });
        $('.content').css('bottom', '35px');
        var refactoredUpgradeEmail = latestUpgrade.refactoredUpgradeEmail;
        $('#upgrade-email-message-body').html(refactoredUpgradeEmail);
      }
      $scope.$apply();
    } catch (err) { console.log(err); /* eslint-disable-line no-console */ }

    // Find Upgrade Modal
    var upgradeModal = $('#upgrade-modal');

    $('#open-upgrade-modal').click(function () {
      upgradeModal.show();
      $scope.$apply();
    });

    $('#close-upgrade-modal').click(function () {
      upgradeModal.hide();
    });

    // When the user clicks anywhere outside of the modal, close it
    var docUpgradeModal = document.getElementById('upgrade-modal');
    window.onclick = function (event) {
      if (event.target === docUpgradeModal) upgradeModal.hide();
    };

    // Set Mimer Lock Operations Notification
    var mimerOperationsEnabled = await checkMimerStatus($http);
    if (!mimerOperationsEnabled.data) {
      $scope.mimerNotificationActive = true;
    }
    $scope.$apply();
  });
}
