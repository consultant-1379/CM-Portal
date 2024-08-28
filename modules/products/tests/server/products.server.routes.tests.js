'use strict';

var fs = require('fs');
const { cloneDeep } = require('lodash');
var should = require('should'),
  superagentDefaults = require('superagent-defaults'),
  supertest = require('supertest'),
  mongoose = require('mongoose'),
  sinon = require('sinon'),
  User = require('../../../users/server/models/user.server.model').Schema,
  Role = require('../../../roles/server/models/roles.server.model').Schema,
  Token = require('../../../tokens/server/models/tokens.server.model').Schema,
  express = require('../../../../config/lib/express');
var mimerHandler = require('../../../core/server/controllers/mimer.server.controller');

var app,
  agent,
  nonAuthAgent,
  validToken,
  validProduct,
  invalidProduct,
  response,
  validRole,
  validSuperAdminRole,
  validAdminRole,
  validUser,
  testuser2,
  testuser3,
  userObject,
  userObject2,
  userObject3,
  role2Object;

describe('Products', function () {
  before(async function () {
    app = express.init(mongoose);
    nonAuthAgent = superagentDefaults(supertest(app));
    agent = superagentDefaults(supertest(app));
  });

  beforeEach(async function () {
    validProduct = JSON.parse(fs.readFileSync('/opt/mean.js/modules/products/tests/server/test_files/validProduct.json', 'utf8'));
    validToken = JSON.parse(fs.readFileSync('/opt/mean.js/modules/tokens/tests/server/test_files/valid_token.json', 'utf8'));
    validRole = JSON.parse(fs.readFileSync('/opt/mean.js/modules/roles/tests/server/test_files/valid_role.json', 'utf8'));
    validSuperAdminRole = JSON.parse(fs.readFileSync('/opt/mean.js/modules/roles/tests/server/test_files/valid_superadmin_role.json', 'utf8'));
    validAdminRole = JSON.parse(fs.readFileSync('/opt/mean.js/modules/roles/tests/server/test_files/valid_admin_role.json', 'utf8'));
    validUser = JSON.parse(fs.readFileSync('/opt/mean.js/modules/users/tests/server/test_files/valid_user.json', 'utf8'));
    testuser2 = JSON.parse(fs.readFileSync('/opt/mean.js/modules/users/tests/server/test_files/valid_user2.json', 'utf8'));
    testuser3 = JSON.parse(fs.readFileSync('/opt/mean.js/modules/users/tests/server/test_files/valid_user3.json', 'utf8'));

    invalidProduct = cloneDeep(validProduct);
    invalidProduct.signumResponsible = 'signumDoesntExist';

    // Super-Admin Role Setup
    role2Object = new Role(validSuperAdminRole);
    await role2Object.save();

    // SuperAdmin Setup
    validUser.role_id = role2Object._id;
    userObject = new User(validUser);
    await userObject.save();

    // Token
    validToken.accessToken = 'ACCESS TOKEN';
    var tokenObj = new Token(validToken);
    await tokenObj.save();

    // Setup test users
    testuser2.role_id = role2Object._id;
    userObject2 = new User(testuser2);
    await userObject2.save();

    testuser3.role_id = role2Object._id;
    userObject3 = new User(testuser3);
    await userObject3.save();

    agent.auth(validUser.username, validUser.password); // Setup User Authorization
  });

  describe('POST', function () {
    beforeEach(function () {
      var mockResponseToken = { 'refresh_token': 'REFRESHTOKEN', 'access_token': 'ACCESSTOKEN' };

      sinon.stub(mimerHandler, 'getAuthRefresh').withArgs(sinon.match.any, sinon.match.any).returns(mockResponseToken);
    });

    it('should create a new Products and get response with list of created Products', async function () {
      var mock0 = {
        message: 'Success creating APR Product: APR123.', code: 'OK'
      };
      var mock1 = {
        message: 'Success creating IMAGE Product: IMAGE123.', code: 'OK'
      };
      var mock2 = {
        message: 'Success creating SOURCE Product: SOURCE123.', code: 'OK'
      };
      var mock3 = {
        message: 'Success creating HELM Product: HELM123.', code: 'OK'
      };

      var stubb = sinon.stub(mimerHandler, 'createProduct');
      stubb.onCall(0).returns(mock0);
      stubb.onCall(1).returns(mock1);
      stubb.onCall(2).returns(mock2);
      stubb.onCall(3).returns(mock3);
      response = await agent
        .post('/api/products')
        .send(validProduct)
        .expect(201);

      response.body.message[0].should.equal('Success creating APR Product: APR123.');
      response.body.message[1].should.equal('Success creating IMAGE Product: IMAGE123.');
      response.body.message[2].should.equal('Success creating SOURCE Product: SOURCE123.');
      response.body.message[3].should.equal('Success creating HELM Product: HELM123.');
    });

    it('should create a new Product and get response with list of created and failed Products', async function () {
      var mock0 = {
        message: 'Success creating APR Product: APR123.', code: 'OK'
      };
      var mock1 = {
        message: 'Success creating IMAGE Product: IMAGE123.', code: 'OK'
      };
      var mock3 = {
        message: 'Success creating HELM Product: HELM123.', code: 'OK'
      };

      var stubb = sinon.stub(mimerHandler, 'createProduct');
      stubb.onCall(0).returns(mock0);
      stubb.onCall(1).returns(mock1);
      stubb.onCall(2).throws('Creation error.');
      stubb.onCall(3).returns(mock3);
      response = await agent
        .post('/api/products')
        .send(validProduct)
        .expect(422);

      response.body.message[0].should.equal('Success creating APR Product: APR123.');
      response.body.message[1].should.equal('Success creating IMAGE Product: IMAGE123.');
      response.body.message[2].should.equal('Error creating SOURCE: Creation error.\n');
      response.body.message[3].should.equal('Success creating HELM Product: HELM123.');
    });

    it('should not create a new Product and send back list of errors', async function () {
      var mockResponseNotOK = {
        results: [
          {
            operation: 'Metadata Management Mock',
            code: 'NOT_AUTHORIZED',
            correlationId: '73dcd493_12023200763220760',
            messages: []
          }
        ]
      };
      sinon.stub(mimerHandler, 'createProduct').withArgs(sinon.match.any, sinon.match.any, sinon.match.any).throws(mockResponseNotOK);
      response = await agent.post('/api/products').send(invalidProduct).expect(422);
      response.body.message[0].should.startWith('Error creating APR');
      response.body.message[1].should.startWith('Error creating IMAGE');
      response.body.message[2].should.startWith('Error creating SOURCE');
      response.body.message[3].should.startWith('Error creating HELM');
    });

    it('should not create a new Product when user is not authenticated', async function () {
      response = await nonAuthAgent.post('/api/products').send(validProduct).expect(401);
      response.body.message.should.equal('User must be logged in');
    });

    afterEach(async function () {
      sinon.restore();
    });
  });

  afterEach(async function () {
    sinon.restore();
    await User.remove().exec();
    await Role.remove().exec();
    await Token.remove().exec();
  });
});
