'use strict';

var fs = require('fs'),
  superagentDefaults = require('superagent-defaults'),
  supertest = require('supertest'),
  chai = require('chai'),
  chaiHttp = require('chai-http'),
  expect = chai.expect,
  mongoose = require('mongoose'),
  _ = require('lodash'),
  sinon = require('sinon'),
  Moment = require('moment'),
  MomentRange = require('moment-range'),
  RolesHistory = require('../../../history/server/models/history.server.model').getSchema('roles'),
  TokensHistory = require('../../../history/server/models/history.server.model').getSchema('tokens'),
  Role = mongoose.model('Role'),
  Token = mongoose.model('Token'),
  User = mongoose.model('User'),
  express = require('../../../../config/lib/express'),
  nodeEnv = process.env.NODE_ENV,
  moment = MomentRange.extendMoment(Moment),
  timeErrorFormat = 'YYYY-MM-DD',
  today = moment(new Date()).format(timeErrorFormat);

require('sinon-mongoose');

var app,
  agent,
  clock,
  response,
  validRole,
  validToken,
  roleObject,
  tokenObject,
  secondValidRole,
  secondRoleObject,
  validUser,
  userObject;

describe('History', function () {
  before(async function () {
    app = express.init(mongoose);
    agent = superagentDefaults(supertest(app));
  });

  beforeEach(async function () {
    validToken = JSON.parse(fs.readFileSync('/opt/mean.js/modules/tokens/tests/server/test_files/valid_token.json', 'utf8'));
    validRole = JSON.parse(fs.readFileSync('/opt/mean.js/modules/roles/tests/server/test_files/valid_role.json', 'utf8'));
    validUser = JSON.parse(fs.readFileSync('/opt/mean.js/modules/users/tests/server/test_files/valid_user.json', 'utf8'));

    // Token
    validToken.accessToken = 'ACCESSTOKEN';
    tokenObject = new Token(validToken);
    await tokenObject.save();

    // Role
    roleObject = new Role(validRole);
    await roleObject.save();

    // User
    validUser.role_id = roleObject._id;
    userObject = new User(validUser);
    await userObject.save();

    // Setup User Authorization
    agent.auth(validUser.username, validUser.password);

  });

  describe('GET', function () {
    describe('logs/roles', function () {
      it('should be able to get empty Roles-log list', async function () {
        await RolesHistory.remove().exec();
        response = await agent.get('/api/logs/roles').expect(200);
        response.body.should.be.instanceof(Array).and.have.lengthOf(0);
      });

      it('should be able to get Roles-log list with one element', async function () {
        response = await agent.get('/api/logs/roles').expect(200);
        response.body.should.be.instanceof(Array).and.have.lengthOf(1);
        response.body[0].associated_id.should.equal(roleObject._id.toString());
      });

      it('should be able to get Roles-log list with more than one element', async function () {
        secondValidRole = _.cloneDeep(validRole);
        secondValidRole.name = 'tmpRole2';
        secondRoleObject = new Role(secondValidRole);
        await secondRoleObject.save();

        response = await agent.get('/api/logs/roles').expect(200);
        response.body.should.be.instanceof(Array).and.have.lengthOf(2);
      });

      it('should be able to get a single role log', async function () {
        response = await agent.get(`/api/logs/roles/${roleObject._id}`).expect(200);
        response.body.associated_id.toString().should.deepEqual(roleObject._id.toString());
        response.body.originalData.name.should.equal(validRole.name);
      });

      it('should throw 404 when program id is not in Roles-log database', async function () {
        response = await agent.get('/api/logs/roles/000000000000000000000000').expect(404);
        response.body.message.should.equal('A roles log with that id does not exist. Ensure a correct roles id is entered and is not a log or legacy object id.');
      });

      it('should throw 404 when program id is invalid in the Roles-log database', async function () {
        response = await agent.get('/api/logs/roles/0').expect(404);
        response.body.message.should.equal('A roles log with that id does not exist. Ensure a correct roles id is entered and is not a log or legacy object id.');
      });

      it('should return an error message and status 422 when the RolessHistory.find function fails', async function () {
        sinon.mock(RolesHistory).expects('find').chain('exec').yields(new Error('Simulated Error.'));
        response = await agent.get('/api/logs/roles/').expect(422);
        expect(response.body.message).to.deep.equal('Simulated Error.');
      });

      it('should return an error message and status 500 when the RolesHistory.findOne function fails', async function () {
        sinon.mock(RolesHistory).expects('findOne').chain('exec').yields(new Error('Simulated Error'));
        response = await agent.get(`/api/logs/roles/${roleObject._id}`).expect(404);
        expect(response.body.message).to.deep.equal('An error occurred whilst trying to find a log: Internal Server Error.');
      });
    });

    describe('logs/tokens', function () {
      it('should be able to get empty Tokens-log list', async function () {
        await TokensHistory.remove().exec();
        response = await agent.get('/api/logs/tokens').expect(200);
        response.body.should.be.instanceof(Array).and.have.lengthOf(0);
      });

      it('should be able to get Tokens-log list with one element', async function () {
        response = await agent.get('/api/logs/tokens').expect(200);
        response.body.should.be.instanceof(Array).and.have.lengthOf(1);
        response.body[0].associated_id.should.equal(tokenObject._id.toString());
      });

      it('should be able to get a single token log', async function () {
        response = await agent.get(`/api/logs/tokens/${tokenObject._id}`).expect(200);
        response.body.associated_id.toString().should.deepEqual(tokenObject._id.toString());
        response.body.originalData.name.should.equal(validToken.name);
      });

      it('should throw 404 when program id is not in Tokens-log database', async function () {
        response = await agent.get('/api/logs/tokens/000000000000000000000000').expect(404);
        response.body.message.should.equal('A tokens log with that id does not exist. Ensure a correct tokens id is entered and is not a log or legacy object id.');
      });

      it('should throw 404 when program id is invalid in the Tokens-log database', async function () {
        response = await agent.get('/api/logs/tokens/0').expect(404);
        response.body.message.should.equal('A tokens log with that id does not exist. Ensure a correct tokens id is entered and is not a log or legacy object id.');
      });

      it('should return an error message and status 422 when the TokenssHistory.find function fails', async function () {
        sinon.mock(TokensHistory).expects('find').chain('exec').yields(new Error('Simulated Error.'));
        response = await agent.get('/api/logs/tokens/').expect(422);
        expect(response.body.message).to.deep.equal('Simulated Error.');
      });

      it('should return an error message and status 500 when the TokensHistory.findOne function fails', async function () {
        sinon.mock(TokensHistory).expects('findOne').chain('exec').yields(new Error('Simulated Error'));
        response = await agent.get(`/api/logs/tokens/${tokenObject._id}`).expect(404);
        expect(response.body.message).to.deep.equal('An error occurred whilst trying to find a log: Internal Server Error.');
      });
    });

    describe('logs/invalid_object', function () {
      it('should not be able to get a log list when querying an invalid object-type', async function () {
        response = await agent.get('/api/logs/invalid_object').expect(422);
        response.body.should.not.be.instanceof(Array);
        response.body.message.should.startWith('Logs are not available for object type: invalid_object.');
      });
    });
  });

  describe('DELETE', function () {
    describe('logs/<artifactType>', function () {
      it('should be able to delete all roles logs', async function () {
        // Set node env to development
        process.env.NODE_ENV = 'development';

        // Create 2nd role
        var roleObject2 = new Role({ name: 'secondRole' });
        await roleObject2.save();

        // Get Logs - Length = 2
        response = await agent.get('/api/logs/roles').expect(200);
        response.body.should.be.instanceof(Array).and.have.lengthOf(2);

        // Delete Logs
        response = await agent.delete('/api/logs/roles').expect(200);
        response.body.message.should.equal('Total removed instances: 2');

        // Get Logs - Length = 0
        response = await agent.get('/api/logs/roles').expect(200);
        response.body.should.be.instanceof(Array).and.have.lengthOf(0);
      });

      it('should not delete logs when not in development mode', async function () {
        // Set node env to production
        process.env.NODE_ENV = 'production';

        // Get Logs - Length = 1
        response = await agent.get('/api/logs/roles').expect(200);
        response.body.should.be.instanceof(Array).and.have.lengthOf(1);

        // Try Delete Logs
        response = await agent.delete('/api/logs/roles').expect(422);
        response.body.message.should.equal('An error occurred whilst trying to delete logs: Must be in development mode.');

        // Get Logs - Length = 1
        response = await agent.get('/api/logs/roles').expect(200);
        response.body.should.be.instanceof(Array).and.have.lengthOf(1);
      });
    });

    describe('logs/<artifactType>/<associatedId>', function () {
      it('should be able to delete a role log', async function () {
        // Set node env to development
        process.env.NODE_ENV = 'development';

        // Create 2nd program
        var roleObject2 = new Role({ name: 'secondRole' });
        await roleObject2.save();

        // Get Logs - Length = 2
        response = await agent.get('/api/logs/roles').expect(200);
        response.body.should.be.instanceof(Array).and.have.lengthOf(2);

        // Delete Log
        response = await agent.delete(`/api/logs/roles/${roleObject._id}`).expect(200);
        response.body.originalData.name.should.equal(roleObject.name);

        // Get Logs - Length = 0
        response = await agent.get('/api/logs/roles').expect(200);
        response.body.should.be.instanceof(Array).and.have.lengthOf(1);
      });

      it('should not delete a log when not in development mode', async function () {
        // Set node env to production
        process.env.NODE_ENV = 'production';

        // Get Logs - Length = 1
        response = await agent.get('/api/logs/roles').expect(200);
        response.body.should.be.instanceof(Array).and.have.lengthOf(1);

        // Try Delete Log
        response = await agent.delete(`/api/logs/roles/${roleObject._id}`).expect(422);
        response.body.message.should.equal('An error occurred whilst trying to delete the log: Must be in development mode.');

        // Get Logs - Length = 1
        response = await agent.get('/api/logs/roles').expect(200);
        response.body.should.be.instanceof(Array).and.have.lengthOf(1);
      });
    });
  });

  describe('SEARCH', function () {
    it('should not return a log when passing in a valid parameter with a non existent associated roles ID', async function () {
      response = await agent.get('/api/logs/roles?q=associated_id=000000000000000000000000').expect(200);
      response.body.length.should.equal(0);
    });

    it('should not return a log when passing in a valid parameter with a non existent parameter', async function () {
      response = await agent.get('/api/logs/roles?q=' + encodeURIComponent('name=notExisting')).expect(200);
      response.body.length.should.equal(0);
    });

    it('should return an error when not encoding q search parameters', async function () {
      response = await agent.get('/api/logs/roles?q=.associated_id=' + roleObject._id + '&name=notExisting').expect(422);
      response.body.message.should.equal('Improperly structured query. Make sure to use ?q=<key>=<value> syntax');
    });

    it('should return a single log when passing in a valid associated_id parameter', async function () {
      response = await agent.get('/api/logs/roles?q=associated_id=' + roleObject._id).expect(200);
      response.body.length.should.equal(1);
      response.body[0].should.be.instanceof(Object);
      response.body[0].originalData.name.should.equal(roleObject.name);
      response.body[0].associated_id.should.equal(roleObject._id.toString());
    });

    it('should not return a log when passing in invalid parameter', async function () {
      response = await agent.get('/api/logs/roles?q=n0nsense=123454321').expect(200);
      response.body.length.should.equal(0);
    });

    it('should return a single log when passing in name parameter', async function () {
      response = await agent.get('/api/logs/roles?q=originalData.name=' + roleObject.name).expect(200);
      response.body.length.should.equal(1);
      response.body[0].should.be.instanceof(Object);
      response.body[0].originalData.name.should.equal(roleObject.name);
    });

    it('should only return fields specified in url', async function () {
      response = await agent.get('/api/logs/roles?fields=associated_id').expect(200);
      response.body.length.should.equal(1);
      for (var key in response.body) {
        if (Object.prototype.hasOwnProperty.call(response.body, key)) {
          Object.prototype.hasOwnProperty.call(response.body[key], 'associated_id').should.equal(true);
        }
      }
    });

    it('should only return fields specified in url using fields and q functionality', async function () {
      response = await agent.get('/api/logs/roles?fields=associated_id&q=associated_id=' + roleObject._id).expect(200);
      response.body.length.should.equal(1);
      Object.prototype.hasOwnProperty.call(response.body[0], 'associated_id').should.equal(true);
      response.body[0].associated_id.should.equal(roleObject._id.toString());
    });

    it('should only return nested fields specified in url', async function () {
      response = await agent.get('/api/logs/roles?fields=originalData(name)').expect(200);
      response.body.length.should.equal(1);
      Object.prototype.hasOwnProperty.call(response.body[0], 'originalData').should.equal(true);
      Object.prototype.hasOwnProperty.call(response.body[0].originalData, 'name').should.equal(true);
      response.body[0].originalData.name.should.equal(roleObject.name);
    });

    it('should return an error message when query has invalid search key blah', async function () {
      response = await agent.get('/api/logs/roles?q=name=' + roleObject.name + '&fields=name&blah=blah').expect(422);
      response.body.message.should.equal('Improperly structured query. Make sure to use ?q=<key>=<value> syntax');
    });

    it('should return an error message when queried with an improper search', async function () {
      response = await agent.get('/api/logs/roles?name=' + roleObject.name).expect(422);
      response.body.message.should.equal('Improperly structured query. Make sure to use ?q=<key>=<value> syntax');
    });

    it('should return an error message when queried with an empty q=', async function () {
      response = await agent.get('/api/logs/roles?q=').expect(422);
      response.body.message.should.equal('Improperly structured query. Make sure to use ?q=<key>=<value> syntax');
    });

    it('should return an error message when queried with an empty fields=', async function () {
      response = await agent.get('/api/logs/roles?fields=').expect(422);
      response.body.message.should.equal('Improperly structured query. Make sure to use ?q=<key>=<value> syntax');
    });

    it('should return an error message when queried with an empty fields= and q=', async function () {
      response = await agent.get('/api/logs/roles?q=&fields=').expect(422);
      response.body.message.should.equal('Improperly structured query. Make sure to use ?q=<key>=<value> syntax');
    });
  });

  afterEach(async function () {
    process.env.NODE_ENV = nodeEnv;
    sinon.restore();
    await User.remove().exec();
    await Role.remove().exec();
    await RolesHistory.remove().exec();
    await Token.remove().exec();
    await TokensHistory.remove().exec();

  });
});
