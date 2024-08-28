
var fs = require('fs'),
  request = require('request-promise'),
  webdriver = require('selenium-webdriver'),
  By = webdriver.By,
  baseUrl = `http://${process.env.BASE_URL}/`,
  testUsername = process.env.TEST_USERNAME,
  testPassword = process.env.TEST_PASSWORD,
  loginUrl = `${baseUrl}authentication/signin`,
  chromeCapabilities = webdriver.Capabilities.chrome(),
  chromeOptions = {
    args: ['--no-sandbox', '--window-size=1600,1800'],
    prefs: {
      'download.default_directory': '/opt/SmokeTest/'
    }
  };

require('should');
require('selenium-webdriver/testing');
require('mocha-clean');

var projectRequestSchema = fs.readFileSync('/opt/SmokeTest/test_files/projectRequestSchema.json');
var projectRequestSchemaMissingFields = fs.readFileSync('/opt/SmokeTest/test_files/projectRequestSchemaMissingFields.json');
var otherSchema = fs.readFileSync('/opt/SmokeTest/test_files/otherSchema.json');

var response,
  driver,
  element,
  programREST1,
  configurationFileREST1,
  configurationFileREST2;

chromeCapabilities.set('chromeOptions', chromeOptions);

const until = webdriver.until;
const MAX_RETRIES = 0;

// Health Check Related Information
var testFailures = [];
var artifactTypes = ['roles', 'requests', 'schemas', 'programs'];

async function deleteAllHealthArtifactsREST() {
  console.log('\n\tRemoving all A_Health_ artifacts'); // eslint-disable-line no-console
  await asyncForEach(artifactTypes, async function (artifactType) {
    console.log(`\n\tRemoving ${artifactType} Health-Check Artifacts`); // eslint-disable-line no-console
    response = await request.get(`${baseUrl}api/${artifactType}/`).auth(testUsername, testPassword);
    var foundArtifacts = JSON.parse(response);
    foundArtifacts = foundArtifacts.filter(artifact => artifact.name.startsWith('A_Health_'));
    await asyncForEach(foundArtifacts, async foundArtifact => deleteArtifactREST(artifactType, foundArtifact));
  });
}

async function asyncForEach(array, callBack) {
  for (var i = 0; i < array.length; i += 1) {
    await callBack(array[i], i, array); //eslint-disable-line
  }
}

var testErrorNumber = 0;
async function takeScreenshot(name) {
  testErrorNumber += 1;
  var screenshotData = await driver.takeScreenshot();
  var base64Data = screenshotData.replace(/^data:image\/png;base64,/, '');
  fs.writeFile(`images/${testErrorNumber}_${name}.png`, base64Data, 'base64', function () { });
}

async function writeTestReport() {
  var testReport = (testFailures.length === 0) ? 'All tests passed, Smoke-Tests successful' : `Failed tests:\n*${testFailures.join('\n*')}`;
  await fs.writeFile('images/testReport.txt', testReport, err => {
    if (err) console.log('Error occurred while writing testReport.txt: ' + err); // eslint-disable-line no-console
  });
}

// ------------
// UI FUNCTIONS
// ------------
async function clickElement(keyValue, acceptPopUp) {
  await driver.wait(until.elementLocated(keyValue), 10000);
  element = await driver.findElement(keyValue);
  await driver.executeScript('arguments[0].click()', element);
  if (acceptPopUp) await driver.switchTo().alert().accept();
}

async function performActionOnTableItem(objType, objName, actionType, colNo, tableId = getTableId(objType)) {
  await findTableItem(objType, objName, 1, colNo, tableId);
  await clickElement(By.xpath(`//td[contains(.,"${objName}")]/../td[${getActionButtonColumn(objType)}]/a[contains(.,"${actionType}")]`));
  if (actionType === 'Delete') {
    await driver.switchTo().alert().accept();
    await driver.wait(until.elementLocated(By.id(tableId)), 30000);
  }
}

async function openArtifactCreateView(objType) {
  await driver.get(`${baseUrl}${objType}/create`);
  var xpath = (objType === 'productsUpdate') ? '//h1[contains(.,"Updating Products")]' : '//h1[contains(.,"Creating")]';
  await driver.wait(until.elementLocated(By.xpath(xpath)), 5000);
}
async function viewItem(objType, objName, pageUniqueElemId) {
  await performActionOnTableItem(objType, objName, 'View', pageUniqueElemId);
  await driver.wait(until.elementLocated(By.xpath('//h1[contains(.,"Viewing")]')), 5000);
}

async function editItem(objType, objName, colNo) {
  await performActionOnTableItem(objType, objName, 'Edit', colNo);
  await driver.wait(until.elementLocated(By.xpath('//h1[contains(.,"Editing")]')), 5000);
}

async function deleteItem(objType, objName, colNo, expectedToDelete = true) {
  var tableId = getTableId(objType);
  await performActionOnTableItem(objType, objName, 'Delete', colNo, tableId);
  var elemToFind = (expectedToDelete) ? '//div[contains(.,"deleted successfully!")]' : '//h3[contains(.,"deletion failed!")]';
  await driver.wait(until.elementLocated(By.xpath(elemToFind)), 5000);
  var objsToFind = (expectedToDelete) ? 0 : 1;
  (await findTableItem(objType, objName, objsToFind, colNo, tableId));
}

async function doesElementExistInTable(findValue, tableId, expectedTotal, colNo = 1) {
  await doesElementExist(By.xpath(`//td[${colNo}]/*[self::a or self::strong][contains(.,"${findValue}")]`), tableId, expectedTotal);
}

async function doesElementExist(findBy, parentId, expectedTotal, verifyDisplayProperty = true) {
  switch (typeof expectedTotal) {
    case 'number': break;
    case 'boolean':
      expectedTotal = (expectedTotal) ? 1 : 0;
      break;
    default: expectedTotal = 1;
  }
  try {
    var parentElement = (parentId) ? await driver.findElement(By.id(parentId)) : driver;
    var foundElements = await parentElement.findElements(findBy);
    var displayedElements = foundElements.length;
    if (verifyDisplayProperty) {
      var foundElementPromises = [];
      await asyncForEach(foundElements, function (foundElement) {
        foundElementPromises.push(foundElement.isDisplayed());
      });
      var foundElementResults = await Promise.all(foundElementPromises);
      displayedElements = foundElementResults.filter(elem => elem).length;
    }

    if (displayedElements !== expectedTotal) throw new Error(`Found ${displayedElements} element(s), expected ${expectedTotal}.`);
  } catch (err) {
    throw new Error(`Error occurred while verifying element(s) with key-value '${findBy}' exists: ${err.message}`);
  }
}

async function findTableItem(objType, findValue, expectedTotal, colNo, tableId = getTableId(objType)) {
  await openArtifactListView(objType, tableId);
  await doesElementExistInTable(findValue, tableId, expectedTotal, colNo);
}

async function viewLogItem(objType, objName, deleted = false) {
  var tableId = (deleted) ? 'live-table' : 'deleted-table';
  await findTableItem(`logs/${objType}`, objName, false, false, tableId);
  var table = driver.findElement(By.id(tableId));
  await table.findElement(By.xpath(`//td[contains(.,"${objName}")]/../td[7]/a[contains(.,"View")]`)).click();
  await driver.wait(until.elementLocated(By.xpath(`//h1[contains(.,"Log '${objName}'")]`)), 5000);
}

async function restoreLogArtifact(objType, objName, deleted = false, version = 'CREATED-0') {
  await viewLogItem(objType, objName, deleted);
  await driver.findElement(By.id(`restore-${version}`)).click();
  await driver.sleep(2000);
  await driver.switchTo().alert().accept();
  // Verify restore
  await driver.sleep(2000);
  (await driver.findElement(By.xpath('//div[contains(.,"restoration successful")]')).isDisplayed()).should.equal(true);

  await driver.findElement(By.xpath(`//h1[contains(.,"'${objName}'")]`));
}

async function newRoleSetup(name, permissions) {
  await openArtifactCreateView('roles');
  await driver.findElement(By.id('name')).sendKeys(name);
  if (permissions) {
    await clickElement(By.id('add-permission'));
    permissions = permissions[0];
    await driver.findElement(By.id('permissions[0]-resources')).sendKeys(permissions.resources);
    await driver.findElement(By.id(`${permissions.methods}`)).click();
  }
  await clickSaveButton('Role creation');
}

async function newTokenSetup(name, refreshToken) {
  await openArtifactCreateView('tokens');
  await driver.sleep(2000);

  await driver.findElement(By.id('name')).sendKeys(name);
  await driver.sleep(2000);
  await driver.findElement(By.id('refreshToken')).sendKeys(refreshToken);
  await clickSaveButton('Token creation');
}

async function newProgramSetup(name) {
  await openArtifactCreateView('programs');
  await driver.findElement(By.id('name')).sendKeys(name);
  await clickSaveButton('Program creation');
}

async function newSchemaSetup(name, programName, content) {
  content = String(content);
  await openArtifactCreateView('schemas');
  await driver.findElement(By.css('[ng-model="vm.schema.name"]')).sendKeys(name);
  await driver.findElement(By.css('[ng-model="vm.schema.content"]')).click();
  await select2DropdownSelect('program-select', programName);
  var element = await driver.findElement(By.css('[ng-model="vm.schema.content"]'));
  await driver.executeScript('arguments[0].innerHTML=arguments[1]', element, content);
  await driver.findElement(By.css('[ng-model="vm.schema.content"]')).sendKeys(webdriver.Key.ENTER);
  await clickSaveButton('Schema creation');
}

async function newRequestSetup(name, programName, schemaName) {
  await openArtifactCreateView('requests');
  await driver.findElement(By.css('[ng-model="vm.request.name"]')).sendKeys(name);
  await select2DropdownSelect('program-select', programName);
  await select2DropdownSelect('schema-select', schemaName);
  await driver.sleep(1000);
  await clickSaveButton('Request creation');
}

async function newConfigurationFileSetup(name, type, content, isManual = true) {
  await openArtifactCreateView('configurationFiles');
  await driver.findElement(By.name('name')).sendKeys(name);
  await driver.findElement(By.name('filetype')).sendKeys(type);
  await driver.findElement(By.name('filecontent')).sendKeys(content);
  await clickSaveButton('Configuration-File creation');
}

async function select2DropdownSelect(idValue, searchedValue, cssType) {
  if (cssType) {
    await driver.findElement(By.css(`[aria-describedby="select2-${idValue}-container"]`)).click();
  } else {
    await driver.sleep(500);
    await driver.wait(until.elementLocated(By.id(`select2-${idValue}-container`)), 5000);
    await driver.findElement(By.id(`select2-${idValue}-container`)).click();
  }
  await driver.sleep(500);
  await driver.wait(until.elementLocated(By.className('select2-search__field')), 10000);
  await driver.findElement(By.className('select2-search__field')).sendKeys(searchedValue + webdriver.Key.ENTER);
  await driver.sleep(500);
}

async function clickSaveButton(successMessage) {
  await driver.wait(until.elementLocated(By.xpath('//button[contains(.,"Save")]')), 5000);
  await clickElement(By.xpath('//button[contains(.,"Save")]'));
  await driver.sleep(5000);

  if (successMessage) {
    await driver.wait(until.elementLocated(By.xpath('//h1[contains(.,"Viewing")]')), 5000);
    await driver.wait(until.elementLocated(By.xpath(`//div[contains(.,"${successMessage} successful")]`)), 5000);
    (await driver.findElement(By.xpath(`//div[contains(.,"${successMessage} successful")]`)).isDisplayed()).should.equal(true);
  }
}

// --------------
// REST FUNCTIONS
// --------------
async function signInREST(username, password) {
  try {
    response = await request.post(`${baseUrl}api/auth/signin`).form({ username: username, password: password });
    response = JSON.parse(response);
    return response;
  } catch (requestErr) {
    throw new Error(`Failed to sign-in for username ${username}. Received message with status ${requestErr.message}`);
  }
}

async function getArtifactIdREST(artifactType, findKey, findValue) {
  response = await request.get(`${baseUrl}api/${artifactType}?q=${findKey}=${findValue}`).auth(testUsername, testPassword);
  var artifactsFound = JSON.parse(response);
  if (artifactsFound && artifactsFound.length > 0) {
    return artifactsFound[0]._id;
  }
}

function handleErrorREST(errObj, userMessage, safeMode) {
  if (!errObj.message.startsWith('404') || errObj.message.includes('id does not exist')) {
    if (!safeMode) throw new Error(`${userMessage} Received message with status ${errObj.message}`);
  }
}

async function deleteArtifactREST(artifactType, artifact, artifactName, deleteLogs, safeMode) {
  var artifactId;
  try {
    artifactId = artifact ? artifact._id : await getArtifactIdREST(artifactType, 'name', artifactName);
  } catch (idErr) {
    handleErrorREST(idErr, `Failed to get ID for ${artifactType} artifact.`, safeMode);
  }
  try {
    response = await request.delete(`${baseUrl}api/${artifactType}/${artifactId}`).auth(testUsername, testPassword);
  } catch (delErr) {
    handleErrorREST(delErr, `Failed to delete ${artifactType} artifact.`, safeMode);
  }
  try {
    if (deleteLogs) await request.delete(`${baseUrl}api/logs/${artifactType}`).auth(testUsername, testPassword);
  } catch (logErr) {
    handleErrorREST(logErr, `Failed to delete ${artifactType} artifact logs.`, safeMode);
  }
}

async function crudArtifactREST(artifactType, artifactData, artifactId) {
  var crudType = (artifactId) ? 'update' : 'create';
  try {
    if (artifactId) {
      response = await request.put(`${baseUrl}api/${artifactType}/${artifactId}`).auth(testUsername, testPassword).form(artifactData);
    } else {
      response = await request.post(`${baseUrl}api/${artifactType}`).auth(testUsername, testPassword).form(artifactData);
    }
    return JSON.parse(response);
  } catch (requestErr) {
    var extraMsg = (artifactId) ? ` with id ${artifactId}` : '';
    throw new Error(`Failed to ${crudType} ${artifactType} artifact${extraMsg}. Received message with status ${requestErr.message}`);
  }
}

async function crudRoleREST(name, permissions = [], roleId) {
  return crudArtifactREST('roles', { name: name, pathsPermissions: permissions }, roleId);
}

async function crudTokenREST(name, refreshToken) {
  return crudArtifactREST('tokens', { name: name, refreshToken: refreshToken });
}

async function crudProgramREST(name, programId) {
  return crudArtifactREST('programs', { name: name }, programId);
}

async function crudConfigurationFileREST(name, type, content = 'key: value', configurationFileId) {
  var configurationFileJSON = {
    name: name,
    type: type,
    content: content
  };
  return crudArtifactREST('configurationFiles', configurationFileJSON, configurationFileId);
}

async function clickDownloadButton(version) {
  var downloadButton = await driver.findElement(By.name('version'));
  await downloadButton.click();
  await downloadButton.sendKeys(`Version: ${version}`);
  await downloadButton.click();
}

function getActionButtonColumn(objType) {
  if (objType.startsWith('logs/')) return 7;


  switch (objType) {
    case 'requests': return 6;
    case 'schemas': return 5;
    case 'users': return 4;
    case 'configurationFiles': return 6;
    default: return 2;
  }
}
function getTableId(objType) {
  // add -table and if URL is provided: only get first part of objType
  return objType.split('/')[0] + '-table';
}
async function openArtifactListView(objType, tableId = getTableId(objType)) {
  await driver.get(baseUrl + objType);
  if (objType.split('/')[0] === 'logs') tableId = 'live-table';
  await driver.wait(until.elementLocated(By.id(tableId)), 30000);
}
describe('CM Portal Smoke Tests', function () {
  before(async function () {
    this.timeout(100000);
    try {
      driver = await new webdriver.Builder()
        .forBrowser('chrome')
        .withCapabilities(chromeCapabilities)
        .build();

      // Get Admin Information from API
      await signInREST(testUsername, testPassword);
      // Log in test user first
      console.log(`Navigating to login address: ${loginUrl}`); // eslint-disable-line no-console
      await driver.get(loginUrl);
      await driver.wait(until.elementLocated(By.name('username')), 30000);
      await driver.findElement(By.name('username')).sendKeys(testUsername);
      await driver.findElement(By.name('password')).sendKeys(testPassword);
      await driver.findElement(By.css('[class="ebBtn eaLogin-formButton"]')).click();
      console.log('Login complete.'); // eslint-disable-line no-console
      await deleteAllHealthArtifactsREST();
    } catch (beforeAllError) {
      await takeScreenshot('before_initial');
      throw beforeAllError;
    }
  });

  describe('Header @healthtest', function () {
    this.timeout(100000);
    this.retries(MAX_RETRIES);
    it('should get title of CM Portal', async function () {
      await driver.get(baseUrl);
      var title = await driver.getTitle();
      title.should.containEql('CM Portal');
    });

    it('should get header of Schemas page', async function () {
      await openArtifactListView('schemas');
      (await driver.findElement(By.xpath('//h1[contains(.,"Schemas")]')).isDisplayed()).should.equal(true);
    });

    it('should get header of Requests page', async function () {
      await openArtifactListView('requests');
      (await driver.findElement(By.xpath('//h1[contains(.,"Requests")]')).isDisplayed()).should.equal(true);
    });

    it('should get header of Users page', async function () {
      await openArtifactListView('users');
      (await driver.findElement(By.xpath('//h1[contains(.,"Users")]')).isDisplayed()).should.equal(true);
    });

    it('should get header of Roles page', async function () {
      await openArtifactListView('roles');
      (await driver.findElement(By.xpath('//h1[contains(.,"Roles")]')).isDisplayed()).should.equal(true);
    });

    it('should get header of Tokens page', async function () {
      await openArtifactListView('tokens');
      (await driver.findElement(By.xpath('//h1[contains(.,"Tokens")]')).isDisplayed()).should.equal(true);
    });

    it('should get header of Products Update page', async function () {
      await openArtifactListView('productsUpdate');
      (await driver.findElement(By.xpath('//h1[contains(.,"Products Updates")]')).isDisplayed()).should.equal(true);
    });

    it('should get header of Configuration Files page', async function () {
      await openArtifactListView('configurationFiles');
      (await driver.findElement(By.xpath('//h1[contains(.,"Configuration Files")]')).isDisplayed()).should.equal(true);
    });

    it('should get header of Schemas logs page', async function () {
      await openArtifactListView('logs/schemas');
      (await driver.findElement(By.xpath('//h1[contains(.,"Schemas Historical Logs")]')).isDisplayed()).should.equal(true);
    });

    it('should get header of Requests logs page', async function () {
      await openArtifactListView('logs/requests');
      (await driver.findElement(By.xpath('//h1[contains(.,"Requests Historical Logs")]')).isDisplayed()).should.equal(true);
    });

    it('should get header of Roles logs page', async function () {
      await openArtifactListView('logs/roles');
      (await driver.findElement(By.xpath('//h1[contains(.,"Roles Historical Logs")]')).isDisplayed()).should.equal(true);
    });

    it('should get header of Tokens logs page', async function () {
      await openArtifactListView('logs/tokens');
      (await driver.findElement(By.xpath('//h1[contains(.,"Tokens Historical Logs")]')).isDisplayed()).should.equal(true);
    });

    it('should get header of Configuration-Files logs page', async function () {
      await openArtifactListView('logs/configurationFiles');
      (await driver.findElement(By.xpath('//h1[contains(.,"Configuration-Files Historical Logs")]')).isDisplayed()).should.equal(true);
    });
  });

  describe('Create', function () {
    this.timeout(100000);
    this.retries(MAX_RETRIES);

    describe('Role', function () {
      var individualRoleName = 'A_Health_role_Cr';
      var permissions = [{
        resources: '/users',
        methods: 'post'
      }];
      it('should create Role and see it in Roles list', async function () {
        // Save and Confirm
        await newRoleSetup(individualRoleName, permissions);
        await findTableItem('roles', individualRoleName);
        // Delete
        await deleteArtifactREST('roles', null, individualRoleName);
      });
    });

    describe('Token', function () {
      var individualTokenName = 'A_Health_token_Cr';
      var refreshToken = 'REFRESHTOKEN';
      it('should create Token and see it in Tokens list', async function () {
        // Save and Confirm
        await newTokenSetup(individualTokenName, refreshToken);
        await driver.sleep(500);
        await findTableItem('tokens', individualTokenName);
        // Delete
        await deleteArtifactREST('tokens', null, individualTokenName);
      });
    });

    describe('Products Update', function () {
      var productNumber = 'XYZ123';
      var accessControlGroup = 'ACCESSGROUP';
      var signum = 'eistpav';
      var designResponsible = 'BDGSTEST';
      it('all fields should work as expected during update of Product', async function () {
        await newTokenSetup('token', 'refreshToken');
        await openArtifactCreateView('productsUpdate');
        (await driver.findElement(By.xpath('//button[contains(.,"Update")]')).getAttribute('disabled')).should.equal('true');
        await driver.wait(until.elementLocated(By.id('productNumbers')), 5000);
        await driver.findElement(By.id('productNumbers')).sendKeys(productNumber);
        await driver.wait(until.elementLocated(By.id('accessControlGroups')), 5000);
        await driver.findElement(By.id('accessControlGroups')).sendKeys(accessControlGroup);
        await driver.wait(until.elementLocated(By.name('designResponsible')), 5000);
        await driver.findElement(By.name('designResponsible')).sendKeys(designResponsible);
        await select2DropdownSelect('signums-select', signum, 'css');
        await driver.wait(until.elementLocated(By.name('productsAction')), 5000);
        await driver.findElement(By.name('productsAction')).click();
        await driver.findElement(By.xpath('//option[contains(.,"Add")]')).click();
        // Delete
        await deleteArtifactREST('tokens', null, 'token');
      });
      it('should not open Products Update page when no token exists in database', async function () {
        await driver.get(`${baseUrl}productsUpdate/create`);
        await driver.wait(until.elementLocated(By.className('ui-notification')), 5000);
        await driver.wait(until.elementLocated(By.xpath('//div[contains(.,"Mimer functionality currently disabled due to Mimer authentication issue.")]')), 5000);
      });
    });

    describe('Program', function () {
      var individualProgramName = 'A_Health_program_Cr';
      it('should create Program and see it in Programs list', async function () {
        // Save and Confirm
        await newProgramSetup(individualProgramName);
        await findTableItem('programs', individualProgramName);
        // Delete
        await deleteArtifactREST('programs', null, individualProgramName);
      });
    });

    describe('Request', function () {
      var individualRequestName = 'A_Health_request_Cr';
      var schemaRequestName = 'projectRequestTest';
      var programRequestName = 'A_Health_Prog_Req';
      var tokenName = 'tokenRequestTest';
      var refreshToken = 'REFRESHTOKEN';
      it('should create Request and see it in Requests list', async function () {
        await newTokenSetup(tokenName, 'refreshToken');
        programREST1 = await crudProgramREST(programRequestName);
        await newSchemaSetup(schemaRequestName, programRequestName, projectRequestSchema);
        // Save and Confirm
        await newRequestSetup(individualRequestName, programRequestName, schemaRequestName);
        await openArtifactListView('requests', 'requests-table');
        var requestName = await driver.findElement(By.xpath('/html/body/div[1]/section/section/section/ui-view/section/div[3]/div/div/div[2]/table/tbody/tr/td[1]')).getText();
        requestName.should.equal(individualRequestName);
        // Delete
        await deleteArtifactREST('requests', null, individualRequestName);
        await deleteArtifactREST('tokens', null, tokenName);
        await deleteArtifactREST('schemas', null, schemaRequestName);
        await deleteArtifactREST('programs', null, programRequestName);
      });
      it('should not open Create request page when no token exists in database', async function () {
        await driver.get(`${baseUrl}requests/create`);
        await driver.wait(until.elementLocated(By.className('ui-notification')), 5000);
        await driver.wait(until.elementLocated(By.xpath('//div[contains(.,"Mimer functionality currently disabled due to Mimer authentication issue.")]')), 5000);
      });
    });

    describe('Schema', function () {
      var schemaProjectRequestName = 'projectRequestCreate';
      var schemaOtherName = 'otherSchemaCreate';
      var progNameSchemaCr = 'A_Health_Prog_Schema';
      it('should create Project Request Schema and see it in Schema list', async function () {
        programREST1 = await crudProgramREST(progNameSchemaCr);
        // Save and Confirm
        await newSchemaSetup(schemaProjectRequestName, progNameSchemaCr, projectRequestSchema);
        await findTableItem('schemas', schemaProjectRequestName);
        // Delete
        await deleteArtifactREST('schemas', null, schemaProjectRequestName);
        await deleteArtifactREST('programs', null, progNameSchemaCr);
      });

      it('should create Other Schema and see it in Schema list', async function () {
        programREST1 = await crudProgramREST(progNameSchemaCr);
        // Save and Confirm
        await newSchemaSetup(schemaOtherName, progNameSchemaCr, otherSchema);
        await findTableItem('schemas', schemaOtherName);
        // Delete
        await deleteArtifactREST('schemas', null, schemaOtherName);
        await deleteArtifactREST('programs', null, progNameSchemaCr);
      });

      it('should throw an error if Project Request Schema missing fields', async function () {
        programREST1 = await crudProgramREST(progNameSchemaCr);
        var missingContent = String(projectRequestSchemaMissingFields);
        await openArtifactCreateView('schemas');
        await driver.findElement(By.css('[ng-model="vm.schema.name"]')).sendKeys(schemaProjectRequestName);
        await select2DropdownSelect('program-select', progNameSchemaCr);
        await driver.findElement(By.css('[ng-model="vm.schema.content"]')).click();
        var element = await driver.findElement(By.css('[ng-model="vm.schema.content"]'));
        await driver.executeScript('arguments[0].innerHTML=arguments[1]', element, missingContent);
        await driver.findElement(By.css('[ng-model="vm.schema.content"]')).sendKeys(webdriver.Key.ENTER);
        await clickSaveButton();
        await driver.wait(until.elementLocated(By.xpath('//div[contains(.,"Schema creation error")]')), 5000);
        (await driver.findElement(By.xpath('//div[contains(.,"Schema missing one or more of the following")]')).isDisplayed()).should.equal(true);
        await deleteArtifactREST('programs', null, progNameSchemaCr);
      });
    });

    describe('Product', function () {
      var individualTokenName = 'A_Health_token_Cr';
      var refreshToken = 'REFRESHTOKEN';
      it('all fields should work as expected during creation of Product', async function () {
        var jobType = 'MS';
        var versioningScheme = 'SemVer2.0.0';
        await newTokenSetup(individualTokenName, refreshToken);
        await driver.get(`${baseUrl}products/create`);
        await driver.sleep(500);
        await driver.findElement(By.id('product-jobtype')).click();
        await driver.findElement(By.xpath(`//option[contains(.,"${jobType}")]`)).click();
        await driver.sleep(500);
        (await driver.findElement(By.xpath('//button[contains(.,"Save")]')).getAttribute('disabled')).should.equal('true');
        await driver.findElement(By.name('designation')).sendKeys('MIMER SMOKETEST');
        // Add Alias
        await clickElement(By.id('add-designationAlias'));
        await driver.findElement(By.name('designationAlias[0]')).sendKeys('Smoketest Alias');

        await driver.findElement(By.name('productDescription')).sendKeys('Product Description Smoketest');
        await driver.findElement(By.name('designation')).sendKeys('MIMER SMOKETEST');
        await driver.findElement(By.name('designResponsible')).sendKeys('Smoketest Alias');
        await driver.findElement(By.name('versioningScheme')).click();
        await driver.findElement(By.xpath(`//option[contains(.,"${versioningScheme}")]`)).click();
        await select2DropdownSelect('adminsAccess', 'eistpav', 'css');
        await select2DropdownSelect('usersAccess', 'emaalbd', 'css');
        await driver.findElement(By.xpath('//body')).click();
        await driver.sleep(500);

        // Delete
        await deleteArtifactREST('tokens', null, individualTokenName);
      });
    });

    describe('Configuration-File', function () {
      // Artifact Details
      var testJson = { testKey1: 'testValue' };

      var individualFileName = 'A_Health_file_Cr';
      it('should create Configuration_file with yaml file type and see it in Configuration-Files list @healthtest', async function () {
        // Save and Confirm
        await newConfigurationFileSetup(individualFileName, 'yaml', 'key: value');
        // Delete
        await deleteArtifactREST('configurationFiles', null, individualFileName);
      });

      it('should create Configuration_file with .json file type and see it in Configuration-Files list @healthtest', async function () {
        // Save and Confirm
        await newConfigurationFileSetup(individualFileName, 'json', JSON.stringify(testJson));
        await findTableItem('configurationFiles', individualFileName, false, false);
        // Delete
        await deleteArtifactREST('configurationFiles', null, individualFileName);
      });

      it('should create Configuration_file with .txt file type and see it in Configuration-Files list @healthtest', async function () {
        // Save and Confirm
        await newConfigurationFileSetup(individualFileName, 'txt', 'testTxtFile');
        await findTableItem('configurationFiles', individualFileName, false, false);
        // Delete
        await deleteArtifactREST('configurationFiles', null, individualFileName);
      });

      it('should not create Configuration_file with type json if the content is not in json format @healthtest', async function () {
        await openArtifactCreateView('configurationFiles');
        var toggle = true;
        await driver.findElement(By.name('name')).sendKeys(individualFileName);
        await driver.findElement(By.name('filetype')).sendKeys('json');
        await driver.findElement(By.name('filecontent')).sendKeys('notJsonContent');
        // try Save
        await clickSaveButton();
        // check save button is now disabled
        (await driver.findElement(By.xpath('//div[contains(.,"SyntaxError")]')).isDisplayed()).should.equal(true);
      });

      it('should not create Configuration_file with type yaml if the content is not in yaml format  @healthtest', async function () {
        await openArtifactCreateView('configurationFiles');
        var toggle = true;
        await driver.findElement(By.name('name')).sendKeys(individualFileName);
        await driver.findElement(By.name('filetype')).sendKeys('yaml');
        await driver.findElement(By.name('filecontent')).sendKeys('{notYamlContent}');
        (await driver.findElement(By.xpath('//div[contains(.,"Malformed inline YAML")]')).isDisplayed()).should.equal(true);
      });
    });
  });

  describe('Edit', function () {
    this.timeout(100000);
    this.retries(MAX_RETRIES);
    var roleName = 'A_Health_role_Ed';
    var tokenName = 'A_Health_token_Ed';
    var programName = 'A_Health_program_Ed';

    var roleREST1,
      tokenREST1,
      programREST1;

    describe('Role', function () {
      it('should edit Role and see it in Roles list', async function () {
        // Prep
        roleREST1 = await crudRoleREST(roleName);
        var newRoleName = 'A_Health_role_Ed2';
        // Edit Details
        await editItem('roles', roleName);
        await driver.findElement(By.name('name')).clear();
        await driver.findElement(By.name('name')).sendKeys(newRoleName);
        // Save and Confirm
        await clickSaveButton('Role update');
        await findTableItem('roles', newRoleName);
        // Delete
        await deleteArtifactREST('roles', roleREST1);
      });
    });

    describe('Token', function () {
      it('should edit Token and see it in Tokens list', async function () {
        // Prep
        tokenREST1 = await crudTokenREST(tokenName, 'refreshToken');
        var newTokenName = 'A_Health_token_Ed2';
        // Edit Details
        await editItem('tokens', tokenName);
        await driver.findElement(By.name('name')).clear();
        await driver.sleep(2000);
        await driver.findElement(By.name('name')).sendKeys(newTokenName);
        // Save and Confirm
        await clickSaveButton('Token update');
        await findTableItem('tokens', newTokenName);
        // Delete
        await deleteArtifactREST('tokens', tokenREST1);
      });
    });

    describe('Program', function () {
      it('should edit Program and see it in Programs list', async function () {
        // Prep
        programREST1 = await crudProgramREST(programName);
        var newProgramName = 'A_Health_program_Ed2';
        // Edit Details
        await editItem('programs', programName);
        await driver.findElement(By.name('name')).clear();
        await driver.findElement(By.name('name')).sendKeys(newProgramName);
        // Save and Confirm
        await clickSaveButton('Program update');
        await findTableItem('programs', newProgramName);
        // Delete
        await deleteArtifactREST('programs', programREST1);
      });
    });

    describe('Schema', function () {
      var schemaProjectRequestNameEdit = 'projectRequestEdit';
      var schemaOtherNameEdit = 'otherSchemaEdit';
      var progNameSchemaCr = 'A_Health_Prog_Schema';

      it('should edit Project Request Schema and see it in Schemas list', async function () {
        // Prep
        programREST1 = await crudProgramREST(progNameSchemaCr);
        await newSchemaSetup(schemaProjectRequestNameEdit, progNameSchemaCr, projectRequestSchema);
        // Edit Details
        await editItem('schemas', schemaProjectRequestNameEdit);
        await driver.findElement(By.name('name')).clear();
        await driver.findElement(By.name('name')).sendKeys('projectRequestEditNew');
        // Save and Confirm
        await clickSaveButton('Schema update');
        await findTableItem('schemas', 'projectRequestEditNew');
        // Delete
        await deleteArtifactREST('schemas', null, 'projectRequestEditNew');
        await deleteArtifactREST('programs', null, progNameSchemaCr);
      });

      it('should edit Other Schema and see it in Schemas list', async function () {
        // Prep
        programREST1 = await crudProgramREST(progNameSchemaCr);
        await newSchemaSetup(schemaOtherNameEdit, progNameSchemaCr, projectRequestSchema);
        // Edit Details
        await editItem('schemas', schemaOtherNameEdit);
        await driver.findElement(By.name('name')).clear();
        await driver.findElement(By.name('name')).sendKeys('newOtherSchemaName');
        // Save and Confirm
        await clickSaveButton('Schema update');
        await findTableItem('schemas', 'newOtherSchemaName');
        // Delete
        await deleteArtifactREST('schemas', null, 'newOtherSchemaName');
        await deleteArtifactREST('programs', null, progNameSchemaCr);
      });

      it('should throw an error when changing schema type to project request and content is missing mandatory fields', async function () {
        // Prep
        programREST1 = await crudProgramREST(progNameSchemaCr);
        await newSchemaSetup(schemaOtherNameEdit, progNameSchemaCr, otherSchema);
        // Edit Details
        await editItem('schemas', schemaOtherNameEdit);
        await driver.findElement(By.name('name')).clear();
        await driver.findElement(By.name('name')).sendKeys(schemaProjectRequestNameEdit);
        // Try save
        await clickSaveButton();
        await driver.wait(until.elementLocated(By.xpath('//div[contains(.,"Schema update error")]')), 5000);
        (await driver.findElement(By.xpath('//div[contains(.,"Schema missing one or more of the following")]')).isDisplayed()).should.equal(true);
        // Delete
        await deleteArtifactREST('schemas', null, schemaOtherNameEdit);
        await deleteArtifactREST('programs', null, progNameSchemaCr);
      });
    });

    describe('User', function () {
      it('should edit User details and see it in User view', async function () {
        var signum = 'emaalbd';
        var defaultRole = 'superAdmin';
        var newRole = 'admin';
        await editItem('users', signum);
        await driver.findElement(By.name('role')).click();
        await driver.findElement(By.xpath(`//option[contains(.,"${newRole}")]`)).click();
        // Save and Confirm
        await clickSaveButton('User update');
        (await driver.findElement(By.xpath(`//p[contains(.,"${newRole}")]`)).isDisplayed()).should.equal(true);

        // Reset to default value
        await editItem('users', signum);
        await driver.findElement(By.name('role')).click();
        await driver.findElement(By.xpath(`//option[contains(.,"${defaultRole}")]`)).click();
        await clickSaveButton('User update');
      });
    });

    describe('Configuration-File', function () {
      it('should edit Configuration-File and see it in Configuration-Files list @healthtest', async function () {
        // Prep
        var configurationFileName = 'A_Health_file_Ed';
        configurationFileREST1 = await crudConfigurationFileREST(configurationFileName, 'yaml');
        var newConfigurationFileName = 'A_Health_file_Ed2';
        // Edit Details
        await editItem('configurationFiles', configurationFileName);
        await driver.findElement(By.name('name')).sendKeys(newConfigurationFileName);
        await driver.findElement(By.name('filecontent')).sendKeys('\nnew_key: new_value');
        // Save and Confirm
        await clickSaveButton('Configuration-File update', 'Smoketest Reason');
        await findTableItem('configurationFiles', newConfigurationFileName, false, false);
        // Delete
        await deleteArtifactREST('configurationFiles', configurationFileREST1);
      });
    });

    afterEach(async function () {
      try {
        await deleteArtifactREST('roles', roleREST1, false, false, true);
        await deleteArtifactREST('tokens', tokenREST1, false, false, true);
        await deleteArtifactREST('configurationFiles', configurationFileREST1, false, false, true);
      } catch (afterError) {
        await takeScreenshot('aftereach_edit');
        throw afterError;
      }
    });
  });

  describe('Delete', function () {
    this.timeout(100000);
    this.retries(MAX_RETRIES);
    var roleName = 'A_Health_role_Del';
    var tokenName = 'A_Health_token_Del';
    var programName = 'A_Health_program_Del';
    var schemaName = 'projectRequestSchemaDelete';
    var requestName = 'A_Health_request_Delete';
    var configurationFileName = 'A_Health_configurationFile_Delete';

    it('should delete Role', async function () {
      await newRoleSetup(roleName);
      await deleteItem('roles', roleName);
    });

    it('should delete Token', async function () {
      await newTokenSetup(tokenName, 'refreshToken');
      await deleteItem('tokens', tokenName);
    });

    it('should delete Program', async function () {
      await newProgramSetup(programName);
      await deleteItem('programs', programName);
    });

    it('should not delete Program attached to a Schema', async function () {
      await newProgramSetup(programName);
      await newSchemaSetup(schemaName, programName, projectRequestSchema);
      await deleteItem('programs', programName, 1, false);
      await deleteItem('schemas', schemaName);
      await deleteItem('programs', programName);
    });

    it('should delete Request', async function () {
      var programNameReq = 'A_Health_program_Del2';
      var schemaNameReq = 'projectRequestDelete';
      await newTokenSetup(tokenName, 'refreshToken');
      await newProgramSetup(programNameReq);
      await newSchemaSetup(schemaNameReq, programNameReq, projectRequestSchema);
      await newRequestSetup(requestName, programNameReq, schemaNameReq);
      await deleteItem('tokens', tokenName);
      await deleteItem('requests', requestName);
      await deleteItem('schemas', schemaNameReq);
      await deleteItem('programs', programNameReq);
    });

    it('should not delete Schema attached to a Request', async function () {
      var programNameReq = 'A_Health_program_Del3';
      var schemaNameReq = 'projectRequestDelete2';
      await newTokenSetup(tokenName, 'refreshToken');
      await newProgramSetup(programNameReq);
      await newSchemaSetup(schemaNameReq, programNameReq, projectRequestSchema);
      await newRequestSetup(requestName, programNameReq, schemaNameReq);
      await deleteItem('tokens', tokenName);
      await deleteItem('schemas', schemaNameReq, 1, false);
      await deleteItem('requests', requestName);
      await deleteItem('schemas', schemaNameReq);
      await deleteItem('programs', programNameReq);
    });

    it('should delete Schema', async function () {
      programREST1 = await crudProgramREST(programName);
      await newTokenSetup(tokenName, 'refreshToken');
      await newSchemaSetup(schemaName, programName, projectRequestSchema);
      await deleteItem('tokens', tokenName);
      await deleteItem('schemas', schemaName);
      await deleteItem('programs', programName);
    });

    it('should delete ConfigurationFile @healthtest', async function () {
      configurationFileREST1 = await crudConfigurationFileREST(configurationFileName, 'yaml');
      await deleteItem('configurationFiles', configurationFileName);
    });

    afterEach(async function () {
      try {
        await deleteArtifactREST('roles', null, roleName, true, true);
        await deleteArtifactREST('tokens', null, tokenName, true, true);
        await deleteArtifactREST('productsUpdates', null, 'GMT', null, true);
      } catch (afterError) {
        await takeScreenshot('aftereach_delete');
        throw afterError;
      }
    });
  });

  describe('Restore', function () {
    this.timeout(100000);
    this.retries(MAX_RETRIES);
    var roleName = 'Restore-Role';
    var roleREST1;
    var configurationFileName = 'Restore-YAML-ConfigurationFile';
    var configurationFileName2 = 'Restore-JSON-ConfigurationFile';

    describe('Role', function () {
      beforeEach(async function () {
        roleREST1 = await crudRoleREST(roleName);
      });

      it('should restore a Role to a previous version', async function () {
        // Modify and verify
        var modifiedPermissions = [{ resources: '/roles', methods: '*' }];
        roleREST1 = await crudRoleREST(roleName, modifiedPermissions, roleREST1._id);
        roleREST1.pathsPermissions[0].resources.should.equal(modifiedPermissions[0].resources);
        // Restore Old Version
        await restoreLogArtifact('roles', roleName);
        // Verify restore
        (await driver.findElements(By.xpath(`//textarea[contains(.,'${modifiedPermissions}')]`))).length.should.equal(0);
      });

      it('should restore a deleted Role', async function () {
        // Delete
        await deleteArtifactREST('roles', roleREST1);
        // Restore Deleted
        await restoreLogArtifact('roles', roleName, true);
        // Verify restore
        await driver.findElement(By.xpath(`//h1[contains(.,"Viewing Role '${roleName}'")]`));
      });

      afterEach(async function () {
        try {
          await deleteArtifactREST('roles', null, roleName, true, true);
        } catch (afterError) {
          await takeScreenshot('aftereach_restore');
          throw afterError;
        }
      });
    });

    describe('Program', function () {
      var programName = 'Restore-Program';
      var programREST1;

      beforeEach(async function () {
        programREST1 = await crudProgramREST(programName);
      });

      it('should restore a Program to a previous version', async function () {
        // Prepare
        var modifiedName = 'newProgramVersion';
        programREST1 = await crudProgramREST(modifiedName, programREST1._id);

        programREST1.name.should.equal(modifiedName);
        // Restore Old Version
        await viewLogItem('programs', modifiedName, false);
        await driver.findElement(By.id('restore-CREATED-0')).click();
        await driver.switchTo().alert().accept();
        // Verify restore
        await driver.sleep(2000);
        (await driver.findElement(By.xpath('//div[contains(.,"restoration successful")]')).isDisplayed()).should.equal(true);
        await driver.findElement(By.xpath(`//h1[contains(.,"'${programName}'")]`));
      });

      it('should restore a deleted Program', async function () {
        // Delete
        await deleteArtifactREST('programs', programREST1);
        // Restore Deleted
        await restoreLogArtifact('programs', programName, true);
        // Verify restore
        await driver.findElement(By.xpath(`//h1[contains(.,"Viewing Program '${programName}'")]`));
      });

      afterEach(async function () {
        try {
          await deleteArtifactREST('programs', null, programName, true, true);
        } catch (afterError) {
          await takeScreenshot('aftereach_restore');
          throw afterError;
        }
      });
    });

    describe('ConfigurationFile', function () {
      beforeEach(async function () {
        configurationFileREST1 = await crudConfigurationFileREST(configurationFileName, 'yaml');
        configurationFileREST2 = await crudConfigurationFileREST(configurationFileName2, 'json', { key: 'value' });
      });

      it('should restore a ConfigurationFile with type JSON to a previous version', async function () {
        // Modify and verify
        configurationFileREST1 = await crudConfigurationFileREST(configurationFileName2, 'json', { key: 'new_value' }, configurationFileREST2._id, 'Smoketest Update');
        configurationFileREST1.content.key.should.equal('new_value');

        // Restore Old Version
        await restoreLogArtifact('configurationFiles', configurationFileName2, true, 'CREATED-0', true);
        // async function restoreLogArtifact(objType, objName, deleted = false, version = 'CREATED-0', isConfigFile) {

        // Verify restore
        var textValue = await driver.findElement(By.id('textAreaContentJSON')).getAttribute('value');
        textValue.should.containEql('"key": "value"');
      });

      it('should restore a ConfigurationFile with type YAML to a previous version', async function () {
        // Modify and verify
        configurationFileREST1 = await crudConfigurationFileREST(configurationFileName, 'yaml', 'new_key: new_value', configurationFileREST1._id, 'Smoketest Update');
        configurationFileREST1.content.data.should.equal('new_key: new_value');
        // Restore Old Version
        await restoreLogArtifact('configurationFiles', configurationFileName);
        // Verify restore
        var textValue = await driver.findElement(By.id('textAreaContentNotJSON')).getAttribute('value');
        textValue.should.containEql('key: value');
      });
      it('should restore a deleted Configuration-File', async function () {
        // Delete
        await deleteArtifactREST('configurationFiles', configurationFileREST1);
        await driver.sleep(2000);
        // Restore Deleted
        await restoreLogArtifact('configurationFiles', configurationFileName, true);
        // await restoreLogArtifact('configurationFiles', configurationFileName, true);

        // Verify restore
        var textValue = await driver.findElement(By.id('textAreaContentNotJSON')).getAttribute('value');
        textValue.should.containEql('key: value');
      });
    });

    afterEach(async function () {
      try {
        await deleteArtifactREST('configurationFiles', null, configurationFileName, true, true);
        await deleteArtifactREST('configurationFiles', null, configurationFileName2, true, true);
      } catch (afterError) {
        await takeScreenshot('aftereach_restore');
        throw afterError;
      }
    });
  });

  describe('Download Configuration-File', function () {
    this.timeout(80000);
    this.retries(MAX_RETRIES);
    var configurationFileName;

    it('should download Configuration-File with type YAML', async function () {
      configurationFileName = 'testYAML';
      configurationFileREST1 = await crudConfigurationFileREST(configurationFileName, 'yaml');
      var docFile = `/opt/SmokeTest/${configurationFileName}.yaml`;
      await viewItem('configurationFiles', configurationFileName);
      await clickDownloadButton('1');
      await driver.sleep(2000);
      var docYAML = fs.readFileSync(docFile, 'utf8');
      (docYAML.includes('key')).should.equal(true);
    });

    it('should download Configuration-File with type JSON', async function () {
      var configurationFileName = 'testJSON';
      configurationFileREST1 = await crudConfigurationFileREST(configurationFileName, 'json', '{ "key": "value" }');
      var docFile = `/opt/SmokeTest/${configurationFileName}.json`;
      await viewItem('configurationFiles', configurationFileName);
      await clickDownloadButton('1');
      await driver.sleep(1000);
      var docJSON = fs.readFileSync(docFile, 'utf8');
      docJSON = JSON.parse(docJSON);
      (Object.prototype.hasOwnProperty.call(docJSON, 'key')).should.equal(true);
    });

    it('should download ConfigurationFile with type txt', async function () {
      var configurationFileName = 'testTxt';
      configurationFileREST1 = await crudConfigurationFileREST(configurationFileName, 'txt', 'Test text file');
      var docFile = `/opt/SmokeTest/${configurationFileName}.txt`;
      await viewItem('configurationFiles', configurationFileName);
      await clickDownloadButton('1');
      await driver.sleep(1000);
      var docTxt = fs.readFileSync(docFile, 'utf8');
      (docTxt.includes('Test text file')).should.equal(true);
    });

    afterEach(async function () {
      try {
        await deleteArtifactREST('configurationFiles', configurationFileREST1, false, false, true);
      } catch (afterError) {
        await takeScreenshot('aftereach_edit');
        throw afterError;
      }
    });
  });

  describe('Help & API Documentation', function () {
    this.timeout(100000);
    this.retries(MAX_RETRIES);
    it('should get Help Documentation page @healthtest', async function () {
      this.timeout(40000);
      await driver.get(baseUrl);
      await driver.findElement(By.className('icon-help')).click();
      await clickElement(By.css('[href="/helpdocs/"]'));
      await driver.getAllWindowHandles().then(async function gotWindowHandles(allHandles) {
        await driver.switchTo().window(allHandles[1]);
        await driver.wait(until.elementLocated(By.xpath('//a[contains(.,"Help Center")]')), 30000);
        var found = await driver.findElement(By.css('[href="#help/app/helpdocs/topic/features/roles"]')).then(function () {
          return true;
        }, function (err) {
          if (err instanceof webdriver.error.NoSuchElementError) {
            return false;
          }
        });
        await driver.close();
        await driver.switchTo().window(allHandles[0]);
        found.should.be.equal(true);
      });
    });

    it('should get API Documentation page @healthtest', async function () {
      this.timeout(40000);
      await driver.get(baseUrl);
      await driver.findElement(By.className('icon-help')).click();
      await clickElement(By.css('[href="/apidocs/"]'));
      await driver.getAllWindowHandles().then(async function gotWindowHandles(allHandles) {
        await driver.switchTo().window(allHandles[1]);
        await driver.wait(until.elementLocated(By.css('[alt="Swagger UI"]')), 30000);
        var found = await driver.findElement(By.css('[href="#/Historical Logs"]')).then(function () {
          return true;
        }, function (err) {
          if (err instanceof webdriver.error.NoSuchElementError) {
            return false;
          }
        });
        await driver.close();
        await driver.switchTo().window(allHandles[0]);
        found.should.be.equal(true);
      });
    });
  });

  afterEach(async function () {
    if (this.currentTest.state === 'failed') {
      var failedTestTitle = this.currentTest.title.replace(/ /g, '_');
      await takeScreenshot(failedTestTitle);
      testFailures.push(failedTestTitle);
    }
  });

  after(async function () {
    this.timeout(250000);
    try {
      await writeTestReport();
      await deleteAllHealthArtifactsREST();
    } catch (removeArtifactsError) {
      throw removeArtifactsError;
    }
    return driver.quit();
  });
});
