'use strict';

var fs = require('fs'),
  validator = require('validator'),
  requestPromise = require('request-promise'),
  nodemailer = require('nodemailer'),
  _ = require('lodash'),
  config = require('../../../../config/config');

var mailTransporter = nodemailer.createTransport({
  host: 'smtp.ericsson.net',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.DTT_EMAIL_ADDRESS,
    pass: process.env.DTT_EMAIL_PASSWORD
  },
  tls: { rejectUnauthorized: false } // dont check certificate trust
});
/**
 * Render the main application page
 */
exports.renderIndex = function (req, res) {
  var safeUserObject = null;
  if (req.user) {
    safeUserObject = {
      displayName: validator.escape(req.user.displayName),
      username: validator.escape(req.user.username),
      created: req.user.created.toString(),
      role_id: req.user.role_id,
      permissions: req.user.permissions,
      email: validator.escape(req.user.email),
      lastName: validator.escape(req.user.lastName),
      firstName: validator.escape(req.user.firstName)
    };
  }

  res.render('modules/core/server/views/index', {
    user: JSON.stringify(safeUserObject),
    sharedConfig: JSON.stringify(config.shared)
  });
};

exports.loginTest = async function (req, res) {
  res.send({ message: 'success' });
};

exports.getVersion = async function (req, res) {
  var version = await readFileAsync('VERSION');
  res.send(version);
};

function readFileAsync(path) {
  return new Promise(function (resolve, reject) {
    fs.readFile(path, 'utf8', function (error, result) {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
  });
}

/**
 * Render the server not found responses
 * Performs content-negotiation on the Accept HTTP header
 */
exports.renderNotFound = function (req, res) {
  res.status(404).format({
    'text/html': function () {
      res.render('modules/core/server/views/404', {
        url: req.originalUrl
      });
    },
    'application/json': function () {
      res.json({
        error: 'Path not found'
      });
    },
    default: function () {
      res.send('Path not found');
    }
  });
};

// Tool's upgrade email
exports.getUpgradeEmail = async function (req, res) {
  var options = {
    uri: `${process.env.UPGRADE_TOOL_URL}/api/upgradeCheck?q=toolName=CM-Portal`,
    json: true
  };
  try {
    var toolResponse = await requestPromise.get(options);
    res.send(toolResponse);
  } catch (requestErr) {
    // 200 = Error in this api should not impact the tool itself
    return res.status(200).send({
      message: `Upgrade Tool Request Error: ${requestErr.message}`
    });
  }
};

exports.getToolNotifications = async function (req, res) {
  var options = {
    uri: `${process.env.UPGRADE_TOOL_URL}/api/toolnotifications/CM-Portal`,
    json: true
  };

  try {
    var toolResponse = await requestPromise.get(options);
    res.send(toolResponse);
  } catch (requestErr) {
    // 200 = Error in this api should not impact the tool itself
    return res.status(200).send({
      message: `Upgrade tool request error: ${requestErr.message}`
    });
  }
};
