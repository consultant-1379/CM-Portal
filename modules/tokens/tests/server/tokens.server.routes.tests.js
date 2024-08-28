'use strict';

var fs = require('fs');
var should = require('should'),
  superagentDefaults = require('superagent-defaults'),
  supertest = require('supertest'),
  mongoose = require('mongoose'),
  _ = require('lodash'),
  requestPromise = require('request-promise'),
  sinon = require('sinon'),
  History = require('../../../history/server/models/history.server.model').getSchema('tokens'),
  Token = require('../../server/models/tokens.server.model').Schema,
  User = require('../../../users/server/models/user.server.model').Schema,
  Role = require('../../../roles/server/models/roles.server.model').Schema,
  express = require('../../../../config/lib/express');
var mimerHandler = require('../../../core/server/controllers/mimer.server.controller');

var app,
  agent,
  nonAuthAgent,
  validToken,
  badToken,
  tokenReturned,
  tokenObject,
  count,
  response,
  logReturned,
  validRole,
  validSuperAdminRole,
  validAdminRole,
  validUser,
  userObject,
  roleObject,
  role2Object;

describe('Tokens', function () {
  before(async function () {
    app = express.init(mongoose);
    nonAuthAgent = superagentDefaults(supertest(app));
    agent = superagentDefaults(supertest(app));
  });

  beforeEach(async function () {
    validToken = JSON.parse(fs.readFileSync('/opt/mean.js/modules/tokens/tests/server/test_files/valid_token.json', 'utf8'));
    validRole = JSON.parse(fs.readFileSync('/opt/mean.js/modules/roles/tests/server/test_files/valid_role.json', 'utf8'));
    validSuperAdminRole = JSON.parse(fs.readFileSync('/opt/mean.js/modules/roles/tests/server/test_files/valid_superadmin_role.json', 'utf8'));
    validAdminRole = JSON.parse(fs.readFileSync('/opt/mean.js/modules/roles/tests/server/test_files/valid_admin_role.json', 'utf8'));
    validUser = JSON.parse(fs.readFileSync('/opt/mean.js/modules/users/tests/server/test_files/valid_user.json', 'utf8'));

    // Super-Admin Role Setup
    role2Object = new Role(validSuperAdminRole);
    await role2Object.save();

    // SuperAdmin Setup
    validUser.role_id = role2Object._id;
    userObject = new User(validUser);
    await userObject.save();

    agent.auth(validUser.username, validUser.password); // Setup User Authorization
  });

  describe('POST', function () {
    beforeEach( function () {
      var mockResponse = {'refresh_token': 'REFRESHTOKEN', 'access_token': 'ACCESSTOKEN'};
      sinon.stub(mimerHandler, 'getAuthRefresh').withArgs(sinon.match.any, sinon.match.any).returns(mockResponse);
    });

    it('should create a new Token and check db', async function () {
      response = await agent
        .post('/api/tokens')
        .send(validToken)
        .expect(201);
      response.body._id.should.have.length(24);
      response.headers.location.should.equal(`/api/tokens/${response.body._id}`);
      response.body.name.should.equal(validToken.name);
      tokenReturned = await Token.findById(response.body._id).exec();
      tokenReturned.name.should.equal(validToken.name);
    });

    it('should not create a new Token when user is not authenticated', async function () {
      response = await nonAuthAgent.post('/api/tokens').send(validToken).expect(401);
      response.body.message.should.equal('User must be logged in');
    });

    it('should not create a new Token when user is standard-user', async function () {
      // Default User Role
      roleObject = new Role(validRole);
      await roleObject.save();

      // User Setup
      userObject.role_id = roleObject._id;
      await userObject.save();
      response = await agent.post('/api/tokens').auth(validUser.username, validUser.password).send(validToken).expect(403);
      response.body.message.should.equal('User is not authorized');
    });

    it('should create a new Token when user is admin', async function () {
      // Admin Role
      roleObject = new Role(validAdminRole);
      await roleObject.save();

      // Admin User Setup
      userObject.role_id = roleObject._id;
      await userObject.save();
      await agent.post('/api/tokens').auth(validUser.username, validUser.password).send(validToken).expect(201);
    });

    it('should create a new Token when user is super-admin', async function () {
      // Super-Admin Role
      userObject.role_id = role2Object._id;
      await userObject.save();
      await agent.post('/api/tokens').auth(validUser.username, validUser.password).send(validToken).expect(201);
    });

    it('should not post more than one Token', async function () {
      validToken.accessToken = 'ACCESSTOKEN';
      tokenObject = new Token(validToken);
      await tokenObject.save();
      response = await agent.post('/api/tokens').send(validToken);
      response.body.message.should.equal('Only 1 Token allowed in DB.');
    });

    it('should not post Token with a name less than 2 characters', async function () {
      badToken = _.cloneDeep(validToken);
      badToken.name = 'X';
      response = await agent.post('/api/tokens').send(badToken).expect(400);
      response.body.message.should.equal('Path `name` (`' + badToken.name + '`) is shorter than the minimum allowed length (2).');
    });

    it('should not post a Token without a name key', async function () {
      badToken = _.cloneDeep(validToken);
      delete badToken.name;
      response = await agent.post('/api/tokens').send(badToken).expect(400);
      response.body.message.should.equal('Path `name` is required.');
    });

    it('should respond with bad request with invalid json', async function () {
      badToken = '{';
      response = await agent.post('/api/tokens').send(badToken).type('json').expect(400);
      response.body.message.should.equal('There was a syntax error found in your request, please make sure that it is valid and try again');
    });

    it('should not post Token when token error', async function () {
      // Setup
      var mockResponse = {'error': "MIMER Simulated Error"};
      sinon.restore();
      sinon.stub(mimerHandler, 'getAuthRefresh').withArgs(sinon.match.any, sinon.match.any).returns(mockResponse);
      response = await agent.post('/api/tokens/').send(validToken).expect(422);
      response.body.message.should.equal('"MIMER Simulated Error"');
      });

    it('should post a new log with user-details when a Token is created by a logged-in user', async function () {
      response = await agent.post('/api/tokens').send(validToken).expect(201);
      response.body._id.should.have.length(24);
      response.headers.location.should.equal(`/api/tokens/${response.body._id}`);
      response.body.name.should.equal(validToken.name);
      tokenReturned = await Token.findById(response.body._id).exec();
      tokenReturned.name.should.equal(validToken.name);

      logReturned = await History.findOne({ associated_id: response.body._id }).exec();
      logReturned.originalData.should.not.equal(undefined);
      logReturned.originalData.name.should.equal(validToken.name);
      logReturned.createdAt.should.not.equal(undefined);
      logReturned.createdBy.should.not.equal(undefined);
      logReturned.createdBy.username.should.equal(validUser.username);
      logReturned.createdBy.email.should.equal(validUser.email);
      logReturned.updates.should.be.instanceof(Array).and.have.lengthOf(0);
    });

    it('should not post a new log for a Token that is created with a name beginning with \'A_Health_\'', async function () {
      var validTokenHealth = _.cloneDeep(validToken);
      validTokenHealth.name = 'A_HEALTH_TOKEN';
      response = await agent.post('/api/tokens').send(validTokenHealth).expect(201);
      response.body._id.should.have.length(24);
      response.headers.location.should.equal(`/api/tokens/${response.body._id}`);
      response.body.name.should.equal(validTokenHealth.name);
      tokenReturned = await Token.findById(response.body._id).exec();
      tokenReturned.name.should.equal(validTokenHealth.name);

      logReturned = await History.findOne({ associated_id: response.body._id }).exec();
      should.not.exist(logReturned);
    });

    afterEach(async function () {
      sinon.restore();
    });
  });

  describe('GET', function () {
    beforeEach(async function () {
      validToken.accessToken = 'ACCESSTOKEN';
      tokenObject = new Token(validToken);
      await tokenObject.save();
    });

    it('should be able to get empty token list', async function () {
      await tokenObject.remove();
      response = await agent.get('/api/tokens').expect(200);
      response.body.should.be.instanceof(Array).and.have.lengthOf(0);
    });

    it('should not be able to get tokens when user not authenticated', async function () {
      response = await nonAuthAgent.get('/api/tokens').expect(401);
      response.body.message.should.equal('User must be logged in');

    });

    it('should be able to get tokens when user is authenticated', async function () {
      await agent.get('/api/tokens').expect(200);
    });

    it('should be able to get token list with one element', async function () {
      response = await agent.get('/api/tokens').expect(200);
      response.body.should.be.instanceof(Array).and.have.lengthOf(1);
      response.body[0].name.should.equal(validToken.name);
    });

    it('should be able to get a single token', async function () {
      response = await agent.get(`/api/tokens/${tokenObject._id}`).expect(200);
      response.body.name.should.equal(validToken.name);
    });

    it('should not be able to get single token when user not authenticated', async function () {
      response = await nonAuthAgent.get(`/api/tokens/${tokenObject._id}`).expect(401);
      response.body.message.should.equal('User must be logged in');
    });

    it('should be able to get single token when user is authenticated', async function () {
      await agent.get(`/api/tokens/${tokenObject._id}`).expect(200);
    });

    it('should throw 404 when id is not in database', async function () {
      response = await agent.get('/api/tokens/000000000000000000000000').expect(404);
      response.body.message.should.equal('A Token with id \'000000000000000000000000\' does not exist');
    });

    it('should throw 404 when id is invalid in the database', async function () {
      response = await agent.get('/api/tokens/0').expect(404);
      response.body.message.should.equal('A Token with id \'0\' does not exist');
    });
  });

  describe('PUT', function () {
    beforeEach(async function () {
      validToken.accessToken = 'ACCESSTOKEN';
      tokenObject = new Token(validToken);
      await tokenObject.save();

      var mockResponse = {"refresh_token": "REFRESHTOKEN", "access_token": "ACCESSTOKEN"};
      sinon.stub(mimerHandler, 'getAuthRefresh').withArgs(sinon.match.any, sinon.match.any).returns(mockResponse);
    });
    it('should not update current token when current user is not authenticated', async function () {
      response = await nonAuthAgent.put(`/api/tokens/${tokenObject._id}`)
        .send(validToken).expect(401);
      response.body.message.should.equal('User must be logged in');
    });

    it('should not update current token when current user is standard-user', async function () {
      // Default User Role
      roleObject = new Role(validRole);
      await roleObject.save();

      // User Setup
      userObject.role_id = roleObject._id;
      await userObject.save();
      validToken.updateRate = '* * * * 1';
      response = await agent.put(`/api/tokens/${tokenObject._id}`)
        .send(validToken)
        .expect(403);
      response.body.message.should.equal('User is not authorized');
    });

    it('should update current token when current user is admin-user', async function () {
      // Admin Role
      roleObject = new Role(validAdminRole);
      await roleObject.save();

      // Admin User Setup
      userObject.role_id = roleObject._id;
      await userObject.save();
      tokenObject.accessToken = 'updatedAccessToken';
      await agent.put(`/api/tokens/${tokenObject._id}`)
        .send(tokenObject)
        .expect(200);
    });

    it('should update current token when current user is super-admin', async function () {
      // Super-Admin Role
      userObject.role_id = role2Object._id;
      await userObject.save();
      tokenObject.accessToken = 'updatedAccessToken';
      response = await agent.put(`/api/tokens/${tokenObject._id}`)
        .send(tokenObject).expect(200);;
    });

    it('should not update current token with invalid token id', async function () {
      response = await agent.put(`/api/tokens/000000000000000000000000`)
        .send(validToken).expect(404);
        response.body.message.should.equal('A Token with id \'000000000000000000000000\' does not exist');
    });

    it('should not update current token when token error', async function () {
      // Setup
      var mockResponse = {'error': "MIMER Simulated Error"};
      sinon.restore();
      sinon.stub(mimerHandler, 'getAuthRefresh').withArgs(sinon.match.any, sinon.match.any).returns(mockResponse);
      response = await agent.put(`/api/tokens/${tokenObject._id}`).send(validToken).expect(422);
      response.body.message.should.equal('"MIMER Simulated Error"');
      });

    it('should not update current token when there is error', async function () {
    // Setup
    sinon.mock(Token).expects('findByIdAndUpdate').throws(new Error('Simulated Error.'));
    response = await agent.put(`/api/tokens/${tokenObject._id}`).send(validToken).expect(422);
    response.body.message.should.equal('Simulated Error.');
    });



    afterEach(async function () {
      sinon.restore();
    });
  });

  describe('PUT Update-Rate updates', function () {
    beforeEach(async function () {
      validToken.accessToken = 'ACCESSTOKEN';
      validToken.updateRate = '* * * * *';
      tokenObject = new Token(validToken);
      await tokenObject.save();
    });
    it('should not update current update-rate when current user is not authenticated', async function () {
      response = await nonAuthAgent.put(`/api/tokens/changeUpdateRate/${tokenObject._id}`)
        .send(validToken).expect(401);
      response.body.message.should.equal('User must be logged in');
    });

    it('should not update current update-rate when current user is standard-user', async function () {
      // Default User Role
      roleObject = new Role(validRole);
      await roleObject.save();

      // User Setup
      userObject.role_id = roleObject._id;
      await userObject.save();
      validToken.updateRate = '* * * * 1';
      response = await agent.put(`/api/tokens/changeUpdateRate/${tokenObject._id}`)
        .send(validToken)
        .expect(403);
      response.body.message.should.equal('User is not authorized');
    });

    it('should update current update-rate when current user is admin-user', async function () {
      // Admin Role
      roleObject = new Role(validAdminRole);
      await roleObject.save();

      // Admin User Setup
      userObject.role_id = roleObject._id;
      await userObject.save();

      validToken.updateRate = '* * * * 1';
      await agent.put(`/api/tokens/changeUpdateRate/${tokenObject._id}`)
        .send(validToken)
        .expect(200);
    });

    it('should update current update-rate when  current user is super-admin', async function () {
      // Super-Admin Role
      userObject.role_id = role2Object._id;
      await userObject.save();

      validToken.updateRate = '* * * * 1';
      await agent.put(`/api/tokens/changeUpdateRate/${tokenObject._id}`)
        .send(validToken)
        .expect(200);
    });

    it('should not update current update-rate with invalid token id', async function () {
      validToken.updateRate = '* * * * 1';
      response = await agent.put(`/api/tokens/changeUpdateRate/000000000000000000000000`)
        .send(validToken).expect(404);
        response.body.message.should.equal('A Token with id \'000000000000000000000000\' does not exist');
    });

    it('should not update current update-rate with invalid token', async function () {
     // Setup
     sinon.mock(Token).expects('findByIdAndUpdate').throws(new Error('Simulated Error.'));
     response = await agent.put(`/api/tokens/changeUpdateRate/${tokenObject._id}`).send(validToken).expect(422);
     response.body.message.should.equal('Simulated Error.');
    });
  });

  describe('DELETE', function () {
    beforeEach(async function () {
      validToken.accessToken = 'ACCESSTOKEN';
      tokenObject = new Token(validToken);
      await tokenObject.save();
    });

    it('should delete a token and check its response and the db', async function () {
      response = await agent.delete(`/api/tokens/${tokenObject._id}`).expect(200);
      response.body.should.be.instanceof(Object);
      response.body.name.should.equal(tokenObject.name);
      count = await Token.count().exec();
      count.should.equal(0);
    });

    it('should not delete a token when user is not authenticated', async function () {
      response = await nonAuthAgent.delete(`/api/tokens/${tokenObject._id}`).expect(401);
      response.body.message.should.equal('User must be logged in');
    });

    it('should not delete a token when user is standard-user', async function () {
      // Default User Role
      roleObject = new Role(validRole);
      await roleObject.save();

      // User Setup
      userObject.role_id = roleObject._id;
      await userObject.save();
      response = await agent.delete(`/api/tokens/${tokenObject._id}`).auth(validUser.username, validUser.password).expect(403);
      response.body.message.should.equal('User is not authorized');
    });

    it('should delete a token when user is admin', async function () {
      // Admin User Role Setup
      roleObject = new Role(validAdminRole);
      await roleObject.save();
      userObject.role_id = roleObject._id;
      await userObject.save();
      await agent.delete(`/api/tokens/${tokenObject._id}`).auth(validUser.username, validUser.password).expect(200);
    });

    it('should delete a token when user is super-admin', async function () {
      // Super-Admin Role
      userObject.role_id = role2Object._id;
      await userObject.save();
      await agent.delete(`/api/tokens/${tokenObject._id}`).auth(validUser.username, validUser.password).expect(200);
    });

    it('should fail when attempting to delete a token that does not exist', async function () {
      response = await agent.delete('/api/tokens/000000000000000000000000').expect(404);
      response.body.message.should.equal('A Token with id \'000000000000000000000000\' does not exist');
    });

    it('should update an existing log with user-details for a token thats deleted by a logged-in user', async function () {
      response = await agent.delete(`/api/tokens/${tokenObject._id}`).expect(200);
      response.body._id.should.have.length(24);
      response.body._id.should.equal(tokenObject._id.toString());

      logReturned = await History.findOne({ associated_id: response.body._id }).exec();
      logReturned.originalData.should.not.equal(undefined);
      logReturned.originalData.name.should.equal(validToken.name);

      logReturned.updates.should.be.instanceof(Array).and.have.lengthOf(0);
      logReturned.deletedAt.should.not.equal(undefined);
      logReturned.deletedBy.should.not.equal(undefined);
      logReturned.deletedBy.username.should.equal(validUser.username);
      logReturned.deletedBy.email.should.equal(validUser.email);
    });

    it('should create a log with defined user-details for a token that gets deleted by a logged-in user', async function () {
      // clear logs and verify
      await History.remove().exec();
      logReturned = await History.findOne({ associated_id: response.body._id }).exec();
      should.not.exist(logReturned);

      response = await agent.delete(`/api/tokens/${tokenObject._id}`).expect(200);
      response.body._id.should.have.length(24);
      response.body._id.should.equal(tokenObject._id.toString());

      logReturned = await History.findOne({ associated_id: response.body._id }).exec();
      logReturned.originalData.should.not.equal(undefined);
      logReturned.originalData.name.should.equal(validToken.name);

      logReturned.updates.should.be.instanceof(Array).and.have.lengthOf(0);
      logReturned.deletedAt.should.not.equal(undefined);
      logReturned.deletedBy.should.not.equal(undefined);
      logReturned.deletedBy.username.should.equal(validUser.username);
      logReturned.deletedBy.email.should.equal(validUser.email);
    });
  });

  describe('SEARCH', function () {
    beforeEach(async function () {
      validToken.accessToken = 'ACCESSTOKEN';
      tokenObject = new Token(validToken);
      await tokenObject.save();
    });

    it('should not return a token when passing in a valid parameter with a non existent token ID', async function () {
      response = await agent.get('/api/tokens?q=_id=5bcdbe7287e21906ed4f12ba').expect(200);
      response.body.length.should.equal(0);
    });

    it('should not return a token when passing in a valid parameter with a non existent parameter', async function () {
      response = await agent.get('/api/tokens?q=' + encodeURIComponent('_id=' + tokenObject._id
        + '&name=notExisting')).expect(200);
      response.body.length.should.equal(0);
    });

    it('should return an error when not encoding q search parameters', async function () {
      response = await agent.get('/api/tokens?q=._id=' + tokenObject._id + '&name=notExisting').expect(422);
      response.body.message.should.equal('Improperly structured query. Make sure to use ?q=<key>=<value> syntax');
    });

    it('should return a single token when passing in _id parameter', async function () {
      response = await agent.get('/api/tokens?q=_id=' + tokenObject._id).expect(200);
      response.body[0].should.be.instanceof(Object);
      response.body[0].name.should.equal(tokenObject.name);
    });

    it('should not return a token when passing in invalid parameter', async function () {
      response = await agent.get('/api/tokens?q=n0nsense=123454321').expect(200);
      response.body.length.should.equal(0);
    });

    it('should return a single token when passing in name parameter', async function () {
      response = await agent.get('/api/tokens?q=name=' + tokenObject.name).expect(200);
      response.body[0].should.be.instanceof(Object);
      response.body[0].name.should.equal(tokenObject.name);
    });

    it('should only return fields specified in url', async function () {
      response = await agent.get('/api/tokens?fields=name').expect(200);
      response.body.length.should.equal(1);
      for (var key in response.body) {
        if (Object.prototype.hasOwnProperty.call(response.body, key)) {
          Object.prototype.hasOwnProperty.call(response.body[key], 'name').should.equal(true);
        }
      }
    });

    it('should only return fields specified in url using fields and q functionality', async function () {
      response = await agent.get('/api/tokens?fields=name&q=name=' + tokenObject.name).expect(200);
      response.body.length.should.equal(1);
      Object.prototype.hasOwnProperty.call(response.body[0], 'name').should.equal(true);
      response.body[0].name.should.equal(tokenObject.name);
    });

    it('should return an error message when query has invalid search key blah', async function () {
      response = await agent.get('/api/tokens?q=name=' + tokenObject.name + '&fields=name&blah=blah').expect(422);
      response.body.message.should.equal('Improperly structured query. Make sure to use ?q=<key>=<value> syntax');
    });

    it('should return an error message when queried with an improper search', async function () {
      response = await agent.get('/api/tokens?name=' + tokenObject.name).expect(422);
      response.body.message.should.equal('Improperly structured query. Make sure to use ?q=<key>=<value> syntax');
    });

    it('should return an error message when queried with an empty fields=', async function () {
      response = await agent.get('/api/tokens?fields=').expect(422);
      response.body.message.should.equal('Improperly structured query. Make sure to use ?q=<key>=<value> syntax');
    });

    it('should return an error message when queried with an empty fields= and q=', async function () {
      response = await agent.get('/api/tokens?q=&fields=').expect(422);
      response.body.message.should.equal('Improperly structured query. Make sure to use ?q=<key>=<value> syntax');
    });
  });

  afterEach(async function () {
    await User.remove().exec();
    await Role.remove().exec();
    await Token.remove().exec();
    await History.remove().exec();
  });
});
