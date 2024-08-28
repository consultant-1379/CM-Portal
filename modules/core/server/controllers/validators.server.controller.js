module.exports.objectNameValidator = {
  validator: function (name) {
    return /^[a-zA-Z0-9\-_.]*$/.test(name);
  },
  message: '{PATH} is not valid; \'{VALUE}\' can only contain letters, numbers, dots, dashes and underscores.'
};

module.exports.urlLinkValidator = {
  validator: function (link) {
    return /^$|^(https?:\/\/)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\\.[a-z0-9](?:[-0-9a-z]{0,61}[0-9a-z])?)*)(.*)$/.test(link);
  },
  message: '{PATH} is not valid; \'{VALUE}\' must be a valid url.'
};
