'use strict';

var helperHandler = require('../../../core/server/controllers/helpers.server.controller');
var mimerController = require('../../../core/server/controllers/mimer.server.controller');
var tokenHandler = require('../../../tokens/server/controllers/tokens.server.controller');
var usersHandler = require('../../../users/server/controllers/users.server.controller');
var Token = require('../../../tokens/server/models/tokens.server.model.js').Schema;

exports.create = async function (req, res) {
  var finalResponse = [];
  try {
    finalResponse = [];
    var errorDetected = false;
    var product = req.body;
    product.schemaVersion = '15.1.2'; // has to be hardcoded for now
    var requiredProductTypes = getRequiredProductTypes(req.body.jobType);
    delete product.jobType;
    delete product.signumResponsible;
    var productDesignation = product.designation;

    // get access token
    await tokenHandler.update(false, false);
    var tokenFound = await Token.find({});
    var accessToken = tokenFound[0].accessToken;
    var onBehalfOf = tokenFound[0].name;
    var validAdminsList = [];
    var validUsersList = [];
    var invalidSignums = [];
    // Verify Signums
    if (product.adminsAccess && product.adminsAccess.length !== 0) {
      await helperHandler.asyncForEach(product.adminsAccess, async function (username) {
        var validAdmin = await usersHandler.findUser(username);
        if (validAdmin) {
          validAdminsList.push(username);
        } else {
          invalidSignums.push(username);
        }
      });
    }
    if (product.usersAccess && product.usersAccess.length !== 0) {
      await helperHandler.asyncForEach(product.usersAccess, async function (username) {
        var validUser = await usersHandler.findUser(username);
        if (validUser) {
          validUsersList.push(username);
        } else {
          invalidSignums.push(username);
        }
      });
    }
    validAdminsList.push(req.user.username);
    if (invalidSignums.length > 0) finalResponse.push(`User(s) { ${invalidSignums} } don't exist!\n`);

    await helperHandler.asyncForEach(requiredProductTypes, async function (type) {
      var productTypeAndNumber = type.split('-');
      var productType = productTypeAndNumber[0];
      product.productNumber = productTypeAndNumber[1];
      product.designation = `${productDesignation}-${productTypeAndNumber[0]}`;
      try {
        // create post call
        var response = await mimerController.createProduct(product, accessToken, onBehalfOf, validAdminsList, validUsersList, productType);
        if (response && response.code !== 'OK') {
          finalResponse.push(handleMimerCreateError(response.error.results[0], productType));
          errorDetected = true;
        }
        if (response && response.code === 'OK') finalResponse.push(response.message);
      } catch (mimerError) {
        errorDetected = true;
        finalResponse.push(`Error creating ${productType}: ${mimerError}\n`);
      }
    });
    if (errorDetected) throw new Error(finalResponse);
    // If success send back list of Required Products created
    return res.status(201).send({ message: finalResponse });
  } catch (err) {
    finalResponse.push(`Error: ${err}`);
    return res.status(422).send({
      message: finalResponse
    });
  }

  function getRequiredProductTypes(productTypes) {
    var types = productTypes.substring(
      productTypes.indexOf('(') + 1,
      productTypes.lastIndexOf(')')
    );
    types = types.replace(/\s/g, '');
    return types.split(',');
  }

  function handleMimerCreateError(error, type) {
    var messageString = error.messages[0];
    return `Error creating ${type}:||code: ${error.code}||operation: ${error.operation}||messages: ${messageString}`;
  }
};
