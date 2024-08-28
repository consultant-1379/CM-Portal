'use strict';

/**
 * Module dependencies.
 */
var fs = require('fs');
var chai = require('chai'),
  expect = chai.expect,
  semver = require('semver'),
  _ = require('lodash'),
  should = require('should'),
  mongoose = require('mongoose'),
  superagentDefaults = require('superagent-defaults'),
  supertest = require('supertest'),
  chaiHttp = require('chai-http'),
  sinon = require('sinon'),
  User = require('../../../users/server/models/user.server.model').Schema,
  Role = require('../../../roles/server/models/roles.server.model').Schema,
  config = require('../../../.././config/config'),
  logger = require('../../../../config/lib/logger'),
  seed = require('../../../../config/lib/seed'),
  express = require('../../../../config/lib/express');

require('sinon-mongoose');

var app,
  agent,
  nonAuthAgent,
  validUser,
  validRole,
  validAdminRole,
  roleObject,
  roleObject2,
  user1,
  admin1,
  userFromSeedConfig,
  adminFromSeedConfig,
  originalLogConfig,
  response;

describe('Configuration Tests:', function () {
  describe('Testing default seedDB', function () {
    before(function (done) {
      User.remove(async function (err) {
        should.not.exist(err);

        user1 = JSON.parse(fs.readFileSync('/opt/mean.js/modules/core/tests/server/test_files/user1.json', 'utf8'));
        admin1 = JSON.parse(fs.readFileSync('/opt/mean.js/modules/core/tests/server/test_files/admin1.json', 'utf8'));
        validRole = JSON.parse(fs.readFileSync('/opt/mean.js/modules/roles/tests/server/test_files/valid_role.json', 'utf8'));
        validAdminRole = JSON.parse(fs.readFileSync('/opt/mean.js/modules/roles/tests/server/test_files/valid_admin_role.json', 'utf8'));
        userFromSeedConfig = config.seedDB.options.seedUser;
        adminFromSeedConfig = config.seedDB.options.seedAdmin;

        // Create User Role Object
        roleObject = new Role(validRole);
        await roleObject.save();

        // Create Admin Role Object
        roleObject2 = new Role(validAdminRole);
        await roleObject2.save();

        // Update User role_id
        user1.role_id = roleObject._id;
        admin1.role_id = roleObject2._id;

        return done();
      });
    });

    after(function (done) {
      User.remove(function (err) {
        should.not.exist(err);
        return done();
      });
      Role.remove().exec();
    });

    it('should have seedDB configuration set for "regular" user', function () {
      (typeof userFromSeedConfig).should.not.equal('undefined');
      should.exist(userFromSeedConfig.username);
      should.exist(userFromSeedConfig.email);
    });

    it('should have seedDB configuration set for admin user', function () {
      (typeof adminFromSeedConfig).should.not.equal('undefined');
      should.exist(adminFromSeedConfig.username);
      should.exist(adminFromSeedConfig.email);
    });

    it('should not be an admin user to begin with', function (done) {
      User.find({ username: 'seedadmin' }, function (err, users) {
        should.not.exist(err);
        users.should.be.instanceof(Array).and.have.lengthOf(0);
        return done();
      });
    });

    it('should not be a "regular" user to begin with', function (done) {
      User.find({ username: 'seeduser' }, function (err, users) {
        should.not.exist(err);
        users.should.be.instanceof(Array).and.have.lengthOf(0);
        return done();
      });
    });

    it('should seed ONLY the admin user account when NODE_ENV is set to "production"', function (done) {
      // Save original value
      var nodeEnv = process.env.NODE_ENV;
      // Set node env ro production environment
      process.env.NODE_ENV = 'production';

      User.find({ username: adminFromSeedConfig.username }, function (err, users) {
        // There shouldn't be any errors
        should.not.exist(err);
        users.should.be.instanceof(Array).and.have.lengthOf(0);

        seed
          .start({ logResults: false })
          .then(function () {
            User.find({ username: adminFromSeedConfig.username }, function (err, users) {
              should.not.exist(err);
              users.should.be.instanceof(Array).and.have.lengthOf(1);

              var _admin = users.pop();
              _admin.username.should.equal(adminFromSeedConfig.username);

              // Restore original NODE_ENV environment variable
              process.env.NODE_ENV = nodeEnv;

              User.remove(function (err) {
                should.not.exist(err);
                return done();
              });
            });
          });
      });
    });

    it('should seed admin, and "regular" user accounts when NODE_ENV is set to "test"', function (done) {
      // Save original value
      var nodeEnv = process.env.NODE_ENV;
      // Set node env ro production environment
      process.env.NODE_ENV = 'test';

      User.find({ username: adminFromSeedConfig.username }, function (err, users) {
        // There shouldn't be any errors
        should.not.exist(err);
        users.should.be.instanceof(Array).and.have.lengthOf(0);

        seed
          .start({ logResults: false })
          .then(function () {
            User.find({ username: adminFromSeedConfig.username }, function (err, users) {
              should.not.exist(err);
              users.should.be.instanceof(Array).and.have.lengthOf(1);

              var _admin = users.pop();
              _admin.username.should.equal(adminFromSeedConfig.username);

              User.find({ username: userFromSeedConfig.username }, function (err, users) {
                should.not.exist(err);
                users.should.be.instanceof(Array).and.have.lengthOf(1);

                var _user = users.pop();
                _user.username.should.equal(userFromSeedConfig.username);

                // Restore original NODE_ENV environment variable
                process.env.NODE_ENV = nodeEnv;

                User.remove(function (err) {
                  should.not.exist(err);
                  return done();
                });
              });
            });
          });
      });
    });

    it('should seed admin, and "regular" user accounts when NODE_ENV is set to "test" when they already exist', function (done) {
      // Save original value
      var nodeEnv = process.env.NODE_ENV;
      // Set node env ro production environment
      process.env.NODE_ENV = 'test';

      var _user = new User(userFromSeedConfig);
      var _admin = new User(adminFromSeedConfig);

      _admin.save(function (err) {
        // There shouldn't be any errors
        should.not.exist(err);
        _user.save(function (err) {
          // There shouldn't be any errors
          should.not.exist(err);

          User.find({ username: { $in: [adminFromSeedConfig.username, userFromSeedConfig.username] } }, function (err, users) {
            // There shouldn't be any errors
            should.not.exist(err);
            users.should.be.instanceof(Array).and.have.lengthOf(2);

            seed
              .start({ logResults: false })
              .then(function () {
                User.find({ username: { $in: [adminFromSeedConfig.username, userFromSeedConfig.username] } }, function (err, users) {
                  should.not.exist(err);
                  users.should.be.instanceof(Array).and.have.lengthOf(2);

                  // Restore original NODE_ENV environment variable
                  process.env.NODE_ENV = nodeEnv;

                  User.remove(function (err) {
                    should.not.exist(err);
                    return done();
                  });
                });
              });
          });
        });
      });
    });

    it('should ONLY seed admin user account when NODE_ENV is set to "production" with custom admin', function (done) {
      // Save original value
      var nodeEnv = process.env.NODE_ENV;
      // Set node env ro production environment
      process.env.NODE_ENV = 'production';

      User.find({ username: admin1.username }, function (err, users) {
        // There shouldn't be any errors
        should.not.exist(err);
        users.should.be.instanceof(Array).and.have.lengthOf(0);

        seed
          .start({ logResults: false, seedAdmin: admin1 })
          .then(function () {
            User.find({ username: admin1.username }, function (err, users) {
              should.not.exist(err);
              users.should.be.instanceof(Array).and.have.lengthOf(1);

              var _admin = users.pop();
              _admin.username.should.equal(admin1.username);

              // Restore original NODE_ENV environment variable
              process.env.NODE_ENV = nodeEnv;

              User.remove(function (err) {
                should.not.exist(err);
                return done();
              });
            });
          });
      });
    });

    it('should seed admin, and "regular" user accounts when NODE_ENV is set to "test" with custom options', function (done) {
      // Save original value
      var nodeEnv = process.env.NODE_ENV;
      // Set node env ro production environment
      process.env.NODE_ENV = 'test';

      User.find({ username: admin1.username }, function (err, users) {
        // There shouldn't be any errors
        should.not.exist(err);
        users.should.be.instanceof(Array).and.have.lengthOf(0);

        seed
          .start({ logResults: false, seedAdmin: admin1, seedUser: user1 })
          .then(function () {
            User.find({ username: admin1.username }, function (err, users) {
              should.not.exist(err);
              users.should.be.instanceof(Array).and.have.lengthOf(1);

              var _admin = users.pop();
              _admin.username.should.equal(admin1.username);

              User.find({ username: user1.username }, function (err, users) {
                should.not.exist(err);
                users.should.be.instanceof(Array).and.have.lengthOf(1);

                var _user = users.pop();
                _user.username.should.equal(user1.username);

                // Restore original NODE_ENV environment variable
                process.env.NODE_ENV = nodeEnv;

                User.remove(function (err) {
                  should.not.exist(err);
                  return done();
                });
              });
            });
          });
      });
    });

    it('should NOT seed admin user account if it already exists when NODE_ENV is set to "production"', function (done) {
      // Save original value
      var nodeEnv = process.env.NODE_ENV;
      // Set node env ro production environment
      process.env.NODE_ENV = 'production';

      var _admin = new User(adminFromSeedConfig);

      _admin.save(function (err, user) {
        // There shouldn't be any errors
        should.not.exist(err);
        user.username.should.equal(adminFromSeedConfig.username);

        seed
          .start({ logResults: false })
          .then(function () {
            // we don't ever expect to make it here but we don't want to timeout
            User.remove(function (err) {
              should.not.exist(err);
              // force this test to fail since we should never be here
              should.exist(undefined);
              // Restore original NODE_ENV environment variable
              process.env.NODE_ENV = nodeEnv;

              return done();
            });
          })
          .catch(function (err) {
            should.exist(err);
            err.message.should.equal('Failed due to local account already exists: ' + adminFromSeedConfig.username);

            // Restore original NODE_ENV environment variable
            process.env.NODE_ENV = nodeEnv;

            User.remove(function (removeErr) {
              should.not.exist(removeErr);

              return done();
            });
          });
      });
    });

    it('should NOT seed "regular" user account if missing email when NODE_ENV set to "test"', function (done) {
      // Save original value
      var nodeEnv = process.env.NODE_ENV;
      // Set node env ro test environment
      process.env.NODE_ENV = 'test';

      var _user = new User(user1);
      _user.email = '';

      seed
        .start({ logResults: false, seedUser: _user })
        .then(function () {
          // we don't ever expect to make it here but we don't want to timeout
          User.remove(function () {
            // force this test to fail since we should never be here
            should.exist(undefined);
            // Restore original NODE_ENV environment variable
            process.env.NODE_ENV = nodeEnv;

            return done();
          });
        })
        .catch(function (err) {
          should.exist(err);
          err.message.should.equal('Failed to add local ' + user1.username);

          // Restore original NODE_ENV environment variable
          process.env.NODE_ENV = nodeEnv;

          User.remove(function (removeErr) {
            should.not.exist(removeErr);

            return done();
          });
        });
    });
  });

  describe('Testing Session Secret Configuration', function () {
    it('should warn if using default session secret when running in production', function (done) {
      var conf = { sessionSecret: 'MEAN' };
      // set env to production for this test
      process.env.NODE_ENV = 'production';
      config.utils.validateSessionSecret(conf, true).should.equal(false);
      // set env back to test
      process.env.NODE_ENV = 'test';
      return done();
    });

    it('should accept non-default session secret when running in production', function () {
      var conf = { sessionSecret: 'super amazing secret' };
      // set env to production for this test
      process.env.NODE_ENV = 'production';
      config.utils.validateSessionSecret(conf, true).should.equal(true);
      // set env back to test
      process.env.NODE_ENV = 'test';
    });

    it('should accept default session secret when running in development', function () {
      var conf = { sessionSecret: 'MEAN' };
      // set env to development for this test
      process.env.NODE_ENV = 'development';
      config.utils.validateSessionSecret(conf, true).should.equal(true);
      // set env back to test
      process.env.NODE_ENV = 'test';
    });

    it('should accept default session secret when running in test', function () {
      var conf = { sessionSecret: 'MEAN' };
      config.utils.validateSessionSecret(conf, true).should.equal(true);
    });
  });

  describe('Testing Logger Configuration', function () {
    beforeEach(function () {
      originalLogConfig = _.clone(config.log, true);
    });

    afterEach(function () {
      config.log = originalLogConfig;
    });

    it('should retrieve the log format from the logger configuration', function () {
      config.log = {
        format: 'tiny'
      };

      var format = logger.getLogFormat();
      format.should.be.equal('tiny');
    });

    it('should retrieve the log options from the logger configuration for a valid stream object', function () {
      var options = logger.getMorganOptions();

      options.should.be.instanceof(Object);
      options.should.have.property('stream');
    });

    it('should verify that a file logger object was created using the logger configuration', function () {
      var _dir = process.cwd();
      var _filename = 'unit-test-access.log';

      config.log = {
        fileLogger: {
          directoryPath: _dir,
          fileName: _filename
        }
      };

      var fileTransport = logger.getLogOptions(config);
      fileTransport.should.be.instanceof(Object);
      fileTransport.filename.should.equal(`${_dir}/${_filename}`);
    });

    it('should use the default log format of "combined" when an invalid format was provided', function () {
      var _logger = require('../../../../config/lib/logger'); // eslint-disable-line global-require

      // manually set the config log format to be invalid
      config.log = {
        format: '_some_invalid_format_'
      };

      var format = _logger.getLogFormat();
      format.should.be.equal('combined');
    });

    it('should not create a file transport object if critical options are missing: filename', function () {
      // manually set the config stream fileName option to an empty string
      config.log = {
        format: 'combined',
        options: {
          stream: {
            directoryPath: process.cwd(),
            fileName: ''
          }
        }
      };

      var fileTransport = logger.getLogOptions(config);
      fileTransport.should.be.false();
    });

    it('should not create a file transport object if critical options are missing: directory', function () {
      // manually set the config stream fileName option to an empty string
      config.log = {
        format: 'combined',
        options: {
          stream: {
            directoryPath: '',
            fileName: 'app.log'
          }
        }
      };

      var fileTransport = logger.getLogOptions(config);
      fileTransport.should.be.false();
    });
  });

  describe('Testing exposing environment as a variable to layout', function () {
    ['development', 'production', 'test'].forEach(function (env) {
      it('should expose environment set to ' + env, function (done) {
        // Set env to development for this test
        process.env.NODE_ENV = env;

        // Get application
        app = express.init(mongoose);
        agent = supertest.agent(app);

        // Get rendered layout
        agent.get('/')
          .expect('Content-Type', 'text/html; charset=utf-8')
          .expect(200)
          .end(function (err, res) {
            // Set env back to test
            process.env.NODE_ENV = 'test';
            // Handle errors
            if (err) {
              return done(err);
            }
            res.text.should.containEql('env = "' + env + '"');
            return done();
          });
      });
    });
  });
});

describe('CORE API Functionality:', function () {
  before(async function () {
    app = express.init(mongoose);
    nonAuthAgent = superagentDefaults(supertest(app));
    agent = superagentDefaults(supertest(app));
  });

  describe('GET /*', function () {
    it('should render index file', async function () {
      response = await agent.get('/any_string').expect(200);
      var htmlPage = response.text;
      expect(typeof htmlPage).to.equal('string');
      expect(htmlPage).to.contain('CM Portal</title>');
    });
  });

  describe('GET /api/logintest', function () {
    it('should not authorize a non-logged-in user', async function () {
      response = await nonAuthAgent.get('/api/logintest').expect(401);
      var authorization = response.text;
      expect(typeof authorization).to.equal('string');
      expect(authorization).to.equal('Unauthorized');
    });
  });
  describe('GET /api/version', function () {
    it('should return the version of the tool', async function () {
      response = await nonAuthAgent.get('/api/version').expect(200);
      var version = response.text;
      expect(typeof version).to.equal('string');
      expect(semver.gt(version, '0.0.1')).to.equal(true);
    });
  });

  describe('GET /api/upgradeEmail', function () {
    it('should return 200', async function () {
      response = await agent.get('/api/upgradeEmail').expect(200);
    });
  });

  // api/toolNotifications for notification Banner
  describe('GET /api/toolnotifications', function () {
    it('should return 200', async function () {
      response = await agent.get('/api/toolnotifications').expect(200);
    });
  });

  describe('GET /:url(api|modules|lib)/*', function () {
    it('should return a 404 page when an invalid api object is requested', async function () {
      response = await agent.get('/api/invalid_object').expect(404);
      var htmlPage = response.text;
      expect(typeof htmlPage).to.equal('string');
      expect(htmlPage).to.contain('/api/invalid_object is not a valid path.');
    });
    it('should return a 404 page when an invalid modules object is requested', async function () {
      response = await agent.get('/modules/invalid_object').expect(404);
      var htmlPage = response.text;
      expect(typeof htmlPage).to.equal('string');
      expect(htmlPage).to.contain('/modules/invalid_object is not a valid path.');
    });
    it('should return a 404 page when an invalid lib object is requested', async function () {
      response = await agent.get('/lib/invalid_object').expect(404);
      var htmlPage = response.text;
      expect(typeof htmlPage).to.equal('string');
      expect(htmlPage).to.contain('/lib/invalid_object is not a valid path.');
    });
  });
});
