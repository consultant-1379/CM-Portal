Authentication.$inject = ['$window'];

export default function Authentication($window) {
  var auth = {
    user: $window.user
  };

  return auth;
}
