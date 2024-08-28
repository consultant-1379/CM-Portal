
var _ = require('lodash'),
  ProductsUpdate = require('../models/products_update.server.model').Schema,
  Token = require('../../../tokens/server/models/tokens.server.model').Schema,
  logger = require('../../../../config/lib/logger'),
  commonController = require('../../../core/server/controllers/common.server.controller'),
  mimerHandler = require('../../../core/server/controllers/mimer.server.controller'),
  tokenHandler = require('../../../tokens/server/controllers/tokens.server.controller'),
  errorHandler = require('../../../core/server/controllers/errors.server.controller'),
  helperHandler = require('../../../core/server/controllers/helpers.server.controller'),
  usersHandler = require('../../../users/server/controllers/users.server.controller');

var dependentModelsDetails = [];
var sortOrder = 'name';

commonController = commonController(ProductsUpdate, dependentModelsDetails, sortOrder);

exports.read = commonController.read;
exports.list = commonController.list;
exports.findById = commonController.findById;
exports.delete = commonController.delete;

exports.create = async function (req, res) {
  /* eslint-disable no-await-in-loop */
  var productNumbersUpdated = [];
  var invalidProductNumbers = [];
  var productNumbersUpdatedForDesign = [];
  var invalidDesignProductNumbers = [];
  var invalidAccessGroups = [];
  var validAccessGroups = [];
  var validSignums = [];
  var invalidSignums = [];
  try {
    var checkToken = await tokenHandler.mimerOperationsEnabled(false, false);
    if (!checkToken) throw new Error('Mimer functionality currently disabled due to Mimer authentication issue.');
    await tokenHandler.update(false, false); // to update access token
    var token = await Token.find({});
    var accessToken = token[0].accessToken;
    commonController.setLoggedInUser(req.user);
    var productNumbers = req.body.productNumbers;
    var signums = req.body.signums;
    var designResponsible = req.body.designResponsible;
    var groups = req.body.accessControlGroups;
    // Verify Access Groups Names
    if (groups) {
      await helperHandler.asyncForEach(groups, async function (group) {
        var mimerResponse = await mimerHandler.verifyAccessGroups(group.trim(), accessToken, req.user.username);
        if (mimerResponse.error) {
          logger.info(`Mimer Error for Access Group ${group}`);
          logger.info(mimerResponse.error.results[0]);
          invalidAccessGroups.push(`${group}: ${mimerResponse.error.results[0].messages}`);
        } else {
          validAccessGroups.push(group);
        }
      });
    }
    // Verify Signums
    if (signums) {
      await helperHandler.asyncForEach(signums, async function (username) {
        var user = await usersHandler.findUser(username);
        if (user) {
          validSignums.push(username);
        } else { invalidSignums.push(username); }
      });
    }
    if (validAccessGroups.length === 0 && validSignums.length === 0 && !designResponsible) throw new Error('Enter Valid Data to Update Products!');

    if (validAccessGroups.length > 0 || validSignums.length > 0) {
      await helperHandler.asyncForEach(productNumbers, async function (productNumber) {
        var response = await mimerHandler.updateUsers(
          productNumber, accessToken, validAccessGroups, validSignums, req.body.productsAction,
          req.user.username, req.body.adminsOrUsers.toLowerCase()
        );
        if (response.error) {
          logger.info(`Mimer Update Error for Product Number ${productNumber}`);
          logger.info(response.error.results[0]);
          invalidProductNumbers.push(`${productNumber}: ${response.error.results[0].messages}`);
        } else {
          productNumbersUpdated.push(productNumber);
        }
      });
    }

    if (designResponsible) {
      await helperHandler.asyncForEach(productNumbers, async function (productNumber) {
        var productUpdateResponse = await mimerHandler.updateProduct(productNumber, accessToken, req.user.username, designResponsible);
        if (productUpdateResponse.error) {
          logger.info(`Mimer Update Error for Product Number ${productNumber}`);
          logger.info(productUpdateResponse.error.results[0]);
          invalidDesignProductNumbers.push(`${productNumber}: ${productUpdateResponse.error.results[0].messages}`);
        } else {
          productNumbersUpdatedForDesign.push(productNumber);
        }
      });
    }
    var productsUpdate = {
      name: new Date(),
      productNumbersUpdated: productNumbersUpdated,
      invalidProductNumbers: invalidProductNumbers,
      userTypeUpdated: req.body.adminsOrUsers,
      accessControlGroups: validAccessGroups,
      invalidAccessGroups: invalidAccessGroups,
      invalidSignums: invalidSignums,
      signums: validSignums,
      productsAction: req.body.productsAction,
      updatedBy: req.user.username,
      invalidDesignProductNumbers: invalidDesignProductNumbers,
      productNumbersUpdatedForDesign: productNumbersUpdatedForDesign,
      designResponsibleUpdated: designResponsible
    };
    productsUpdate = new ProductsUpdate(productsUpdate);
    await productsUpdate.save();
    res.location(`/api/productsUpdate/${productsUpdate._id}`).status(201).json(productsUpdate);
  } catch (err) {
    return res.status(422).send({
      message: errorHandler.getErrorMessage(err)
    });
  }
};
