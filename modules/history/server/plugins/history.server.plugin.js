'use strict';

var getObjDifferences = require('deep-object-diff-mod').diff,
  History = require('../models/history.server.model'),
  logger = require('../../../../config/lib/logger');

module.exports = function (cmObject) {
  // Write a log on any object creation/update
  cmObject.pre('save', async function (next) {
    var collectionFileName = this.collection.name;
    var HistoryDbSchema = History.getSchema(collectionFileName);
    var historyDoc;
    if (this.name && this.name.toUpperCase().startsWith('A_HEALTH_')) {
      logger.info('no logging for Health-Check artifacts.. returning.');
      return next();
    }
    try {
      if (this.isNew) {
        historyDoc = createBaseHistoryDocument(initObject(this), this._id, false);
        await new HistoryDbSchema(historyDoc).save(next);
        return;
      }
      var MeanDbSchema;
      // eslint-disable-next-line max-len
      if (collectionFileName === 'configurationfiles') MeanDbSchema = require('../../../configuration_files/server/models/configuration_files.server.model').Schema; // eslint-disable-line global-require
      else {
        // eslint-disable-next-line global-require
        MeanDbSchema = require(`../../../${collectionFileName}/server/models/${collectionFileName}.server.model`).Schema;
      }
      var foundExistingObj = await MeanDbSchema.findById(this._id).exec();
      if (!foundExistingObj) {
        logger.info('no existing object found.. returning.');
        return next();
      }
      var originalObj = initObject(foundExistingObj);
      var updatedObj = initObject(this);
      var objDifferences = getObjDifferences(originalObj, updatedObj);
      if (!Object.keys(objDifferences).length) {
        logger.info('no differences exist.. returning.');
        return next();
      }
      var updateLog = {
        updatedAt: new Date(),
        updatedBy: History.getLoggedInUser(),
        updateData: objDifferences,
        updateReason: this[Symbol.for('updateReason')]
      };
      var foundExistingLog = await HistoryDbSchema.findOne({ associated_id: this._id }).exec();
      if (!foundExistingLog) {
        historyDoc = createBaseHistoryDocument(originalObj, this._id, true);
        historyDoc.updates = [updateLog];
        await new HistoryDbSchema(historyDoc).save(next);
        return;
      }
      foundExistingLog.updates = foundExistingLog.updates.concat(updateLog);
      if (objDifferences.name) foundExistingLog.currentName = objDifferences.name;
      foundExistingLog.save(next);
    } catch (errGenDiff) {
      logger.info(`Failed to generate object-difference for ${collectionFileName}: [${errGenDiff.name}] ${errGenDiff.message}`);
      next();
    }
  });

  // Write a log on any object removal
  cmObject.pre('remove', async function (next) {
    var collectionName = this.collection.name;
    var HistoryDbSchema = History.getSchema(collectionName);
    var historyDoc;
    if (this.name && this.name.toUpperCase().startsWith('A_HEALTH_')) {
      logger.info('no logging for Health-Check artifacts.. returning.');
      return next();
    }
    try {
      var foundLog = await HistoryDbSchema.findOne({ associated_id: this._id }).exec();
      if (!foundLog) {
        historyDoc = createBaseHistoryDocument(initObject(this), this._id, true);
        historyDoc.deletedAt = new Date();
        historyDoc.deletedBy = History.getLoggedInUser();
        await new HistoryDbSchema(historyDoc).save(next);
        return;
      }
      foundLog.set({ deletedAt: new Date(), deletedBy: History.getLoggedInUser() });
      foundLog.save(next);
    } catch (errRemoveLog) {
      logger.info(`Failed to create/update ${collectionName} log with deletion info: [${errRemoveLog.name}] ${errRemoveLog.message}`);
      next();
    }
  });

  // Generates an object history-log into the required template before it gets added to MongoDb.
  function createBaseHistoryDocument(originalObj, objectId, isLegacyObject) {
    var loggedInUser = History.getLoggedInUser();
    var historyDoc = {
      associated_id: objectId,
      originalData: originalObj,
      createdAt: (isLegacyObject) ? new Date(0) : new Date(),
      createdBy: (isLegacyObject && !loggedInUser) ? 'UNKNOWN USER' : loggedInUser,
      currentName: originalObj.name
    };
    return historyDoc;
  }

  function initObject(thisRef) {
    try {
      var obj = thisRef.toObject();
      delete obj._id;
      delete obj.__v;
      if (obj.content && obj.content.$schema) {
        obj.content.schema = obj.content.$schema;
        delete obj.content.$schema;
      }
      return obj;
    } catch (errInitObj) { throw errInitObj; }
  }
};
