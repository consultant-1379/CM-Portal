'use strict';

var mongoose = require('mongoose');
var User = mongoose.model('User');
var Role = mongoose.model('Role');

exports.isAllowed = async function (req, res, next) {
  var user = await getUserFromID(req.user);
  if (!user) return res.status(401).json({ message: 'User must be logged in' });
  var permissions = user.permissions;
  var roles = await getUserRoles(user.role_id);
  var reqRoute = req.route.path;
  var reqMethod = req.method.toLowerCase();
  var validPermissions;

  // Check against individual user permissions
  permissions.some(function (perm) {
    if (reqRoute.startsWith(`/api${perm.resources}`) && perm.methods.includes(reqMethod)) {
      validPermissions = true;
      return next();
    }
    return validPermissions;
  });

  // Check against user role permissions
  roles.pathsPermissions.some(function (perm) {
    if (perm.resources === '/*' || (reqRoute.startsWith(`/api${perm.resources}`) && perm.methods.includes(reqMethod))) {
      validPermissions = true;
      return next();
    }
    return validPermissions;
  });

  if (!validPermissions) return res.status(403).json({ message: 'User is not authorized' });
};

async function getUserFromID(userID) {
  return User.findById(userID, '-salt -password -providerData').exec();
}

async function getUserRoles(roleId) {
  return Role.findById(roleId).exec();
}
