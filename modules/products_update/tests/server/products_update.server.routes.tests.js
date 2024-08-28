'use strict';

var fs = require('fs');
var superagentDefaults = require('superagent-defaults'),
  supertest = require('supertest'),
  mongoose = require('mongoose'),
  sinon = require('sinon'),
  _ = require('lodash'),
  Token = require('../../../tokens/server/models/tokens.server.model').Schema,
  User = require('../../../users/server/models/user.server.model').Schema,
  Role = require('../../../roles/server/models/roles.server.model').Schema,
  ProductsUpdate = require('../../server/models/products_update.server.model').Schema,
  express = require('../../../../config/lib/express');
var mimerHandler = require('../../../core/server/controllers/mimer.server.controller');

var app,
  agent,
  nonAuthAgent,
  validToken,
  badReq,
  validProductsUpdateReq,
  validProductsUpdate,
  productsUpdateCreated,
  productsUpdateObject,
  tokenObject,
  count,
  response,
  validRole,
  validSuperAdminRole,
  validAdminRole,
  validUser,
  userObject,
  roleObject,
  role2Object;

describe('ProductsUpdates', function () {
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
    validProductsUpdateReq = JSON.parse(fs.readFileSync('/opt/mean.js/modules/products_update/tests/server/test_files/valid_product_update_req.json', 'utf8'));
    validProductsUpdate = JSON.parse(fs.readFileSync('/opt/mean.js/modules/products_update/tests/server/test_files/valid_product_update.json', 'utf8'));

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
    beforeEach(async function () {
      validToken.accessToken = 'ACCESSTOKEN';
      tokenObject = new Token(validToken);
      await tokenObject.save();
      var tokenMockResponse = { 'refresh_token': 'REFRESHTOKEN', 'access_token': 'ACCESSTOKEN' };
      sinon.stub(mimerHandler, 'getAuthRefresh').returns(tokenMockResponse);
      var mockVerifyGroups = { 'messages': 'VALIDACCESSGROUP' };
      sinon.stub(mimerHandler, 'verifyAccessGroups').returns(mockVerifyGroups);
      var mockUpdateUsers = { 'messages': 'Update Admins' };
      sinon.stub(mimerHandler, 'updateUsers').returns(mockUpdateUsers);
    });

    it('should create a new ProductsUpdate and check db', async function () {
      response = await agent
        .post('/api/productsUpdate')
        .send(validProductsUpdateReq)
        .expect(201);
      response.body._id.should.have.length(24);
      response.headers.location.should.equal(`/api/productsUpdate/${response.body._id}`);
      response.body.productsAction.should.equal(validProductsUpdateReq.productsAction);
      productsUpdateCreated = await ProductsUpdate.findById(response.body._id).exec();
      productsUpdateCreated.productsAction.should.equal(validProductsUpdateReq.productsAction);
    });

    it('should not post a new ProductsUpdate when user is not authenticated', async function () {
      response = await nonAuthAgent.post('/api/productsUpdate').send(validProductsUpdateReq).expect(401);
      response.body.message.should.equal('User must be logged in');
    });

    it('should not post a new ProductsUpdate when user is standard-user', async function () {
      // Default User Role
      roleObject = new Role(validRole);
      await roleObject.save();

      // User Setup
      userObject.role_id = roleObject._id;
      await userObject.save();
      response = await agent.post('/api/productsUpdate').auth(validUser.username, validUser.password).send(validProductsUpdateReq).expect(403);
      response.body.message.should.equal('User is not authorized');
    });

    it('should post a new ProductsUpdate when user is admin', async function () {
      // Admin Role
      roleObject = new Role(validAdminRole);
      await roleObject.save();

      // Admin User Setup
      userObject.role_id = roleObject._id;
      await userObject.save();
      await agent.post('/api/productsUpdate').auth(validUser.username, validUser.password).send(validProductsUpdateReq).expect(201);
    });

    it('should post a new ProductsUpdate when user is super-admin', async function () {
      // Super-Admin Role
      userObject.role_id = role2Object._id;
      await userObject.save();
      await agent.post('/api/productsUpdate').auth(validUser.username, validUser.password).send(validProductsUpdateReq).expect(201);
    });

    it('should respond with bad request with invalid json', async function () {
      badReq = '{';
      response = await agent.post('/api/productsUpdate').send(badReq).type('json').expect(400);
      response.body.message.should.equal('There was a syntax error found in your request, please make sure that it is valid and try again');
    });

    it('should  post ProductsUpdate with Design Responsible only', async function () {
      // Setup
      var validProductDesignUpdate = _.cloneDeep(validProductsUpdateReq);
      delete validProductDesignUpdate.accessControlGroups;
      validProductDesignUpdate.designResponsible = 'BDGSTEST';
      var mockResponse = { 'response': { "results": [{ "messages": "Update Product" }] } };
      sinon.restore();
      var tokenMockResponse = { 'refresh_token': 'REFRESHTOKEN', 'access_token': 'ACCESSTOKEN' };
      sinon.stub(mimerHandler, 'getAuthRefresh').returns(tokenMockResponse);
      sinon.stub(mimerHandler, 'updateProduct').returns(mockResponse);
      response = await agent.post('/api/productsUpdate').send(validProductDesignUpdate).expect(201);
      response.body._id.should.have.length(24);
    });

    it('should post ProductsUpdate with invalid Design Responsible', async function () {
      // Setup
      var validProductDesignUpdate = _.cloneDeep(validProductsUpdateReq);
      delete validProductDesignUpdate.accessControlGroups;
      validProductDesignUpdate.designResponsible = 'BDGSTEST';
      var mockResponse = { 'error': { "results": [{ "messages": "invalid parameter" }] } };
      sinon.restore();
      var tokenMockResponse = { 'refresh_token': 'REFRESHTOKEN', 'access_token': 'ACCESSTOKEN' };
      sinon.stub(mimerHandler, 'getAuthRefresh').returns(tokenMockResponse);
      sinon.stub(mimerHandler, 'updateProduct').returns(mockResponse);
      response = await agent.post('/api/productsUpdate').send(validProductDesignUpdate).expect(201);
      response.body._id.should.have.length(24);
    });

    it('should post ProductsUpdate with signums only', async function () {
      // Setup
      var validProductSignumUpdate = _.cloneDeep(validProductsUpdateReq);
      delete validProductSignumUpdate.accessControlGroups;
      validProductSignumUpdate.signums = ['testuser'];
      var mockResponse = { 'response': { "results": [{ "messages": "Update Product" }] } };
      sinon.restore();
      var tokenMockResponse = { 'refresh_token': 'REFRESHTOKEN', 'access_token': 'ACCESSTOKEN' };
      sinon.stub(mimerHandler, 'getAuthRefresh').returns(tokenMockResponse);
      sinon.stub(mimerHandler, 'updateProduct').returns(mockResponse);
      response = await agent.post('/api/productsUpdate').send(validProductSignumUpdate).expect(201);
      response.body._id.should.have.length(24);
    });

    it('should not post ProductsUpdate when No Signums or Design Resp. entered and no valid Access Groups found on Mimer', async function () {
      // Setup
      var mockResponse = { 'error': { "results": [{ "messages": "MIMER Groups Simulated Error" }] } };
      sinon.restore();
      var tokenMockResponse = { 'refresh_token': 'REFRESHTOKEN', 'access_token': 'ACCESSTOKEN' };
      sinon.stub(mimerHandler, 'getAuthRefresh').returns(tokenMockResponse);
      sinon.stub(mimerHandler, 'verifyAccessGroups').returns(mockResponse);
      response = await agent.post('/api/productsUpdate/').send(validProductsUpdateReq).expect(422);
      response.body.message.should.equal('Enter Valid Data to Update Products!');
    });

    it('should post ProductsUpdate when Mimer Update Error', async function () {
      // Setup
      sinon.restore();
      var tokenMockResponse = { 'refresh_token': 'REFRESHTOKEN', 'access_token': 'ACCESSTOKEN' };
      sinon.stub(mimerHandler, 'getAuthRefresh').returns(tokenMockResponse);
      var mockVerifyGroups = { 'messages': 'VALIDACCESSGROUP' };
      sinon.stub(mimerHandler, 'verifyAccessGroups').returns(mockVerifyGroups);
      var mockResponse = { 'error': { "results": [{ "messages": "MIMER Products Update Simulated Error" }] } };
      sinon.stub(mimerHandler, 'updateUsers').returns(mockResponse);
      response = await agent.post('/api/productsUpdate/').send(validProductsUpdateReq).expect(201);
      response.body._id.should.have.length(24);
      response.headers.location.should.equal(`/api/productsUpdate/${response.body._id}`);
      response.body.invalidProductNumbers.length.should.equal(1);
      response.body.productNumbersUpdated.length.should.equal(0);
    });

    it('should not post ProductsUpdate when when No valid Token found', async function () {
      // Setup
      tokenObject.remove();
      response = await agent.post('/api/productsUpdate/').send(validProductsUpdateReq).expect(422);
      response.body.message.should.equal('Mimer functionality currently disabled due to Mimer authentication issue.');
    });

    afterEach(async function () {
      sinon.restore();
    });
  });

  describe('GET', function () {
    beforeEach(async function () {
      productsUpdateObject = new ProductsUpdate(validProductsUpdate);
      await productsUpdateObject.save();
    });

    it('should be able to get empty ProductsUpdates list', async function () {
      await productsUpdateObject.remove();
      response = await agent.get('/api/productsUpdate').expect(200);
      response.body.should.be.instanceof(Array).and.have.lengthOf(0);
    });

    it('should not be able to get productsUpdate when user is not authenticated', async function () {
      response = await nonAuthAgent.get('/api/productsUpdate').expect(401);
      response.body.message.should.equal('User must be logged in');
    });

    it('should be able to get productsUpdate when user is authenticated', async function () {
      await agent.get('/api/productsUpdate').expect(200);
    });

    it('should be able to get productsUpdate list', async function () {
      response = await agent.get('/api/productsUpdate').expect(200);
      response.body.should.be.instanceof(Array).and.have.lengthOf(1);
      response.body[0].productsAction.should.equal(productsUpdateObject.productsAction);
    });

    it('should be able to get a single productsUpdate', async function () {
      response = await agent.get(`/api/productsUpdate/${productsUpdateObject._id}`).expect(200);
      response.body.productsAction.should.equal(productsUpdateObject.productsAction);
    });

    it('should be able to get single productsUpdate when user not authenticated', async function () {
      response = await nonAuthAgent.get(`/api/productsUpdate/${productsUpdateObject._id}`).expect(401);
      response.body.message.should.equal('User must be logged in');
    });

    it('should be able to get single token when user is authenticated', async function () {
      await agent.get(`/api/productsUpdate/${productsUpdateObject._id}`).expect(200);
    });

    it('should throw 404 when id is not in database', async function () {
      response = await agent.get('/api/productsUpdate/000000000000000000000000').expect(404);
      response.body.message.should.equal('A ProductsUpdate with id \'000000000000000000000000\' does not exist');
    });

    it('should throw 404 when id is invalid in the database', async function () {
      response = await agent.get('/api/productsUpdate/0').expect(404);
      response.body.message.should.equal('A ProductsUpdate with id \'0\' does not exist');
    });
  });


  describe('DELETE', function () {
    beforeEach(async function () {
      productsUpdateObject = new ProductsUpdate(validProductsUpdate);
      await productsUpdateObject.save();
    });

    it('should delete a ProductsUpdate and check its response and the db', async function () {
      response = await agent.delete(`/api/productsUpdate/${productsUpdateObject._id}`).expect(200);
      response.body.should.be.instanceof(Object);
      response.body.productsAction.should.equal(productsUpdateObject.productsAction);
      count = await ProductsUpdate.count().exec();
      count.should.equal(0);
    });

    it('should not delete a ProductsUpdate when user is not authenticated', async function () {
      response = await nonAuthAgent.delete(`/api/productsUpdate/${productsUpdateObject._id}`).expect(401);
      response.body.message.should.equal('User must be logged in');
    });

    it('should not delete a ProductsUpdate when user is standard-user', async function () {
      // Default User Role
      roleObject = new Role(validRole);
      await roleObject.save();

      // User Setup
      userObject.role_id = roleObject._id;
      await userObject.save();
      response = await agent.delete(`/api/productsUpdate/${productsUpdateObject._id}`).auth(validUser.username, validUser.password).expect(403);
      response.body.message.should.equal('User is not authorized');
    });

    it('should not delete a ProductsUpdate when user is admin', async function () {
      // Admin User Role Setup
      roleObject = new Role(validAdminRole);
      await roleObject.save();
      userObject.role_id = roleObject._id;
      await userObject.save();
      await agent.delete(`/api/productsUpdate/${productsUpdateObject._id}`).auth(validUser.username, validUser.password).expect(403);
    });

    it('should delete a ProductsUpdate when user is super-admin', async function () {
      // Super-Admin Role
      userObject.role_id = role2Object._id;
      await userObject.save();
      await agent.delete(`/api/productsUpdate/${productsUpdateObject._id}`).auth(validUser.username, validUser.password).expect(200);
    });

    it('should fail when attempting to delete a ProductsUpdate that does not exist', async function () {
      response = await agent.delete('/api/productsUpdate/000000000000000000000000').expect(404);
      response.body.message.should.equal('A ProductsUpdate with id \'000000000000000000000000\' does not exist');
    });
  });

  describe('SEARCH', function () {
    beforeEach(async function () {
      productsUpdateObject = new ProductsUpdate(validProductsUpdate);
      await productsUpdateObject.save();
    });

    it('should not return a ProductsUpdate when passing in a valid parameter with a non existent ProductsUpdate ID', async function () {
      response = await agent.get('/api/productsUpdate?q=_id=5bcdbe7287e21906ed4f12ba').expect(200);
      response.body.length.should.equal(0);
    });

    it('should not return a ProductsUpdate when passing in a valid parameter with a non existent parameter', async function () {
      response = await agent.get('/api/productsUpdate?q=' + encodeURIComponent('_id=' + productsUpdateObject._id
        + '&productsAction=notExisting')).expect(200);
      response.body.length.should.equal(0);
    });

    it('should return an error when not encoding q search parameters', async function () {
      response = await agent.get('/api/productsUpdate?q=._id=' + productsUpdateObject._id + '&productsAction=notExisting').expect(422);
      response.body.message.should.equal('Improperly structured query. Make sure to use ?q=<key>=<value> syntax');
    });

    it('should return a single ProductsUpdate when passing in _id parameter', async function () {
      response = await agent.get('/api/productsUpdate?q=_id=' + productsUpdateObject._id).expect(200);
      response.body[0].should.be.instanceof(Object);
      response.body[0].productsAction.should.equal(productsUpdateObject.productsAction);
    });

    it('should not return a token when passing in invalid parameter', async function () {
      response = await agent.get('/api/productsUpdate?q=n0nsense=123454321').expect(200);
      response.body.length.should.equal(0);
    });

    it('should only return fields specified in url', async function () {
      response = await agent.get('/api/productsUpdate?fields=name').expect(200);
      response.body.length.should.equal(1);
      for (var key in response.body) {
        if (Object.prototype.hasOwnProperty.call(response.body, key)) {
          Object.prototype.hasOwnProperty.call(response.body[key], 'name').should.equal(true);
        }
      }
    });

    it('should only return fields specified in url using fields and q functionality', async function () {
      response = await agent.get('/api/productsUpdate?fields=productsAction&q=productsAction=' + productsUpdateObject.productsAction).expect(200);
      response.body.length.should.equal(1);
      Object.prototype.hasOwnProperty.call(response.body[0], 'productsAction').should.equal(true);
      response.body[0].productsAction.should.equal(productsUpdateObject.productsAction);
    });

    it('should return an error message when query has invalid search key blah', async function () {
      response = await agent.get('/api/productsUpdate?q=name=' + productsUpdateObject.name + '&fields=name&blah=blah').expect(422);
      response.body.message.should.equal('Improperly structured query. Make sure to use ?q=<key>=<value> syntax');
    });

    it('should return an error message when queried with an improper search', async function () {
      response = await agent.get('/api/productsUpdate?name=' + productsUpdateObject.name).expect(422);
      response.body.message.should.equal('Improperly structured query. Make sure to use ?q=<key>=<value> syntax');
    });

    it('should return an error message when queried with an empty fields=', async function () {
      response = await agent.get('/api/productsUpdate?fields=').expect(422);
      response.body.message.should.equal('Improperly structured query. Make sure to use ?q=<key>=<value> syntax');
    });

    it('should return an error message when queried with an empty fields= and q=', async function () {
      response = await agent.get('/api/productsUpdate?q=&fields=').expect(422);
      response.body.message.should.equal('Improperly structured query. Make sure to use ?q=<key>=<value> syntax');
    });
  });

  afterEach(async function () {
    await User.remove().exec();
    await Role.remove().exec();
    await Token.remove().exec();
    await ProductsUpdate.remove().exec();
  });
});
