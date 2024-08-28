var requestPromise = require('request-promise');
var requestPromiseRetry = require('promise-request-retry');
const { clone, cloneDeep } = require('lodash');
const logger = require('../../../../config/lib/logger');
var uri = (process.env.NODE_ENV === 'production') ? process.env.MIMER_URL : process.env.MIMER_URL_SANDBOX;

module.exports.getAuthRefresh = async function (userID, refreshToken) {
  if (process.env.ISTEST) return { access_token: 'ACCESSTOKEN', refresh_token: 'REFRESHTOKEN' };
  var options = {
    method: 'POST',
    uri: `${uri}/authn/api/v2/refresh-token`,
    verify: false,
    headers: {
      'Content-Type': 'application/json',
      'X-On-Behalf-Of': userID
    },
    body: {
      token: refreshToken
    },
    json: true,
    strictSSL: false,
    retry: 3,
    accepted: [200],
    delay: 5000
  };
  var response = requestPromiseRetry(options)
    .then(function (response) {
      return response.results[0].data;
    })
    .catch(function (getAuthRefreshError) {
      return getAuthRefreshError;
    });
  return response;
};

async function getUsersDetails(productNumber, accessToken, onBehalfOf, adminsOrUsers) {
  var response;
  try {
    response = await requestPromise.get({
      uri: `${uri}/api/v1/products/${productNumber}/${adminsOrUsers}`,
      verify: false,
      headers: {
        Authorization: accessToken,
        'X-On-Behalf-Of': onBehalfOf
      },
      json: true,
      strictSSL: false,
      resolveWithFullResponse: true
    });
    return response;
  } catch (getUsersDetailsError) {
    return getUsersDetailsError;
  }
}

module.exports.updateUsers = async function (productNumber, accessToken, accessControlGroups, signums, productsAction, onBehalfOf, adminsOrUsers) { // eslint-disable-line max-len
  var response,
    productGroups,
    productUsers;
  try {
    var usersDetails = await getUsersDetails(productNumber, accessToken, onBehalfOf, adminsOrUsers);
    if (usersDetails.error) return usersDetails;
    var etag = usersDetails.headers.etag;
    productGroups = usersDetails.body.results[0].data.accessControlGroups;
    var data = {
      $schema: 'https://arm.sero.gic.ericsson.se/artifactory/proj-mimer-mdm-release/schema/draft-07.json'
    };
    productUsers = usersDetails.body.results[0].data[adminsOrUsers];
    if (accessControlGroups) {
      productGroups = (productsAction === 'Add') ? productGroups.concat(accessControlGroups) : productGroups.filter((group) => !accessControlGroups.includes(group));
    }
    if (signums) {
      productUsers = (productsAction === 'Add') ? productUsers.concat(signums) : productUsers.filter((signum) => !signums.includes(signum));
    }
    data.accessControlGroups = productGroups;
    data[(adminsOrUsers === 'users' ? 'users' : 'admins')] = productUsers;

    response = await requestPromise.put({
      uri: `${uri}/api/v1/products/${productNumber}/${adminsOrUsers}`,
      verify: false,
      headers: {
        Authorization: accessToken,
        'X-On-Behalf-Of': onBehalfOf,
        'If-Match': etag
      },
      body: data,
      json: true,
      strictSSL: false
    });
    return response.results[0].messages;
  } catch (updateUsersError) {
    return updateUsersError;
  }
};

module.exports.verifyAccessGroups = async function (group, accessToken, onBehalfOf) {
  var response;
  try {
    response = await requestPromise.get({
      uri: `${uri}/api/v1/access-control-groups/read-only/${group}`,
      verify: false,
      headers: {
        Authorization: accessToken,
        'X-On-Behalf-Of': onBehalfOf
      },
      json: true,
      strictSSL: false
    });
    return response;
  } catch (verifyAccessGroupsError) {
    return verifyAccessGroupsError;
  }
};

module.exports.createProduct = async function (product, accessToken, onBehalfOf, adminsList, usersList, type) {
  var admins = cloneDeep(adminsList);
  var users = cloneDeep(usersList);
  delete product.adminsAccess;
  delete product.usersAccess;

  var options = {
    method: 'POST',
    uri: `${uri}/api/v1/products`,
    verify: false,
    headers: {
      Authorization: accessToken,
      'Content-Type': 'application/json',
      'X-On-Behalf-Of': onBehalfOf
    },
    body: product,
    json: true,
    strictSSL: false,
    retry: 2,
    accepted: [200],
    delay: 2000
  };
  var response = await requestPromiseRetry(options)
    .then(async function (response) {
      var productNumber = getProductNumberFromResponse(response.results[0].links.self.href);
      try {
        // Update Admins
        await exports.updateUsers(productNumber, accessToken, false, admins, 'Add', onBehalfOf, 'admins');
        // Update Users
        await exports.updateUsers(productNumber, accessToken, false, users, 'Add', onBehalfOf, 'users');
      } catch (updateUsersAfterCreationError) {
        logger.info(`Error while updating Admins/Users after creation: ${updateUsersAfterCreationError}`);
        throw new Error(updateUsersAfterCreationError);
      }
      var responseMessage = {
        message: `Success creating ${type} Product:${productNumber}.`, code: 'OK'
      };
      return responseMessage;
    })
    .catch(function (createProductError) {
      return createProductError;
    });
  return response;

  function getProductNumberFromResponse(string) {
    return string.split('/').pop();
  }
};

async function getProductDetails(productNumber, accessToken, onBehalfOf) {
  var response;
  if (process.env.ISTEST) {
    return {
      body: {
        results: [{
          schemaVersion: '12.0.0', productNumber: 'XYZ12345', productVersioningSchema: 'SemVer 2.0.0', designation: 'Test'
        }]
      },
      headers: {
        etag: 'test'
      }
    };
  }
  try {
    response = await requestPromise.get({
      uri: `${uri}/api/v1/products/${productNumber}`,
      verify: false,
      headers: {
        Authorization: accessToken,
        'X-On-Behalf-Of': onBehalfOf
      },
      json: true,
      strictSSL: false,
      resolveWithFullResponse: true
    });
    return response;
  } catch (getProductDetailsError) {
    return getProductDetailsError;
  }
}

module.exports.updateProduct = async function (productNumber, accessToken, onBehalfOf, designResponsible) { // eslint-disable-line max-len
  var response;
  try {
    var productDetails = await getProductDetails(productNumber, accessToken, onBehalfOf);
    if (productDetails.error) return productDetails;

    var productOriginalData = productDetails.body.results[0].data;
    var etag = productDetails.headers.etag;
    var data = {
      designResponsible: designResponsible,
      schemaVersion: productOriginalData.schemaVersion,
      productNumber: productOriginalData.productNumber,
      productVersioningSchema: productOriginalData.productVersioningSchema,
      designation: productOriginalData.designation
    };
    if (productOriginalData.description) data.description = productOriginalData.description;
    if (productOriginalData.designationAlias) data.designationAlias = productOriginalData.designationAlias;

    response = await requestPromise.put({
      uri: `${uri}/api/v1/products/${productNumber}`,
      verify: false,
      headers: {
        Authorization: accessToken,
        'Content-Type': 'application/json',
        'X-On-Behalf-Of': onBehalfOf,
        'If-Match': etag
      },
      body: data,
      json: true,
      strictSSL: false
    });
    return response.results[0].messages;
  } catch (updateProductError) {
    return updateProductError;
  }
};
