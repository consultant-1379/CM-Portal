module.exports.isValidSearch = function (query) {
  for (var key in query) {
    if (key !== 'fields' && key !== 'q') {
      return false;
    } else if (!query[key]) {
      return false;
    }
  }
  return true;
};

module.exports.asyncForEach = async function (array, callBack) {
  for (var i = 0; i < array.length; i += 1) {
    await callBack(array[i], i, array); //eslint-disable-line
  }
};
