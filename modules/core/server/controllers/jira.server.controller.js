var JiraClient = require('jira-connector');
var _ = require('lodash');
var Schema = require('../../../schemas/server/models/schemas.server.model.js').Schema;

module.exports.getJiraClient = function (jiraUrl) {
  let buff = Buffer.from(`${process.env.DTTADM100_USERNAME}:${process.env.DTTADM100_PASSWORD}`);
  var auth = buff.toString('base64');
  var jira = new JiraClient({
    host: jiraUrl,
    basic_auth: {
      base64: auth
    }
  });
  return jira;
};

module.exports.createJiraIssue = async function (request) {
  if (process.env.NODE_ENV === 'production') {
    var jiraFields = await getJiraIssueFields(request);
    var jiraClient = module.exports.getJiraClient(request.content.parameters.jiraUrl);
    try {
      var newIssue = await jiraClient.issue.createIssue({ fields: jiraFields });
      request.jira = newIssue.key;
    } catch (jiraCreationError) {
      throw new Error(`Could not create a Jira Issue with error: ${jiraCreationError}`);
    }
  }
};

async function getJiraIssueFields(request) {
  var jiraLabels = [];
  var jiraComponents = request.content.parameters.jiraComponents;
  var jiraProject = request.content.parameters.jiraProject;

  if (request.content.parameters.jiraLabels) {
    jiraLabels = request.content.parameters.jiraLabels.split(',');
  }

  var issueFields = {
    summary: `New Project Request: ${request.content.parameters.productName}`,
    issuetype: { name: 'Task' },
    description: await getJiraDescription(request),
    project: { key: jiraProject },
    labels: jiraLabels,
    components: [{ name: jiraComponents }] // jiraComponents field
  };
  var extraFields = [];
  // handle different types project
  if (jiraProject === 'CIS') {
    var jiraTeamName = request.content.parameters.jiraTeamName;
    var jiraProgram = request.content.parameters.jiraProgram;
    var jiraLocationSite = request.content.parameters.jiraLocationSite;
    extraFields = {
      customfield_15706: jiraTeamName, // sub-area or team name
      customfield_16801: { value: jiraProgram }, // PDG/Area
      customfield_16800: { value: jiraLocationSite } // Location site
    };
  }
  return _.merge(issueFields, extraFields);
}

async function getJiraDescription(request) {
  var baseTable = await getBaseTable(request);
  var jiraDescription = `
      ${baseTable} `;
  return jiraDescription;
}

async function getBaseTable(request) {
  var fieldsToIgnore = ['jiraUrl', 'jiraProgram', 'jiraComponents', 'jiraLabels', 'jiraTeamName', 'jiraLocationSite', 'jiraProject'];
  var schema = await Schema.findOne({ _id: request.schema_id });
  var schemaDefinitions = schema.content.definitions;

  var tableElements = [];
  Object.keys(request.content.parameters).forEach(function (key) {
    if (!fieldsToIgnore.includes(key.toString())) {
      tableElements.push({ key: schemaDefinitions[key].title, value: request.content.parameters[key] });
    }
  });

  var baseTable = `h4. Filled out Form:
      ||Question||Answer||`;

  tableElements.forEach(function (element) {
    baseTable += `\n|${element.key}:|${element.value}`;
  });

  return baseTable;
}
