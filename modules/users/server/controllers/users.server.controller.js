'use strict';

var mongoose = require('mongoose'),
  ldapPromise = require('ldapjs-promise'),
  User = mongoose.model('User'),
  _ = require('lodash'),
  errorHandler = require('../../../../modules/core/server/controllers/errors.server.controller'),
  helperHandler = require('../../../core/server/controllers/helpers.server.controller'),
  ldap = require('../../../../config/lib/ldap'),
  commonController = require('../../../core/server/controllers/common.server.controller');
var dependentModelsDetails = [];
var sortOrder = 'name';
commonController = commonController(User, dependentModelsDetails, sortOrder);

exports.signin = async function (req, res) {
  try {
    var user = await ldap.signinFromLoginPage(req, res);
    user.password = undefined;
    user.salt = undefined;
    res.json(user);
  } catch (err) {
    return res.status(422).send({
      message: errorHandler.getErrorMessage(err)
    });
  }
};

exports.read = function (req, res) {
  var modelInstance = req.User ? req.User.toJSON() : {};
  var strippedModelInstance = {
    _id: modelInstance._id,
    displayName: modelInstance.displayName,
    username: modelInstance.username,
    email: modelInstance.email,
    role_id: modelInstance.role_id,
    permissions: modelInstance.permissions
  };
  res.json(strippedModelInstance);
};

exports.signout = function (req, res) {
  req.logout();
  res.redirect('/authentication/signin');
};

exports.list = async function (req, res) {
  try {
    var users = await User.find({}, '-salt -password -providerData').sort('-created').populate('user', 'displayName').exec();
    res.json(users);
  } catch (err) {
    return res.status(422).send({
      message: errorHandler.getErrorMessage(err)
    });
  }
};

exports.findById = commonController.findById;

exports.update = async function (req, res) {
  try {
    var user = await User.findByIdAndUpdate(
      req.body._id,
      {
        role_id: req.body.role_id,
        permissions: req.body.permissions
      }
    );
    res.json(user);
  } catch (err) {
    return res.status(422).send({
      message: errorHandler.getErrorMessage(err)
    });
  }
};

exports.findUser = async function (username) {
  var user = await User.findOne({ username: username });
  if (user) return username;
  if (process.env.ISTEST) return username;
  var baseDNArray;
  var baseDNList = process.env.BASE_DN_LIST;
  if (baseDNList) baseDNArray = baseDNList.split(':');
  var ldapUser;
  var dn = `CN= ${process.env.DTTADM100_USERNAME},OU=CA,OU=SvcAccount,OU=P001,OU=ID,OU=Data,DC=ericsson,DC=se`;
  var client = ldapPromise.createClient({
    url: process.env.LDAP_URL
  });

  await client.bind(dn, process.env.DTTADM100_PASSWORD);
  await helperHandler.asyncForEach(baseDNArray, async function (baseDN) {
    try {
      ldapUser = await client.searchReturnAll(`cn=${username},${baseDN}`);
      if (ldapUser) {
        user = new User();
        user.displayName = ldapUser.entries[0].displayName;
        user.firstName = ldapUser.entries[0].givenName ? ldapUser.entries[0].givenName.trim() : 'unknownFN';
        user.lastName = ldapUser.entries[0].sn ? ldapUser.entries[0].sn.trim() : 'unknownLN';
        user.username = ldapUser.entries[0].cn ? ldapUser.entries[0].cn.trim() : 'unknownUN';
        user.email = ldapUser.entries[0].mail || ldapUser.entries[0].displayName.replace(/ /g, '') + '@ericsson.com';
        await user.save();
      }
    } catch (err) {
      /**/
    }
  });
  return ldapUser;
};
