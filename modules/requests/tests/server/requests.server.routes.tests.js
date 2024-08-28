'use strict';

var fs = require('fs');
var should = require('should'),
  superagentDefaults = require('superagent-defaults'),
  supertest = require('supertest'),
  mongoose = require('mongoose'),
  _ = require('lodash'),
  History = require('../../../history/server/models/history.server.model').getSchema('requests'),
  Schema = require('../../../schemas/server/models/schemas.server.model').Schema,
  Program = require('../../../programs/server/models/programs.server.model').Schema,
  Request = require('../../../requests/server/models/requests.server.model').Schema,
  Role = require('../../../roles/server/models/roles.server.model').Schema,
  User = require('../../../users/server/models/user.server.model').Schema,
  express = require('../../../../config/lib/express');

var app,
  agent,
  nonAuthAgent,
  validProgram,
  programObject,
  validRequest,
  invalidRequest,
  requestReturned,
  requestObject,
  count,
  response,
  logReturned,
  validSuperAdminRole,
  validAdminRole,
  validRole,
  validSchema,
  roleSuperAdmObject,
  roleAdminObject,
  roleUserObject,
  schemaObject,
  validUser,
  userObject;

describe('Requests', function () {
  before(async function () {
    app = express.init(mongoose);
    nonAuthAgent = superagentDefaults(supertest(app));
    agent = superagentDefaults(supertest(app));
  });

  beforeEach(async function () {
    validRequest = JSON.parse(fs.readFileSync('/opt/mean.js/modules/requests/tests/server/test_files/valid_request.json', 'utf8'));
    validProgram = JSON.parse(fs.readFileSync('/opt/mean.js/modules/programs/tests/server/test_files/valid_program.json', 'utf8'));
    validRole = JSON.parse(fs.readFileSync('/opt/mean.js/modules/roles/tests/server/test_files/valid_role.json', 'utf8'));
    validAdminRole = JSON.parse(fs.readFileSync('/opt/mean.js/modules/roles/tests/server/test_files/valid_admin_role.json', 'utf8'));
    validSuperAdminRole = JSON.parse(fs.readFileSync('/opt/mean.js/modules/roles/tests/server/test_files/valid_superadmin_role.json', 'utf8'));
    validUser = JSON.parse(fs.readFileSync('/opt/mean.js/modules/users/tests/server/test_files/valid_user.json', 'utf8'));
    validSchema = JSON.parse(fs.readFileSync('/opt/mean.js/modules/schemas/tests/server/test_files/valid_schema.json', 'utf8'));
    roleSuperAdmObject = new Role(validSuperAdminRole)
    roleAdminObject = new Role(validAdminRole)
    roleUserObject = new Role(validRole)
    await roleSuperAdmObject.save();
    await roleAdminObject.save();
    await roleUserObject.save();

    programObject = new Program(validProgram);
    await programObject.save();

    validSchema.program_id = programObject._id;
    schemaObject = new Schema(validSchema);
    await schemaObject.save();

    validRequest.schema_id = schemaObject._id;
    validRequest.program_id = programObject._id;

    validUser.role_id = roleSuperAdmObject._id;
    userObject = new User(validUser);
    await userObject.save();

    agent.auth(validUser.username, validUser.password); // Setup User Authorization
  });

  describe('POST', function () {
    it('should create a new Request and check db', async function () {
      response = await agent
        .post('/api/requests')
        .send(validRequest)
        .expect(201);
      response.body._id.should.have.length(24);
      response.headers.location.should.equal(`/api/Requests/${response.body._id}`);
      response.body.name.should.equal(validRequest.name);
      requestReturned = await Request.findById(response.body._id).exec();
      requestReturned.name.should.equal(validRequest.name);
    });

    it('should not create a new Request when user is not authenticated', async function () {
      response = await nonAuthAgent.post('/api/requests').send(validRequest).expect(401);
      response.body.message.should.equal('User must be logged in');
    });

    it('should create a new Request when user is super-admin', async function () {
      await userObject.save();
      await agent.post('/api/requests').auth(validUser.username, validUser.password).send(validRequest).expect(201);
    });

    it('should create a Request when current user is a standard user with /program post permissions', async function () {
      userObject.role_id = roleUserObject._id;
      userObject.permissions = [{
        resources: '/requests',
        methods: 'post'
      }];
      await userObject.save();
      response = await agent.post(`/api/requests`).auth(validUser.username, validUser.password).send(validRequest).expect(201);
    })

    it('should not post more than one Request with the same name', async function () {
      requestObject = new Request(validRequest);
      await requestObject.save();
      response = await agent.post('/api/requests').send(requestObject).expect(400);
      response.body.message.should.equal('Error, provided name is not unique.');
    });

    it('should not post Request with a name less than 5 characters', async function () {
      invalidRequest = _.cloneDeep(validRequest);
      invalidRequest.name = 'xxxx';
      response = await agent.post('/api/requests').send(invalidRequest).expect(400);
      response.body.message.should.equal('Path `name` (`' + invalidRequest.name + '`) is shorter than the minimum allowed length (5).');
    });

    it('should not post Request with a name more than 80 characters', async function () {
      invalidRequest = _.cloneDeep(validRequest);
      invalidRequest.name = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
      response = await agent.post('/api/requests').send(invalidRequest).expect(400);
      response.body.message.should.equal('Path `name` (`' + invalidRequest.name + '`) is longer than the maximum allowed length (80).');
    });

    it('should not allow a Request with a non-alphanumeric-underscored name', async function () {
      invalidRequest = _.cloneDeep(validRequest);
      invalidRequest.name = '!£$%&';
      response = await agent.post('/api/requests').send(invalidRequest).expect(400);
      response.body.message.should.equal('name is not valid; \'!£$%&\' can only contain letters, numbers, dots, dashes and underscores.');
    });

    it('should not post a Request without a name key', async function () {
      invalidRequest = _.cloneDeep(validRequest);
      delete invalidRequest.name;
      response = await agent.post('/api/requests').send(invalidRequest).expect(400);
      response.body.message.should.equal('Path `name` is required.');
    });

    it('should not post a Request with unknown key', async function () {
      invalidRequest = _.cloneDeep(validRequest);
      invalidRequest.rogueKey = 'rogueValue';
      response = await agent.post('/api/requests').send(invalidRequest).expect(400);
      response.body.message.should.equal('Field `rogueKey` is not in schema and strict mode is set to throw.');
    });

    it('should respond with bad request with invalid json', async function () {
      invalidRequest = '{';
      response = await agent.post('/api/requests').send(invalidRequest).type('json').expect(400);
      response.body.message.should.equal('There was a syntax error found in your request, please make sure that it is valid and try again');
    });

    it('should post a new log with user-details when a Request is created by a logged-in user', async function () {
      response = await agent.post('/api/requests').send(validRequest).expect(201);
      response.body._id.should.have.length(24);
      response.headers.location.should.equal(`/api/Requests/${response.body._id}`);
      response.body.name.should.equal(validRequest.name);
      requestReturned = await Request.findById(response.body._id).exec();
      requestReturned.name.should.equal(validRequest.name);
      logReturned = await History.findOne({ associated_id: response.body._id }).exec();
      logReturned.originalData.should.not.equal(undefined);
      logReturned.originalData.name.should.equal(validRequest.name);
      logReturned.createdAt.should.not.equal(undefined);
      logReturned.createdBy.should.not.equal(undefined);
      logReturned.createdBy.username.should.equal(validUser.username);
      logReturned.createdBy.email.should.equal(validUser.email);
      logReturned.updates.should.be.instanceof(Array).and.have.lengthOf(0);
    });

    it('should not post a new log for a Request that is created with a name beginning with \'A_Health_\'', async function () {
      var validRequestHealth = _.cloneDeep(validRequest);
      validRequestHealth.name = 'A_Health_Program';
      response = await agent.post('/api/Requests').send(validRequestHealth).expect(201);
      response.body._id.should.have.length(24);
      response.headers.location.should.equal(`/api/Requests/${response.body._id}`);
      response.body.name.should.equal(validRequestHealth.name);
      requestReturned = await Request.findById(response.body._id).exec();
      requestReturned.name.should.equal(validRequestHealth.name);

      logReturned = await History.findOne({ associated_id: response.body._id }).exec();
      should.not.exist(logReturned);
    });
  });

  describe('GET', function () {
    beforeEach(async function () {
      requestObject = new Request(validRequest);
      await requestObject.save();
    });

    it('should be able to get empty Request list', async function () {
      await requestObject.remove();
      response = await agent.get('/api/requests').expect(200);
      response.body.should.be.instanceof(Array).and.have.lengthOf(0);
    });

    it('should be able to get Requests when user not authenticated', async function () {
      await nonAuthAgent.get('/api/requests').expect(200);
    });

    it('should be able to get Requests when user is authenticated', async function () {
      await agent.get('/api/requests').expect(200);
    });

    it('should be able to get Request list with one element', async function () {
      response = await agent.get('/api/requests').expect(200);
      response.body.should.be.instanceof(Array).and.have.lengthOf(1);
      response.body[0].name.should.equal(validRequest.name);
    });

    it('should be able to get a single Request', async function () {
      response = await agent.get(`/api/Requests/${requestObject._id}`).expect(200);
      response.body.name.should.equal(validRequest.name);
    });

    it('should be able to get single Request when user not authenticated', async function () {
      await nonAuthAgent.get(`/api/Requests/${requestObject._id}`).expect(200);
    });

    it('should be able to get single Request when user is authenticated', async function () {
      await agent.get(`/api/Requests/${requestObject._id}`).expect(200);
    });

    it('should throw 404 when id is not in database', async function () {
      response = await agent.get('/api/requests/000000000000000000000000').expect(404);
      response.body.message.should.equal('A Request with id \'000000000000000000000000\' does not exist');
    });

    it('should throw 404 when id is invalid in the database', async function () {
      response = await agent.get('/api/requests/0').expect(404);
      response.body.message.should.equal('A Request with id \'0\' does not exist');
    });
  });

  describe('DELETE', function () {
    beforeEach(async function () {
      requestObject = new Request(validRequest);
      await requestObject.save();
    });

    it('should delete a request and check its response and the db', async function () {
      response = await agent.delete(`/api/Requests/${requestObject._id}`).expect(200);
      response.body.should.be.instanceof(Object);
      response.body.name.should.equal(requestObject.name);
      count = await Request.count().exec();
      count.should.equal(0);
    });

    it('should not delete a Request when user is not authenticated', async function () {
      response = await nonAuthAgent.delete(`/api/requests/${requestObject._id}`).expect(401);
      response.body.message.should.equal('User must be logged in');
    });

    it('should delete a Request when user is super-admin', async function () {
      await userObject.save();
      await agent.delete(`/api/requests/${requestObject._id}`).auth(validUser.username, validUser.password).expect(200);
    });

    it('should delete a Request when current user is a standard user with /request delete permissions', async function () {
      userObject.role_id = roleUserObject._id;
      userObject.permissions = [{
        resources: '/requests',
        methods: 'delete'
      }];
      await userObject.save();
      response = await agent.delete(`/api/requests/${requestObject._id}`).auth(validUser.username, validUser.password).expect(200);
    })

    it('should fail when attempting to delete a Request that does not exist', async function () {
      response = await agent.delete('/api/requests/000000000000000000000000').expect(404);
      response.body.message.should.equal('A Request with id \'000000000000000000000000\' does not exist');
    });

    it('should update an existing log with user-details for a Requests thats deleted by a logged-in user', async function () {
      response = await agent.delete(`/api/Requests/${requestObject._id}`).expect(200);
      response.body._id.should.have.length(24);
      response.body._id.should.equal(requestObject._id.toString());

      logReturned = await History.findOne({ associated_id: response.body._id }).exec();
      logReturned.originalData.should.not.equal(undefined);
      logReturned.originalData.name.should.equal(validRequest.name);

      logReturned.updates.should.be.instanceof(Array).and.have.lengthOf(0);
      logReturned.deletedAt.should.not.equal(undefined);
      logReturned.deletedBy.should.not.equal(undefined);
      logReturned.deletedBy.username.should.equal(validUser.username);
      logReturned.deletedBy.email.should.equal(validUser.email);
    });

    it('should create a log with defined user-details for a Request that gets deleted by a logged-in user', async function () {
      // clear logs and verify
      await History.remove().exec();
      logReturned = await History.findOne({ associated_id: response.body._id }).exec();
      should.not.exist(logReturned);

      response = await agent.delete(`/api/Requests/${requestObject._id}`).expect(200);
      response.body._id.should.have.length(24);
      response.body._id.should.equal(requestObject._id.toString());

      logReturned = await History.findOne({ associated_id: response.body._id }).exec();
      logReturned.originalData.should.not.equal(undefined);
      logReturned.originalData.name.should.equal(validRequest.name);

      logReturned.updates.should.be.instanceof(Array).and.have.lengthOf(0);
      logReturned.deletedAt.should.not.equal(undefined);
      logReturned.deletedBy.should.not.equal(undefined);
      logReturned.deletedBy.username.should.equal(validUser.username);
      logReturned.deletedBy.email.should.equal(validUser.email);
    });
  });

  afterEach(async function () {
    await User.remove().exec();
    await Role.remove().exec();
    await Request.remove().exec();
    await Schema.remove().exec();
    await Program.remove().exec();
    await History.remove().exec();
  });
});
