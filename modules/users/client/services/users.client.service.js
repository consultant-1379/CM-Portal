UsersService.$inject = ['$resource'];

export default function UsersService($resource) {
  var User = $resource('/api/users/:userId', {
    userId: '@_id'
  }, {
    update: {
      method: 'PUT'
    },
    signin: {
      method: 'POST',
      url: '/api/auth/signin'
    }
  });

  angular.extend(User, {
    userSignin: function (credentials) {
      return this.signin(credentials).$promise;
    }
  });
  return User;
}
