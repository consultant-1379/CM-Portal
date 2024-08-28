'use strict';

var nodeSchedule = require('node-schedule'),
  _ = require('lodash'),
  Token = require('../models/tokens.server.model').Schema,
  User = require('../../../users/server/models/user.server.model').Schema,
  logger = require('../../../../config/lib/logger'),
  commonController = require('../../../core/server/controllers/common.server.controller'),
  mimerHandler = require('../../../core/server/controllers/mimer.server.controller'),
  errorHandler = require('../../../core/server/controllers/errors.server.controller');

var dependentModelsDetails = [],
  sortOrder = 'name',
  schedule = '*/1 * * * *';

// check every minute if token exists
var scheduleJob = nodeSchedule.scheduleJob(schedule, async function () {
  var token = await Token.find({});
  if (token.length === 0) {
    logger.info('\n\nNo Token found in DB');
    return;
  }
  // update token according to schedule
  if (token[0].updateRate === schedule) {
    logger.info(`Schedule ${schedule} matches token Schedule ${token[0].updateRate}`);
    await exports.update(false, false);
  } else {
    // update the schedule to correct token update rate
    schedule = token[0].updateRate;
    logger.info(`Updated schedule: ${schedule}`);
    scheduleJob.reschedule(schedule);
  }
});

commonController = commonController(Token, dependentModelsDetails, sortOrder);

exports.read = commonController.read;
exports.list = commonController.list;
exports.findById = commonController.findById;
exports.delete = commonController.delete;

exports.create = async function (req, res) {
  try {
    var token = await Token.find({});
    if (token.length > 0) throw new Error('Only 1 Token allowed in DB.');

    var functionalUserId = req.body.name;
    var refreshToken = req.body.refreshToken;
    commonController.setLoggedInUser(req.user);
    var mimerResponse = await mimerHandler.getAuthRefresh(functionalUserId, refreshToken);
    if (mimerResponse.error) throw new Error(`${JSON.stringify(mimerResponse.error)}`);
    var updatedRefreshToken = mimerResponse.refresh_token;
    var accessToken = `Bearer ${mimerResponse.access_token}`;

    var validToken = {
      name: functionalUserId,
      refreshToken: updatedRefreshToken,
      accessToken: accessToken
    };
    token = new Token(validToken);

    // Update Schedule
    schedule = token.updateRate;
    scheduleJob.reschedule(schedule);
    // Update token with Next-Update-Time
    token.nextUpdateTime = scheduleJob.nextInvocation();
    await token.save();
    res.location(`/api/tokens/${token._id}`).status(201).json(token);
  } catch (err) {
    var statusCode = (err.name === 'ValidationError' || err.name === 'StrictModeError') ? 400 : 422;
    return res.status(statusCode).send({
      message: errorHandler.getErrorMessage(err)
    });
  }
};

// lock operations if token not present and or unsuccessful update
exports.mimerOperationsEnabled = async function (req, res) {
  var token = await Token.find({});
  var enabled = (token.length > 0) ? token[0].updateStatus : false;
  if (req) res.json(enabled);
  return enabled;
};

exports.update = async function (req, res) {
  try {
    if (req) {
      commonController.setLoggedInUser(req.user);
    } else {
      var adminUser = await User.findOne({ username: 'dttadm100' });
      commonController.setLoggedInUser(adminUser);
    }
    var token = await Token.find({});
    var tokenId = (req) ? req.body._id : token[0]._id;
    var tokenName = (req) ? req.body.name : token[0].name;
    var functionalUserId = (req) ? req.body.name : token[0].name;
    var refreshToken = (req) ? req.body.refreshToken : token[0].refreshToken;
    var mimerResponse = await mimerHandler.getAuthRefresh(functionalUserId, refreshToken);
    if (mimerResponse.error) {
      token = await Token.findByIdAndUpdate(
        tokenId,
        { updateStatus: false }
      );
      throw new Error(`${JSON.stringify(mimerResponse.error)}`);
    }
    var updatedRefreshToken = mimerResponse.refresh_token;
    var accessToken = `Bearer ${mimerResponse.access_token}`;
    var nextInvocation = scheduleJob.nextInvocation();
    var updatedToken = await Token.findByIdAndUpdate(
      tokenId,
      {
        name: tokenName,
        refreshToken: updatedRefreshToken,
        accessToken: accessToken,
        nextUpdateTime: nextInvocation,
        updateStatus: true
      }
    );
    updatedToken.save();
    if (req) return res.json(updatedToken);
  } catch (err) {
    logger.info(err);
    var statusCode = (err.name === 'ValidationError' || err.name === 'StrictModeError') ? 400 : 422;
    if (req) {
      return res.status(statusCode).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
  }
};

exports.changeUpdateRate = async function (req, res) {
  try {
    schedule = req.body.updateRate;
    scheduleJob.reschedule(schedule);
    var nextInvocation = scheduleJob.nextInvocation();
    var token = await Token.findByIdAndUpdate(
      req.body._id,
      {
        updateRate: req.body.updateRate,
        nextUpdateTime: nextInvocation
      }
    );
    res.json(token);
  } catch (err) {
    return res.status(422).send({
      message: errorHandler.getErrorMessage(err)
    });
  }
};
