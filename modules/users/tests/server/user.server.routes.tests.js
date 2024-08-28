'use strict';

process.env.LDAP_URL = 'ldap://ldap';
process.env.SEARCH_FILTER = '(cn={{username}})';
process.env.BASE_DN_LIST = 'dc=example,dc=org:dc=example,dc=org';
process.env.BIND_DN = 'cn=admin,dc=example,dc=org';
process.env.BIND_CREDENTIALS = 'admin';

var fs = require('fs'),
  superagentDefaults = require('superagent-defaults'),
  supertest = require('supertest'),
  mongoose = require('mongoose'),
  ldapjs = require('ldapjs'),
  passport = require('passport'),
  sinon = require('sinon'),
  User = require('../../server/models/user.server.model').Schema,
  Role = require('../../../roles/server/models/roles.server.model').Schema,
  express = require('../../../../config/lib/express');
require('should-sinon');

var app,
  agent,
  nonAuthAgent,
  localCredentials,
  ldapCredentials,
  localUser,
  localLdapUser,
  ldapSpy,
  ldapClient,
  validRole,
  validAdminRole,
  validSuperAdminRole,
  roleObject,
  validUser,
  userObject,
  response;

const ldapUser = {
  displayName: 'theDisplayName',
  givenName: 'theGivenName',
  sn: 'thesn',
  cn: 'ldapuser',
  mail: 'email@ericsson.com',
  userPassword: 'validPassword1',
  objectClass: ['person', 'organizationalPerson', 'inetOrgPerson']
};

describe('User', function () {
  before(async function () {
    app = express.init(mongoose);
    nonAuthAgent = superagentDefaults(supertest(app));
    agent = superagentDefaults(supertest(app));
    ldapClient = ldapjs.createClient({
      url: process.env.LDAP_URL
    });
    await ldapClientBind(ldapClient, process.env.BIND_DN, process.env.BIND_CREDENTIALS);

    await ldapClientAdd(ldapClient, 'cn=ldapuser,dc=example,dc=org', ldapUser);
    var otherValidPasswords = [
      'validPassword2',
      'validPassword3',
      'validPassword4',
      'validPassword5',
      'validPassword6'
    ];
    var modifyPromises = [];
    for (var x = 0; x < otherValidPasswords.length; x += 1) {
      var change = new ldapjs.Change({
        operation: 'add',
        modification: {
          userPassword: otherValidPasswords[x]
        }
      });
      modifyPromises.push(ldapClientModify(ldapClient, 'cn=ldapuser,dc=example,dc=org', change));
    }
    await Promise.all(modifyPromises);
    ldapSpy = sinon.spy(passport, 'authenticate');
  });

  beforeEach(async function () {
    ldapSpy.resetHistory();
    localCredentials = JSON.parse(fs.readFileSync('/opt/mean.js/modules/users/tests/server/test_files/local_credentials.json', 'utf8'));
    ldapCredentials = JSON.parse(fs.readFileSync('/opt/mean.js/modules/users/tests/server/test_files/ldap_credentials.json', 'utf8'));
    validUser = JSON.parse(fs.readFileSync('/opt/mean.js/modules/users/tests/server/test_files/valid_user.json', 'utf8'));
    validRole = JSON.parse(fs.readFileSync('/opt/mean.js/modules/roles/tests/server/test_files/valid_role.json', 'utf8'));
    validAdminRole = JSON.parse(fs.readFileSync('/opt/mean.js/modules/roles/tests/server/test_files/valid_admin_role.json', 'utf8'));
    validSuperAdminRole = JSON.parse(fs.readFileSync('/opt/mean.js/modules/roles/tests/server/test_files/valid_superadmin_role.json', 'utf8'));

    localUser = {
      firstName: 'Full',
      lastName: 'Name',
      displayName: 'Full Name',
      email: 'test@test.com',
      cn: localCredentials.username,
      username: localCredentials.username,
      password: localCredentials.password,
      provider: 'local'
    };

    localLdapUser = {
      firstName: 'Full',
      lastName: 'Names',
      displayName: 'Full Name',
      email: 'ldapTest@test.com',
      cn: ldapCredentials.username,
      username: ldapCredentials.username,
      password: ldapCredentials.password,
      provider: 'mockLdap'
    };

    // Create Role Object
    roleObject = new Role(validRole);
    await roleObject.save();

    // Update User role_id
    localUser.role_id = roleObject._id;
    localLdapUser.role_id = roleObject._id;

    userObject = new User(validUser);
    userObject.role_id = roleObject._id;
    await userObject.save();

    agent.auth(validUser.username, validUser.password); // Setup User Authorization
  });

  describe('Message Body Sign In / Sign Out', function () {
    it('should be able to successfully login/logout with locally cached username/password without contacting mock ldap', async function () {
      var localUserObject = new User(localUser);
      await localUserObject.save();
      await agent.post('/api/auth/signin').send(localCredentials).expect(200);
      var response = await agent.get('/api/auth/signout').expect(302);
      response.redirect.should.equal(true);
      response.text.should.equal('Found. Redirecting to /authentication/signin');
      ldapSpy.should.not.be.called();
    });

    it('should not be able login with invalid username and password', async function () {
      this.retries(10);
      var response = await agent.post('/api/auth/signin').send({ username: 'invalid', password: 'invalid' }).expect(422);
      response.redirect.should.equal(false);
      response.body.message.should.equal('Invalid username or password');
      ldapSpy.should.be.calledTwice();
    });

    it('should be able to successfully login/logout when no roles exist in db and creates roles', async function () {
      this.retries(10);
      await Role.remove().exec();
      await agent.post('/api/auth/signin').send(ldapCredentials).expect(200);
      var response = await agent.get('/api/auth/signout').expect(302);
      response.redirect.should.equal(true);
      response.text.should.equal('Found. Redirecting to /authentication/signin');
      Role.find({}, function (err, roles) {
        roles.should.have.length(3);
      });
    });

    it('should be able to successfully login/logout with username/password with mock ldap strategy', async function () {
      this.retries(10);
      await agent.post('/api/auth/signin').send(ldapCredentials).expect(200);
      var response = await agent.get('/api/auth/signout').expect(302);
      response.redirect.should.equal(true);
      response.text.should.equal('Found. Redirecting to /authentication/signin');
      ldapSpy.should.be.calledTwice();
    });

    it('should be able to successfully login/logout with uppercase username with mock ldap strategy', async function () {
      this.retries(10);
      ldapCredentials.username = 'LDAPUSER';
      await agent.post('/api/auth/signin').send(ldapCredentials).expect(200);
      var response = await agent.get('/api/auth/signout').expect(302);
      response.redirect.should.equal(true);
      response.text.should.equal('Found. Redirecting to /authentication/signin');
      ldapSpy.should.be.calledTwice();
    });

    it('should be able to successfully login/logout with username, new password and with mock ldap strategy', async function () {
      this.retries(10);
      var localLdapUserObject = new User(localLdapUser);
      await localLdapUserObject.save();
      ldapCredentials.password = 'validPassword3';
      await agent.post('/api/auth/signin').send(ldapCredentials).expect(200);
      var response = await agent.get('/api/auth/signout').expect(302);
      response.redirect.should.equal(true);
      response.text.should.equal('Found. Redirecting to /authentication/signin');
      ldapSpy.should.be.calledTwice();
    });
  });

  describe('BASIC Authentication Sign In', function () {
    it('should not log in without credentials', async function () {
      this.retries(10);
      var response = await nonAuthAgent.get('/api/logintest').expect(401);
      response.text.should.equal('Unauthorized');
    });

    it('should not log in with invalid credentials', async function () {
      this.retries(10);
      var response = await agent.get('/api/logintest').auth('invalid', 'invalid').expect(401);
      response.body.message.should.equal('Invalid username or password');
    });

    it('should log in with valid ldap credentials and create a local user', async function () {
      this.retries(10);
      var response = await agent.get('/api/logintest').auth(ldapCredentials.username, ldapCredentials.password).expect(200);
      response.body.message.should.equal('success');
      ldapSpy.should.be.calledTwice();
      var userObject = await User.findOne({ username: ldapCredentials.username }).exec();
      userObject.firstName.should.equal(ldapUser.givenName);
    });

    it('should log in with valid local credentials and not go to ldap', async function () {
      this.retries(10);
      var localLdapUserObject = new User(localLdapUser);
      await localLdapUserObject.save();
      await agent.get('/api/logintest').auth(ldapCredentials.username, ldapCredentials.password).expect(200);
      ldapSpy.should.not.be.called();
      var userObject = await User.findOne({ username: ldapCredentials.username }).exec();
      userObject.firstName.should.equal(localLdapUser.firstName);
    });

    it('should log in where local user in db has the wrong password but user has valid ldap credentials and local user should be updated', async function () {
      this.retries(10);
      var localLdapUserObject = new User(localLdapUser);
      await localLdapUserObject.save();
      await agent.get('/api/logintest').auth(ldapCredentials.username, 'validPassword4').expect(200);
      ldapSpy.should.be.calledTwice();
      ldapSpy.resetHistory();
      await agent.get('/api/logintest').auth(ldapCredentials.username, 'validPassword4').expect(200);
      ldapSpy.should.not.be.called();
    });
  });

  describe('GET Users', function () {
    var localLdapUserObject;

    beforeEach(async function () {
      localLdapUserObject = new User(localLdapUser);
      await localLdapUserObject.save();
    });

    it('should get a list of users', async function () {
      var response = await agent.get('/api/users/').expect(200);
      response.body.length.should.equal(2);
    });

    it('should be able to get a list of users when user not authenticated', async function () {
      await nonAuthAgent.get('/api/users').expect(200);
    });

    it('should be able to get a list of users when user is authenticated', async function () {
      await agent.get('/api/users/').expect(200);
    });

    it('should get a single users details', async function () {
      var response = await agent.get(`/api/users/${localLdapUserObject._id}`).expect(200);
      response.body.displayName.should.equal(localLdapUser.displayName);
      response.body.username.should.equal(localLdapUser.username);
    });

    it('should not get a single users details when specified id is invalid', async function () {
      var response = await agent.get('/api/users/000000000000000000000000').expect(404);
      response.body.message.should.equal('A User with id \'000000000000000000000000\' does not exist');
    });

    it('should be able to get a single user info when user not authenticated', async function () {
      await nonAuthAgent.get(`/api/users/${localLdapUserObject._id}`).expect(200);
    });

    it('should be able to get a single user info when user is authenticated', async function () {
      await agent.get(`/api/users/${localLdapUserObject._id}`).expect(200);
    });
  });

  describe('PUT Users', function () {
    var localLdapUserObject,
      roleObject2,
      roleObject3;

    beforeEach(async function () {
      process.env.NODE_ENV = 'policyCheckEnabled';
      localLdapUserObject = new User(localLdapUser);
      await localLdapUserObject.save();

      // Create Super Admin Role Object
      roleObject2 = new Role(validSuperAdminRole);
      await roleObject2.save();
    });

    it('should not update a users role when current user is not authenticated', async function () {
      localLdapUserObject.role_id = roleObject2._id;

      response = await nonAuthAgent.put(`/api/users/${localLdapUserObject._id}`)
        .send(localLdapUserObject).expect(401);
      response.body.message.should.equal('User must be logged in');
    });

    it('should not update a users role when current user is standard-user', async function () {
      localLdapUserObject.role_id = roleObject2._id;

      response = await agent.put(`/api/users/${localLdapUserObject._id}`)
        .auth(validUser.username, validUser.password)
        .send(localLdapUserObject).expect(403);
      response.body.message.should.equal('User is not authorized');
    });

    it('should update a users role when current user is admin', async function () {
      // Create Admin Role Object
      roleObject3 = new Role(validAdminRole);
      await roleObject3.save();

      // update localLdapUserObject to admin
      userObject.role_id = roleObject3._id;
      await userObject.save();

      localLdapUser.role_id = roleObject3._id;
      response = await agent.put(`/api/users/${localLdapUserObject._id}`)
        .auth(validUser.username, validUser.password)
        .send(localLdapUser).expect(200);
    });

    it('should update a users role when current user is super-admin', async function () {
      // update localLdapUserObject to super admin
      userObject.role_id = roleObject2._id;
      await userObject.save();

      localLdapUser.role_id = roleObject2._id;
      response = await agent.put(`/api/users/${localLdapUserObject._id}`)
        .auth(validUser.username, validUser.password)
        .send(localLdapUser).expect(200);
    });

    afterEach(async function () {
      process.env.NODE_ENV = 'test';
    });
  });

  afterEach(async function () {
    await User.remove().exec();
    await Role.remove().exec();
  });

  after(async function () {
    await ldapClientDel(ldapClient, 'cn=ldapuser,dc=example,dc=org');
  });
});

function ldapClientBind(ldapClient, user, pass) {
  return new Promise(function (resolve, reject) {
    ldapClient.bind(user, pass, function (err) {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });
}

function ldapClientDel(ldapClient, base) {
  return new Promise(function (resolve, reject) {
    ldapClient.del(base, function (err) {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });
}

function ldapClientAdd(ldapClient, base, entry) {
  return new Promise(function (resolve, reject) {
    ldapClient.add(base, entry, function (err) {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });
}

function ldapClientModify(ldapClient, base, change) {
  return new Promise(function (resolve, reject) {
    ldapClient.modify(base, change, function (err) {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });
}
