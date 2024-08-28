'use strict';

var fs = require('fs');
var should = require('should'),
  superagentDefaults = require('superagent-defaults'),
  supertest = require('supertest'),
  mongoose = require('mongoose'),
  _ = require('lodash'),
  History = require('../../../history/server/models/history.server.model').getSchema('configurationfiles'),
  ConfigurationFile = require('../../server/models/configuration_files.server.model').Schema,
  User = require('../../../users/server/models/user.server.model').Schema,
  Role = require('../../../roles/server/models/roles.server.model').Schema,
  express = require('../../../../config/lib/express');

var app,
  agent,
  nonAuthAgent,
  configurationFileValid,
  validJsonConfigurationFile,
  validYamlConfigurationFile,
  validTxtConfigurationFile,
  validCfgConfigurationFile,
  validConfConfigurationFile,
  validCrtConfigurationFile,
  validCerConfigurationFile,
  validKeyConfigurationFile,
  validIniConfigurationFile,
  validPemConfigurationFile,
  configurationFileBad,
  configurationFileReturned,
  configurationFileObject,
  configurationFileValid2,
  configurationFileObject2,
  configurationFileValid3,
  count,
  response,
  logReturned,
  validSuperAdminRole,
  validAdminRole,
  validRole,
  roleSuperAdmObject,
  roleAdminObject,
  roleUserObject,
  validUser,
  userObject;

describe('ConfigurationFiles', function () {
  before(async function () {
    app = express.init(mongoose);
    nonAuthAgent = superagentDefaults(supertest(app));
    agent = superagentDefaults(supertest(app));
  });
  beforeEach(async function () {
    configurationFileValid = JSON.parse(fs.readFileSync('/opt/mean.js/modules/configuration_files/tests/server/test_files/valid_configuration_file.json', 'utf8'));
    validRole = JSON.parse(fs.readFileSync('/opt/mean.js/modules/roles/tests/server/test_files/valid_role.json', 'utf8'));
    validAdminRole = JSON.parse(fs.readFileSync('/opt/mean.js/modules/roles/tests/server/test_files/valid_admin_role.json', 'utf8'));
    validSuperAdminRole = JSON.parse(fs.readFileSync('/opt/mean.js/modules/roles/tests/server/test_files/valid_superadmin_role.json', 'utf8'));
    validUser = JSON.parse(fs.readFileSync('/opt/mean.js/modules/users/tests/server/test_files/valid_user.json', 'utf8'));
    roleSuperAdmObject = new Role(validSuperAdminRole)
    roleAdminObject = new Role(validAdminRole)
    roleUserObject = new Role(validRole)
    await roleSuperAdmObject.save();
    await roleAdminObject.save();
    await roleUserObject.save();

    validUser.role_id = roleSuperAdmObject._id;
    userObject = new User(validUser);
    await userObject.save();

    agent.auth(validUser.username, validUser.password); // Setup User Authorization
  });

  describe('POST', function () {
    it('should create a new Configuration-File with type JSON and check db', async function () {
      validJsonConfigurationFile = configurationFileValid;
      validJsonConfigurationFile.type = "json";
      validJsonConfigurationFile.content = { "testKey": "testValue" };

      response = await agent.post('/api/configurationFiles').send(configurationFileValid).expect(201);
      response.body._id.should.have.length(24);
      response.headers.location.should.equal(`/api/ConfigurationFiles/${response.body._id}`);
      response.body.name.should.equal(configurationFileValid.name);
      configurationFileReturned = await ConfigurationFile.findById(response.body._id).exec();
      configurationFileReturned.name.should.equal(configurationFileValid.name);
    });

    it('should create a new Configuration-File with type yaml and check db', async function () {
      validYamlConfigurationFile = configurationFileValid;
      validYamlConfigurationFile.type = "yaml";
      validYamlConfigurationFile.content = "\"testKey\": \"testValue\"";
      response = await agent.post('/api/configurationFiles').send(validYamlConfigurationFile).expect(201);
      response.body._id.should.have.length(24);
      response.headers.location.should.equal(`/api/ConfigurationFiles/${response.body._id}`);
      response.body.name.should.equal(validYamlConfigurationFile.name);
      configurationFileReturned = await ConfigurationFile.findById(response.body._id).exec();
      configurationFileReturned.name.should.equal(validYamlConfigurationFile.name);
      configurationFileReturned.content.data.should.eql(validYamlConfigurationFile.content);
      should.not.exist(configurationFileReturned.content.data.data);
    });

    it('should create a new Configuration-File with type txt and check db', async function () {
      validTxtConfigurationFile = configurationFileValid;
      validTxtConfigurationFile.type = "txt";
      validTxtConfigurationFile.content = "testingTextContent";
      response = await agent.post('/api/configurationFiles').send(validTxtConfigurationFile).expect(201);
      response.body._id.should.have.length(24);
      response.headers.location.should.equal(`/api/ConfigurationFiles/${response.body._id}`);
      response.body.name.should.equal(validTxtConfigurationFile.name);
      configurationFileReturned = await ConfigurationFile.findById(response.body._id).exec();
      configurationFileReturned.name.should.equal(validTxtConfigurationFile.name);
      configurationFileReturned.content.data.should.equal(validTxtConfigurationFile.content);
      should.not.exist(configurationFileReturned.content.data.data);
    });

    it('should create a new Configuration-File with type cfg and check db', async function () {
      validCfgConfigurationFile = configurationFileValid;
      validCfgConfigurationFile.type = "cfg";
      validCfgConfigurationFile.content = "testCfg Content";
      response = await agent.post('/api/configurationFiles').send(validCfgConfigurationFile).expect(201);
      response.body._id.should.have.length(24);
      response.headers.location.should.equal(`/api/ConfigurationFiles/${response.body._id}`);
      response.body.name.should.equal(validCfgConfigurationFile.name);
      configurationFileReturned = await ConfigurationFile.findById(response.body._id).exec();
      configurationFileReturned.name.should.equal(validCfgConfigurationFile.name);
      configurationFileReturned.content.data.should.equal(validCfgConfigurationFile.content);
      should.not.exist(configurationFileReturned.content.data.data);
    });

    it('should create a new Configuration-File with type conf and check db', async function () {
      validConfConfigurationFile = configurationFileValid;
      validConfConfigurationFile.type = "conf";
      validConfConfigurationFile.content = "testConfContent";
      response = await agent.post('/api/configurationFiles').send(validConfConfigurationFile).expect(201);
      response.body._id.should.have.length(24);
      response.headers.location.should.equal(`/api/ConfigurationFiles/${response.body._id}`);
      response.body.name.should.equal(validConfConfigurationFile.name);
      configurationFileReturned = await ConfigurationFile.findById(response.body._id).exec();
      configurationFileReturned.name.should.equal(validConfConfigurationFile.name);
      configurationFileReturned.content.data.should.equal(validConfConfigurationFile.content);
      should.not.exist(configurationFileReturned.content.data.data);
    });

    it('should create a new Configuration-File with type crt and check db', async function () {
      validCrtConfigurationFile = configurationFileValid;
      validCrtConfigurationFile.type = "crt";
      validCrtConfigurationFile.content = "testCrtContent";
      response = await agent.post('/api/configurationFiles').send(validCrtConfigurationFile).expect(201);
      response.body._id.should.have.length(24);
      response.headers.location.should.equal(`/api/ConfigurationFiles/${response.body._id}`);
      response.body.name.should.equal(validCrtConfigurationFile.name);
      configurationFileReturned = await ConfigurationFile.findById(response.body._id).exec();
      configurationFileReturned.name.should.equal(validCrtConfigurationFile.name);
      configurationFileReturned.content.data.should.equal(validCrtConfigurationFile.content);
      should.not.exist(configurationFileReturned.content.data.data);
    });

    it('should create a new Configuration-File with type cer and check db', async function () {
      validCerConfigurationFile = configurationFileValid;
      validCerConfigurationFile.type = "cer";
      validCerConfigurationFile.content = "testCerContent";
      response = await agent.post('/api/configurationFiles').send(validCerConfigurationFile).expect(201);
      response.body._id.should.have.length(24);
      response.headers.location.should.equal(`/api/ConfigurationFiles/${response.body._id}`);
      response.body.name.should.equal(validCerConfigurationFile.name);
      configurationFileReturned = await ConfigurationFile.findById(response.body._id).exec();
      configurationFileReturned.name.should.equal(validCerConfigurationFile.name);
      configurationFileReturned.content.data.should.equal(validCerConfigurationFile.content);
      should.not.exist(configurationFileReturned.content.data.data);
    });

    it('should create a new Configuration-File with type key and check db', async function () {
      validKeyConfigurationFile = configurationFileValid;
      validKeyConfigurationFile.type = "key";
      validKeyConfigurationFile.content = "testKeyContent";
      response = await agent.post('/api/configurationFiles').send(validKeyConfigurationFile).expect(201);
      response.body._id.should.have.length(24);
      response.headers.location.should.equal(`/api/ConfigurationFiles/${response.body._id}`);
      response.body.name.should.equal(validKeyConfigurationFile.name);
      configurationFileReturned = await ConfigurationFile.findById(response.body._id).exec();
      configurationFileReturned.name.should.equal(validKeyConfigurationFile.name);
      configurationFileReturned.content.data.should.equal(validKeyConfigurationFile.content);
      should.not.exist(configurationFileReturned.content.data.data);
    });

    it('should create a new Configuration-File with type ini and check db', async function () {
      validIniConfigurationFile = configurationFileValid;
      validIniConfigurationFile.type = "ini";
      validIniConfigurationFile.content = "testIniContent";
      response = await agent.post('/api/configurationFiles').send(validIniConfigurationFile).expect(201);
      response.body._id.should.have.length(24);
      response.headers.location.should.equal(`/api/ConfigurationFiles/${response.body._id}`);
      response.body.name.should.equal(validIniConfigurationFile.name);
      configurationFileReturned = await ConfigurationFile.findById(response.body._id).exec();
      configurationFileReturned.name.should.equal(validIniConfigurationFile.name);
      configurationFileReturned.content.data.should.equal(validIniConfigurationFile.content);
      should.not.exist(configurationFileReturned.content.data.data);
    });

    it('should create a new Configuration-File with type pem and check db', async function () {
      validPemConfigurationFile = configurationFileValid;
      validPemConfigurationFile.type = "pem";
      validPemConfigurationFile.content = "testPemContent";
      response = await agent.post('/api/configurationFiles').send(validPemConfigurationFile).expect(201);
      response.body._id.should.have.length(24);
      response.headers.location.should.equal(`/api/ConfigurationFiles/${response.body._id}`);
      response.body.name.should.equal(validPemConfigurationFile.name);
      configurationFileReturned = await ConfigurationFile.findById(response.body._id).exec();
      configurationFileReturned.name.should.equal(validPemConfigurationFile.name);
      configurationFileReturned.content.data.should.equal(validPemConfigurationFile.content);
      should.not.exist(configurationFileReturned.content.data.data);
    });

    it('should not create a json configurationFile if content is not json', async function () {
      validJsonConfigurationFile = configurationFileValid;
      validJsonConfigurationFile.type = "json";
      validJsonConfigurationFile.content = "\"not\": \"json content\"";
      response = await agent.post('/api/configurationFiles').send(validJsonConfigurationFile).expect(422);
      response.body.message.should.equal('There were Errors found when validating the given JSON. Error: Parse error on line 1:\n' +
        '"not": "json content"\n' +
        '-----^\n' +
        'Expecting \'EOF\', \'}\', \',\', \']\', got \':\'');
    });

    it('should not create a yaml configurationFile if content is not yaml', async function () {
      validYamlConfigurationFile = configurationFileValid;
      validYamlConfigurationFile.type = "yaml";
      validYamlConfigurationFile.content = { "not": "yaml content" };
      response = await agent.post('/api/configurationFiles').send(validYamlConfigurationFile).expect(422);
      response.body.message.should.equal('Non JSON configurationFile content has to be a string. e.g. content: "abc"');
    });

    it('should not create a new Configuration-File when user is not authenticated', async function () {
      response = await nonAuthAgent.post('/api/configurationFiles').send(configurationFileValid).expect(401);
      response.body.message.should.equal('User must be logged in');
    });

    it('should not create a new Configuration-File when user is standard-user', async function () {
      userObject.role_id = roleUserObject._id;

      await userObject.save();
      await agent.post('/api/configurationFiles').auth(validUser.username, validUser.password).send(configurationFileValid).expect(403);
    });

    it('should not create a new Configuration-File when user is admin', async function () {
      userObject.role_id = roleAdminObject._id;

      await userObject.save();
      await agent.post('/api/configurationFiles').auth(validUser.username, validUser.password).send(configurationFileValid).expect(403);
    });

    it('should create a new Configuration-File when user is super-admin', async function () {
      userObject.roles = ['superAdmin'];
      await userObject.save();
      await agent.post('/api/configurationFiles').auth(validUser.username, validUser.password).send(configurationFileValid).expect(201);
    });

    it('should not post more than one Configuration-File with the same name and type', async function () {
      configurationFileObject = new ConfigurationFile(configurationFileValid);
      await configurationFileObject.save();
      response = await agent.post('/api/configurationFiles').send(configurationFileValid).expect(400);
      response.body.message.should.equal('Error, provided combination of name and type is not unique.');
    });

    it('should not post Configuration-File with a name less than 2 characters', async function () {
      configurationFileBad = _.cloneDeep(configurationFileValid);
      configurationFileBad.name = 'x';
      response = await agent.post('/api/configurationFiles').send(configurationFileBad).expect(400);
      response.body.message.should.equal(`Path \`name\` (\`${configurationFileBad.name}\`) is shorter than the minimum allowed length (2).`);
    });

    it('should not post Configuration-File with a name more than 100 characters', async function () {
      configurationFileBad = _.cloneDeep(configurationFileValid);
      configurationFileBad.name = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
      response = await agent.post('/api/configurationFiles').send(configurationFileBad).expect(400);
      response.body.message.should.equal(`Path \`name\` (\`${configurationFileBad.name}\`) is longer than the maximum allowed length (100).`);
    });

    it('should not allow Configuration-File with a non-alphanumeric-underscored name', async function () {
      configurationFileBad = _.cloneDeep(configurationFileValid);
      configurationFileBad.name = '!£$%&';
      response = await agent.post('/api/configurationFiles').send(configurationFileBad).expect(400);
      response.body.message.should.equal('name is not valid; \'!£$%&\' can only contain letters, numbers, dots, dashes and underscores.');
    });

    it('should not post Configuration-File without a name key', async function () {
      configurationFileBad = _.cloneDeep(configurationFileValid);
      delete configurationFileBad.name;
      response = await agent.post('/api/configurationFiles').send(configurationFileBad).expect(400);
      response.body.message.should.equal('Path `name` is required.');
    });

    it('should not post Configuration-File with unknown key', async function () {
      configurationFileBad = _.cloneDeep(configurationFileValid);
      configurationFileBad.rogueKey = 'rogueValue';
      response = await agent.post('/api/configurationFiles').send(configurationFileBad).expect(400);
      response.body.message.should.equal('Field `rogueKey` is not in schema and strict mode is set to throw.');
    });

    it('should respond with bad request with invalid json', async function () {
      configurationFileBad = '{';
      response = await agent.post('/api/configurationFiles').send(configurationFileBad).type('json').expect(400);
      response.body.message.should.equal('There was a syntax error found in your request, please make sure that it is valid and try again');
    });

    it('should post a new log with user-details when Configuration-File is created by a logged-in user', async function () {
      response = await agent.post('/api/configurationFiles').send(configurationFileValid).expect(201);
      response.body._id.should.have.length(24);
      response.headers.location.should.equal(`/api/ConfigurationFiles/${response.body._id}`);
      response.body.name.should.equal(configurationFileValid.name);
      configurationFileReturned = await ConfigurationFile.findById(response.body._id).exec();
      configurationFileReturned.name.should.equal(configurationFileValid.name);

      logReturned = await History.findOne({ associated_id: response.body._id }).exec();
      logReturned.originalData.should.not.equal(undefined);
      logReturned.originalData.name.should.equal(configurationFileValid.name);
      logReturned.createdAt.should.not.equal(undefined);
      logReturned.createdBy.should.not.equal(undefined);
      logReturned.createdBy.username.should.equal(validUser.username);
      logReturned.createdBy.email.should.equal(validUser.email);
      logReturned.updates.should.be.instanceof(Array).and.have.lengthOf(0);
    });

    it('should not post a new log for a Configuration-File that is created with a name beginning with \'A_Health_\'', async function () {
      var configurationFileValidHealth = _.cloneDeep(configurationFileValid);
      configurationFileValidHealth.name = 'A_Health_ConfigurationFile';
      response = await agent.post('/api/configurationFiles').send(configurationFileValidHealth).expect(201);
      response.body._id.should.have.length(24);
      response.headers.location.should.equal(`/api/ConfigurationFiles/${response.body._id}`);
      response.body.name.should.equal(configurationFileValidHealth.name);
      configurationFileReturned = await ConfigurationFile.findById(response.body._id).exec();
      configurationFileReturned.name.should.equal(configurationFileValidHealth.name);

      logReturned = await History.findOne({ associated_id: response.body._id }).exec();
      should.not.exist(logReturned);
    });

    it('should create a new Configuration-File with type JSON and check version is 1 in db', async function () {
      validJsonConfigurationFile = configurationFileValid;
      validJsonConfigurationFile.type = "json";
      validJsonConfigurationFile.content = { "testKey": "testValue" };
      response = await agent.post('/api/configurationFiles').send(configurationFileValid).expect(201);
      response.body._id.should.have.length(24);
      response.headers.location.should.equal(`/api/ConfigurationFiles/${response.body._id}`);
      response.body.name.should.equal(configurationFileValid.name);
      response.body.version.should.equal(1);
      configurationFileReturned = await ConfigurationFile.findById(response.body._id).exec();
      configurationFileReturned.name.should.equal(configurationFileValid.name);
      configurationFileReturned.version.should.equal(1);
    });

    it('should create a new Configuration-File with type JSON and check version is 1 when request version was set as 2 in db', async function () {
      validJsonConfigurationFile = configurationFileValid;
      validJsonConfigurationFile.type = "json";
      validJsonConfigurationFile.content = { "testKey": "testValue" };
      validJsonConfigurationFile.version = 2;
      response = await agent.post('/api/configurationFiles').send(configurationFileValid).expect(201);
      response.body._id.should.have.length(24);
      response.headers.location.should.equal(`/api/ConfigurationFiles/${response.body._id}`);
      response.body.name.should.equal(configurationFileValid.name);
      response.body.version.should.equal(1);
      configurationFileReturned = await ConfigurationFile.findById(response.body._id).exec();
      configurationFileReturned.name.should.equal(configurationFileValid.name);
      configurationFileReturned.version.should.equal(1);
    });
  });

  describe('PUT', function () {
    beforeEach(async function () {
      configurationFileObject = new ConfigurationFile(configurationFileValid); // YAML
      await configurationFileObject.save();
    });

    it('should update a Configuration-File', async function () {
      configurationFileValid2 = _.cloneDeep(configurationFileValid);
      configurationFileValid2.name = 'updatedName';
      response = await agent.put(`/api/configurationFiles/${configurationFileObject._id}`).send(configurationFileValid2).expect(200);
      response.body.name.should.equal(configurationFileValid2.name);
    });


    it('should not update a Configuration-File when new content type is json and old content is YAML', async function () {
      configurationFileValid2 = _.cloneDeep(configurationFileValid);
      configurationFileValid.name = 'updatedName';
      configurationFileValid2.type = 'json';
      delete configurationFileValid2.content;
      response = await agent.put(`/api/configurationFiles/${configurationFileObject._id}`).send(configurationFileValid2).expect(422);
      response.body.message.should.equal('Could not update type/content. JSON type configurationFile has to have a JSON content.');
    });

    it('should not update a Configuration-File type to YAML if content is not YAML', async function () {
      configurationFileValid2 = _.cloneDeep(configurationFileValid);
      configurationFileValid.name = 'updatedName';
      configurationFileValid2.content = { "json": "content" };
      delete configurationFileValid2.type;
      response = await agent.put(`/api/configurationFiles/${configurationFileObject._id}`).send(configurationFileValid2).expect(422);
      response.body.message.should.equal('Cannot update YAML configurationFile, as current or received content/type is not YAML.');
    });

    it('should not update a Configuration-File when user is not authenticated', async function () {
      configurationFileValid2 = _.cloneDeep(configurationFileValid);
      configurationFileValid2.name = 'updatedName';
      response = await nonAuthAgent.put(`/api/configurationFiles/${configurationFileObject._id}`)
        .send(configurationFileValid2).expect(401);
      response.body.message.should.equal('User must be logged in');
    });

    it('should update a Configuration-File when user is standard-user', async function () {
      configurationFileValid2 = _.cloneDeep(configurationFileValid);
      configurationFileValid2.name = 'updatedName';
      userObject.roles = ['user'];
      await userObject.save();
      response = await agent.put(`/api/configurationFiles/${configurationFileObject._id}`)
        .auth(validUser.username, validUser.password).send(configurationFileValid2).expect(200);
    });

    it('should update a Configuration-File when user is admin', async function () {
      configurationFileValid2 = _.cloneDeep(configurationFileValid);
      configurationFileValid2.name = 'updatedName';
      userObject.roles = ['admin'];
      await userObject.save();
      await agent.put(`/api/configurationFiles/${configurationFileObject._id}`)
        .auth(validUser.username, validUser.password).send(configurationFileValid2).expect(200);
    });

    it('should update a Configuration-File when user is super-admin', async function () {
      configurationFileValid2 = _.cloneDeep(configurationFileValid);
      configurationFileValid2.name = 'updatedName';
      userObject.roles = ['superAdmin'];
      await userObject.save();
      await agent.put(`/api/configurationFiles/${configurationFileObject._id}`)
        .auth(validUser.username, validUser.password).send(configurationFileValid2).expect(200);
    });


    it('should not update a Configuration-File when name is not provided', async function () {
      configurationFileValid2 = _.cloneDeep(configurationFileValid);
      configurationFileValid2.name = null;
      configurationFileValid2.type = 'yaml';
      response = await agent.put(`/api/configurationFiles/${configurationFileObject._id}`).send(configurationFileValid2).expect(400);
      response.body.message.should.containEql('Path `name` is required.');
    });

    it('should throw error when Configuration-File name already exists with same type', async function () {
      configurationFileValid2 = _.cloneDeep(configurationFileValid);
      configurationFileValid2.name = 'secondConfigurationFile';
      response = await agent.post('/api/configurationFiles').send(configurationFileValid2).expect(201);
      configurationFileValid2.name = configurationFileValid.name;
      response = await agent.put(`/api/configurationFiles/${response.body._id}`).send(configurationFileValid2).expect(400);
      response.body.message.should.containEql('Error, provided combination of name and type is not unique.');
    });

    it('should update a YAML Configuration-File to JSON using configurationFile ID', async function () {
      configurationFileValid2 = _.cloneDeep(configurationFileValid);
      configurationFileValid2.type = 'json';
      configurationFileValid2.content = { "key19": "value99" };
      response = await agent.put(`/api/configurationFiles/${configurationFileObject._id}`).send(configurationFileValid2).expect(200);
      response.body.type.should.equal(configurationFileValid2.type);
      response.body.content.key19.should.equal(configurationFileValid2.content.key19);
      should.not.exist(response.body.content.data);
    });

    it('should update a JSON Configuration-File to YAML using configurationFile ID', async function () {
      configurationFileValid2 = _.cloneDeep(configurationFileValid);
      configurationFileValid2.name = 'updatedConfigurationFileName';
      configurationFileValid2.type = 'yaml';
      configurationFileValid2.content = "aaa: bbb\nccc: ddd";

      // update configurationFile to JSON format
      configurationFileObject.type = 'json';
      configurationFileObject.content = { "json": "content" };
      await configurationFileObject.save();

      response = await agent.put(`/api/configurationFiles/name/${configurationFileObject.name}/${configurationFileObject.type}`).send(configurationFileValid2).expect(200);
      response.body.name.should.equal(configurationFileValid2.name);
      response.body.type.should.equal(configurationFileValid2.type);
      response.body.content.data.should.eql(configurationFileValid2.content);
      should.not.exist(response.body.content.data.data);
    });

    it('should not update a Configuration-File to json if the new updated content is not in json format', async function () {
      configurationFileValid2 = _.cloneDeep(configurationFileValid);
      configurationFileValid2.type = 'json';
      configurationFileValid2.content = 'not a json';
      response = await agent.put(`/api/configurationFiles/name/${configurationFileObject.name}/${configurationFileObject.type}`).send(configurationFileValid2).expect(422);
      response.body.message.should.equal('Could not update type/content. JSON type configurationFile has to have a JSON content.');
    });

    it('should not update a yaml Configuration-File if the new updated content is not in yaml format', async function () {
      configurationFileValid2 = _.cloneDeep(configurationFileValid);
      configurationFileValid2.type = 'yaml';
      configurationFileValid2.content = { "not": "yaml content" };
      response = await agent.put(`/api/configurationFiles/name/${configurationFileValid.name}/${configurationFileValid.type}`).send(configurationFileValid2).expect(422);
      response.body.message.should.equal('Cannot update YAML configurationFile, as current or received content/type is not YAML.');
    });

    it('should update a json Configuration-File to txt', async function () {
      // update configurationFile to JSON format
      configurationFileObject.type = 'json';
      configurationFileObject.content = { "json": "content" };
      await configurationFileObject.save();

      configurationFileValid2 = _.cloneDeep(configurationFileValid);
      configurationFileValid2.content = '{"json":"content"}';
      configurationFileValid2.type = 'txt';
      response = await agent.put(`/api/configurationFiles/name/${configurationFileObject.name}/${configurationFileObject.type}`).send(configurationFileValid2).expect(200);

      response.body.name.should.equal(configurationFileObject.name);
      response.body.type.should.equal(configurationFileValid2.type);
      response.body.content.data.should.eql(JSON.stringify(configurationFileObject.content));
      should.not.exist(response.body.content.data.data);
    });

    it('should update a yaml Configuration-File to txt', async function () {
      configurationFileValid2 = _.cloneDeep(configurationFileValid);
      configurationFileValid2.type = 'txt';
      configurationFileValid2.content = '"data": "Key: Value"';
      response = await agent.put(`/api/configurationFiles/name/${configurationFileObject.name}/${configurationFileObject.type}`).send(configurationFileValid2).expect(200);
      response.body.name.should.equal(configurationFileObject.name);
      response.body.type.should.equal(configurationFileValid2.type);
      response.body.content.data.should.eql(configurationFileValid2.content);
      should.not.exist(response.body.content.data.data);
    });

    it('should not update a txt Configuration-File to json if the content is not in json format ', async function () {
      // update configurationFile to txt format
      configurationFileObject.type = 'txt';
      configurationFileObject.content = 'txt string';
      await configurationFileObject.save();

      configurationFileValid2 = _.cloneDeep(configurationFileValid)
      configurationFileValid2.type = 'json';
      configurationFileValid2.content = '{ not a json }';
      response = await agent.put(`/api/configurationFiles/name/${configurationFileObject.name}/${configurationFileObject.type}`).send(configurationFileValid2).expect(422);
      response.body.message.should.equal('Could not update type/content. JSON type configurationFile has to have a JSON content.');
    });

    it('should update a Configuration-File using configurationFile Name', async function () {
      configurationFileValid2 = _.cloneDeep(configurationFileValid);
      configurationFileValid2.name = 'updatedConfigurationFileName';
      configurationFileValid2.type = 'json';
      configurationFileValid2.content = { "key": "value" };
      response = await agent.put(`/api/configurationFiles/name/${configurationFileObject.name}/${configurationFileObject.type}`).send(configurationFileValid2).expect(200);
      response.body.name.should.equal(configurationFileValid2.name);
      response.body.type.should.equal(configurationFileValid2.type);
    });

    it('should not introduce .data fields when updating a JSON Configuration-File', async function () {
      configurationFileValid2 = _.cloneDeep(configurationFileValid);

      // update configurationFile to JSON format
      configurationFileObject.type = 'json';
      configurationFileObject.content = { "json": "content" };
      await configurationFileObject.save();

      configurationFileValid2.name = 'updatedConfigurationFileName';
      configurationFileValid2.type = 'json';
      configurationFileValid2.content = { "key": "value" };
      response = await agent.put(`/api/configurationFiles/name/${configurationFileObject.name}/${configurationFileObject.type}`).send(configurationFileValid2).expect(200);
      response.body.name.should.equal(configurationFileValid2.name);
      response.body.type.should.equal(configurationFileValid2.type);
      should.not.exist(response.body.content.data);
    });

    it('should not introduce extra .data fields when updating a YAML Configuration-File', async function () {
      configurationFileValid2 = _.cloneDeep(configurationFileValid);
      configurationFileValid2.name = 'updatedConfigurationFileName';
      response = await agent.put(`/api/configurationFiles/name/${configurationFileObject.name}/${configurationFileObject.type}`).send(configurationFileValid2).expect(200);
      response.body.name.should.equal(configurationFileValid2.name);
      response.body.type.should.equal(configurationFileValid2.type);
      response.body.content.data.should.eql(configurationFileValid2.content);
      should.not.exist(response.body.content.data.data);
    });

    it('should throw 404 when Configuration-File name is not in database during update', async function () {
      response = await agent.put(`/api/configurationFiles/name/fakeConfigurationFile/fakeConfigurationFileType`).send(configurationFileValid2).expect(404);
      response.body.message.should.equal(`A ConfigurationFile with name 'fakeConfigurationFile' and type 'fakeConfigurationFileType' does not exist`);
    });

    it('should not update a Configuration-File when user is not authenticated', async function () {
      configurationFileValid2 = _.cloneDeep(configurationFileValid);
      configurationFileValid2.name = 'updatedConfigurationFileName';
      response = await nonAuthAgent.put(`/api/configurationFiles/${configurationFileObject._id}`)
        .send(configurationFileValid2).expect(401);
      response.body.message.should.equal('User must be logged in');
    });

    it('should update a Configuration-File when user is standard-user', async function () {
      configurationFileValid2 = _.cloneDeep(configurationFileValid);
      configurationFileValid2.name = 'updatedName';
      userObject.roles = ['user'];
      await userObject.save();
      response = await agent.put(`/api/configurationFiles/${configurationFileObject._id}`)
        .auth(validUser.username, validUser.password).send(configurationFileValid2).expect(200);
    });

    it('should update a Configuration-File when user is admin', async function () {
      configurationFileValid2 = _.cloneDeep(configurationFileValid);
      configurationFileValid2.name = 'updatedName';
      userObject.roles = ['admin'];
      await userObject.save();
      await agent.put(`/api/configurationFiles/${configurationFileObject._id}`)
        .auth(validUser.username, validUser.password).send(configurationFileValid2).expect(200);
    });

    it('should update a Configuration-File when user is super-admin', async function () {
      configurationFileValid2 = _.cloneDeep(configurationFileValid);
      configurationFileValid2.name = 'updatedName';
      userObject.roles = ['superAdmin'];
      await userObject.save();
      await agent.put(`/api/configurationFiles/${configurationFileObject._id}`)
        .auth(validUser.username, validUser.password).send(configurationFileValid2).expect(200);
    });

    it('should not update a Configuration-File when name is not provided', async function () {
      configurationFileValid2 = _.cloneDeep(configurationFileValid);
      configurationFileValid2.name = null;
      response = await agent.put(`/api/configurationFiles/${configurationFileObject._id}`).send(configurationFileValid2).expect(400);
      response.body.message.should.equal('Path `name` is required.');
    });

    it('should not update a Configuration-File when type is not provided', async function () {
      configurationFileValid2 = _.cloneDeep(configurationFileValid);
      configurationFileValid2.type = null;
      response = await agent.put(`/api/configurationFiles/${configurationFileObject._id}`).send(configurationFileValid2).expect(400);
      response.body.message.should.equal('Path `type` is required.');
    });

    it('should not update a Configuration-File when content is not provided', async function () {
      configurationFileValid2 = _.cloneDeep(configurationFileValid);
      configurationFileValid2.content = null;
      response = await agent.put(`/api/configurationFiles/${configurationFileObject._id}`).send(configurationFileValid2).expect(400);
      response.body.message.should.equal('Path `content` is required.');
    });

    it('should throw error when Configuration-File name and type already exists', async function () {
      configurationFileValid2 = _.cloneDeep(configurationFileValid);
      configurationFileValid2.name = 'updatedName';
      response = await agent.post('/api/configurationFiles').send(configurationFileValid2).expect(201);
      configurationFileValid2.name = configurationFileValid.name;
      response = await agent.put(`/api/configurationFiles/${response.body._id}`).send(configurationFileValid2).expect(400);
      response.body.message.should.equal('Error, provided combination of name and type is not unique.');
    });

    it('should update a Configuration-File but keep version as 2 when request contains version as 4', async function () {
      configurationFileValid2 = _.cloneDeep(configurationFileValid);
      configurationFileValid.name = 'updatedName';
      configurationFileValid.version = 4;
      response = await agent.put(`/api/configurationFiles/${configurationFileObject._id}`).send(configurationFileValid2).expect(200);
      response.body.name.should.equal(configurationFileValid2.name);
      response.body.version.should.equal(2);
    });
  });

  describe('GET', function () {
    beforeEach(async function () {
      configurationFileObject = new ConfigurationFile(configurationFileValid);
      await configurationFileObject.save();
    });

    it('should be able to get empty Configuration-File list', async function () {
      await configurationFileObject.remove();
      response = await agent.get('/api/configurationFiles').expect(200);
      response.body.should.be.instanceof(Array).and.have.lengthOf(0);
    });

    it('should not be able to get Configuration-File list when user not authenticated', async function () {
      await nonAuthAgent.get('/api/configurationFiles').expect(401);
    });

    it('should be able to get Configuration-File list when user is authenticated', async function () {
      await agent.get('/api/configurationFiles').expect(200);
    });

    it('should be able to get Configuration-File list with one element', async function () {
      response = await agent.get('/api/configurationFiles').expect(200);
      response.body.should.be.instanceof(Array).and.have.lengthOf(1);
      response.body[0].name.should.equal(configurationFileValid.name);
    });

    it('should be able to get Configuration-File list with more than one element', async function () {
      configurationFileValid2 = _.cloneDeep(configurationFileValid);
      configurationFileValid2.name = 'anotherConfigurationFileName';
      configurationFileObject2 = new ConfigurationFile(configurationFileValid2);
      await configurationFileObject2.save();
      response = await agent.get('/api/configurationFiles').expect(200);
      response.body.should.be.instanceof(Array).and.have.lengthOf(2);
      response.body[0].name.should.equal(configurationFileValid2.name);
      response.body[1].name.should.deepEqual(configurationFileValid.name);
    });




    it('should be only able to get all configurationFiles if the user is authenticated or has permission', async function () {
      configurationFileValid2 = _.cloneDeep(configurationFileValid);
      configurationFileValid2.name = 'anotherConfigurationFileName';
      configurationFileObject2 = new ConfigurationFile(configurationFileValid2);
      await configurationFileObject2.save();
      response = await agent.get('/api/configurationFiles').expect(200);
      response.body.should.be.instanceof(Array).and.have.lengthOf(2);
    });

    it('should not be able to get single Configuration-File when user not authenticated using the Configuration-File ID', async function () {
      await nonAuthAgent.get(`/api/configurationFiles/${configurationFileObject._id}`).expect(401);
    });

    it('should not be able to get single Configuration-File when user not authenticated using the Configuration-File name and type', async function () {
      await nonAuthAgent.get(`/api/configurationFiles/name/${configurationFileObject.name}/${configurationFileObject.type}`).expect(401);
    });

    it('should be able to get single Configuration-File when user is authenticated using the Configuration-File ID', async function () {
      var response = await agent.get(`/api/configurationFiles/${configurationFileObject._id}`).auth(validUser.username, validUser.password).expect(200);
      response.body.name.should.equal(configurationFileObject.name);
    });

    it('should be able to get single Configuration-File when user is authenticated using the Configuration-File name', async function () {
      var response = await agent.get(`/api/configurationFiles/name/${configurationFileObject.name}/${configurationFileObject.type}`).auth(validUser.username, validUser.password).expect(200);
      response.body.name.should.equal(configurationFileObject.name);
    });

    it('should throw 404 when id is not in database', async function () {
      response = await agent.get('/api/configurationFiles/000000000000000000000000').expect(404);
      response.body.message.should.equal('A ConfigurationFile with id \'000000000000000000000000\' does not exist');
    });

    it('should throw 404 when id is invalid in the database', async function () {
      response = await agent.get('/api/configurationFiles/0').expect(404);
      response.body.message.should.equal('A ConfigurationFile with id \'0\' does not exist');
    });

    it('should throw 404 when Configuration-File name is not in database during GET', async function () {
      response = await agent.get(`/api/configurationFiles/name/fake_name/${configurationFileObject.type}`).expect(404);
      response.body.message.should.equal(`A ConfigurationFile with name 'fake_name' and type 'yaml' does not exist`);
    });
  });

  describe('DELETE', function () {
    beforeEach(async function () {
      configurationFileObject = new ConfigurationFile(configurationFileValid);
      await configurationFileObject.save();
    });

    it('should delete Configuration-File and check its response and the db', async function () {
      response = await agent.delete(`/api/configurationFiles/${configurationFileObject._id}`).expect(200);
      response.body.should.be.instanceof(Object);
      response.body.name.should.equal(configurationFileObject.name);
      count = await ConfigurationFile.count().exec();
      count.should.equal(0);
    });

    it('should not delete a Configuration-File when user is not authenticated', async function () {
      response = await nonAuthAgent.delete(`/api/configurationFiles/${configurationFileObject._id}`).expect(401);
      response.body.message.should.equal('User must be logged in');
    });

    it('should delete Configuration-File using id when user is standard-user', async function () {
      userObject.roles = ['user'];
      await userObject.save();
      await agent.delete(`/api/configurationFiles/${configurationFileObject._id}`).auth(validUser.username, validUser.password).expect(200);
    });

    it('should delete Configuration-File using id when user is admin', async function () {
      userObject.roles = ['admin'];
      await userObject.save();
      await agent.delete(`/api/configurationFiles/${configurationFileObject._id}`).auth(validUser.username, validUser.password).expect(200);
    });

    it('should delete Configuration-File using id when user is super-admin', async function () {
      userObject.roles = ['superAdmin'];
      await userObject.save();
      await agent.delete(`/api/configurationFiles/${configurationFileObject._id}`).auth(validUser.username, validUser.password).expect(200);
    });

    it('should not delete a Configuration-File using its name when user is not authenticated', async function () {
      response = await nonAuthAgent.delete(`/api/configurationFiles/name/${configurationFileObject.name}/${configurationFileObject.type}`).expect(401);
      response.body.message.should.equal('User must be logged in');
    });

    it('should delete Configuration-File using name when user is standard-user', async function () {
      userObject.roles = ['user'];
      await userObject.save();
      await agent.delete(`/api/configurationFiles/name/${configurationFileObject.name}/${configurationFileObject.type}`).auth(validUser.username, validUser.password).expect(200);
    });

    it('should delete Configuration-File using name when user is admin', async function () {
      userObject.roles = ['admin'];
      await userObject.save();
      await agent.delete(`/api/configurationFiles/name/${configurationFileObject.name}/${configurationFileObject.type}`).auth(validUser.username, validUser.password).expect(200);
    });

    it('should delete Configuration-File using name when user is super-admin', async function () {
      userObject.roles = ['superAdmin'];
      await userObject.save();
      await agent.delete(`/api/configurationFiles/name/${configurationFileObject.name}/${configurationFileObject.type}`).auth(validUser.username, validUser.password).expect(200);
    });

    it('should fail when attempting to delete Configuration-File that does not exist', async function () {
      response = await agent.delete('/api/configurationFiles/000000000000000000000000').expect(404);
      response.body.message.should.equal('A ConfigurationFile with id \'000000000000000000000000\' does not exist');
    });

    it('should throw 404 when Configuration-File name is not in database during DELETE', async function () {
      response = await agent.delete(`/api/configurationFiles/name/fake_name/${configurationFileObject.type}`).expect(404);
      response.body.message.should.equal(`A ConfigurationFile with name 'fake_name' and type 'yaml' does not exist`);
    });

    it('should update existing log with user-details for Configuration-File thats deleted by a logged-in user', async function () {
      response = await agent.delete(`/api/configurationFiles/${configurationFileObject._id}`).expect(200);
      response.body._id.should.have.length(24);
      response.body._id.should.equal(configurationFileObject._id.toString());

      logReturned = await History.findOne({ associated_id: response.body._id }).exec();
      logReturned.originalData.should.not.equal(undefined);
      logReturned.originalData.name.should.equal(configurationFileValid.name);

      logReturned.updates.should.be.instanceof(Array).and.have.lengthOf(0);
      logReturned.deletedAt.should.not.equal(undefined);
      logReturned.deletedBy.should.not.equal(undefined);
      logReturned.deletedBy.username.should.equal(validUser.username);
      logReturned.deletedBy.email.should.equal(validUser.email);
    });

    it('should create a log with defined user-details for Configuration-File that gets deleted by a logged-in user', async function () {
      // clear logs and verify
      await History.remove().exec();
      logReturned = await History.findOne({ associated_id: response.body._id }).exec();
      should.not.exist(logReturned);

      response = await agent.delete(`/api/configurationFiles/${configurationFileObject._id}`).expect(200);
      response.body._id.should.have.length(24);
      response.body._id.should.equal(configurationFileObject._id.toString());

      logReturned = await History.findOne({ associated_id: response.body._id }).exec();
      logReturned.originalData.should.not.equal(undefined);
      logReturned.originalData.name.should.equal(configurationFileValid.name);

      logReturned.updates.should.be.instanceof(Array).and.have.lengthOf(0);
      logReturned.deletedAt.should.not.equal(undefined);
      logReturned.deletedBy.should.not.equal(undefined);
      logReturned.deletedBy.username.should.equal(validUser.username);
      logReturned.deletedBy.email.should.equal(validUser.email);
    });
  });

  describe('SEARCH', function () {
    beforeEach(async function () {
      configurationFileObject = new ConfigurationFile(configurationFileValid);
      await configurationFileObject.save();
    });

    it('should not return Configuration-File when passing in a valid parameter with a non existent Configuration-File ID', async function () {
      response = await agent.get('/api/configurationFiles?q=_id=5bcdbe7287e21906ed4f12ba').expect(200);
      response.body.length.should.equal(0);
    });

    it('should not return Configuration-File when passing in a valid parameter with a non existent parameter', async function () {
      response = await agent.get(`/api/configurationFiles?q=${encodeURIComponent(`_id=${configurationFileObject._id}&name=notExisting`)}`)
        .expect(200);
      response.body.length.should.equal(0);
    });

    it('should return error when not encoding q search parameters', async function () {
      response = await agent.get(`/api/configurationFiles?q=._id=${configurationFileObject._id}&name=notExisting`).expect(422);
      response.body.message.should.equal('Improperly structured query. Make sure to use ?q=<key>=<value> syntax');
    });

    it('should return a single Configuration-File when passing in _id parameter', async function () {
      response = await agent.get(`/api/configurationFiles?q=_id=${configurationFileObject._id}`).expect(200);
      response.body[0].should.be.instanceof(Object);
      response.body[0].name.should.equal(configurationFileObject.name);
    });

    it('should not return Configuration-File when passing in invalid parameter', async function () {
      response = await agent.get('/api/configurationFiles?q=n0nsense=123454321').expect(200);
      response.body.length.should.equal(0);
    });

    it('should return a single Configuration-File when passing in name parameter', async function () {
      response = await agent.get(`/api/configurationFiles?q=name=${configurationFileObject.name}`).expect(200);
      response.body[0].should.be.instanceof(Object);
      response.body[0].name.should.equal(configurationFileObject.name);
    });

    it('should only return fields specified in url', async function () {
      response = await agent.get('/api/configurationFiles?fields=name').expect(200);
      response.body.length.should.equal(1);
      for (var key in response.body) {
        if (Object.prototype.hasOwnProperty.call(response.body, key)) {
          Object.prototype.hasOwnProperty.call(response.body[key], 'name').should.equal(true);
        }
      }
    });

    it('should only return fields specified in url using fields and q functionality', async function () {
      response = await agent.get(`/api/configurationFiles?fields=name&q=name=${configurationFileObject.name}`).expect(200);
      response.body.length.should.equal(1);
      Object.prototype.hasOwnProperty.call(response.body[0], 'name').should.equal(true);
      response.body[0].name.should.equal(configurationFileObject.name);
    });

    it('should return error message when query has invalid search key blah', async function () {
      response = await agent.get(`/api/configurationFiles?q=name=${configurationFileObject.name}&fields=name&blah=blah`).expect(422);
      response.body.message.should.equal('Improperly structured query. Make sure to use ?q=<key>=<value> syntax');
    });

    it('should return error message when queried with improper search', async function () {
      response = await agent.get(`/api/configurationFiles?name=${configurationFileObject.name}`).expect(422);
      response.body.message.should.equal('Improperly structured query. Make sure to use ?q=<key>=<value> syntax');
    });

    it('should return error message when queried with empty q=', async function () {
      response = await agent.get('/api/configurationFiles?q=').expect(422);
      response.body.message.should.equal('Improperly structured query. Make sure to use ?q=<key>=<value> syntax');
    });

    it('should return error message when queried with empty fields=', async function () {
      response = await agent.get('/api/configurationFiles?fields=').expect(422);
      response.body.message.should.equal('Improperly structured query. Make sure to use ?q=<key>=<value> syntax');
    });

    it('should return error message when queried with empty fields= and q=', async function () {
      response = await agent.get('/api/configurationFiles?q=&fields=').expect(422);
      response.body.message.should.equal('Improperly structured query. Make sure to use ?q=<key>=<value> syntax');
    });
  });

  afterEach(async function () {
    await User.remove().exec();
    await Role.remove().exec();
    await ConfigurationFile.remove().exec();
    await History.remove().exec();
  });
});
