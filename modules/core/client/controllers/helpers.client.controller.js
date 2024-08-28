var $ = require('jquery');
var moment = require('moment');

export async function asyncForEach(array, callBack) {
  for (var i = 0; i < array.length; i += 1) {
    await callBack(array[i], i, array); //eslint-disable-line
  }
}

export function floatingSaveButton() {
  var $formWindow = $(window),
    floatSaveButton = $('.float-save-button'),
    mainSaveButton = $('#main-save-button');

  if (!(mainSaveButton.offset().top > $formWindow.height())) {
    if (floatSaveButton.prop('disabled')) {
      floatSaveButton.removeClass('disable-save-button');
    }
    floatSaveButton.css({ display: 'none' });
  }

  $formWindow.resize(function () {
    checkMainSaveButtonLocation($formWindow, mainSaveButton, floatSaveButton);
  });

  $formWindow.scroll(function () {
    checkMainSaveButtonLocation($formWindow, mainSaveButton, floatSaveButton);
  });
}

function checkMainSaveButtonLocation($formWindow, mainSaveButton, floatSaveButton) {
  var topOfElement = mainSaveButton.offset().top;
  var bottomOfElement = mainSaveButton.offset().top + mainSaveButton.outerHeight();
  var bottomOfScreen = $formWindow.scrollTop() + $formWindow.innerHeight();
  var topOfScreen = $formWindow.scrollTop();

  if ((bottomOfScreen > topOfElement) && (topOfScreen < bottomOfElement)) {
    if (floatSaveButton.prop('disabled')) {
      floatSaveButton.removeClass('disable-save-button');
    }
    floatSaveButton.css({ display: 'none' });
  } else {
    if (floatSaveButton.prop('disabled')) {
      floatSaveButton.addClass('disable-save-button');
    }
    floatSaveButton.css({ display: 'block' });
  }
}

export function generateEmailElement(objectType, objectName, user) {
  if (typeof user === 'string' || user === undefined) {
    return 'UNKNOWN USER';
  }
  var emailSubject = `CM PORTAL Query on ${objectType}: ${objectName}`;
  var emailElement = `<a onclick="event.stopPropagation();" class"log-action-link" href="mailto:${user.email}?Subject=${emailSubject}">
                        <strong>&#9993;</strong>&nbsp;${user.displayName} (${user.username.toUpperCase()})
                      </a>`;
  return emailElement;
}

export function historyFormatDate(dateTimeString, pageType) {
  if (dateTimeString.startsWith('1970')) return 'UNKNOWN DATE';
  var dateToEuropeanFormatOptionsView = {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: false
  };
  var timeToEuropeanFormatOptionsList = {
    hour: 'numeric', minute: 'numeric', hour12: false
  };
  var dateObj = new Date(dateTimeString);
  if (pageType === 'view') {
    return `${dateObj.toLocaleString('en-GB', dateToEuropeanFormatOptionsView)} GMT`;
  }
  return `${moment(dateObj).format('YYYY-MM-DD')}, ${dateObj.toLocaleTimeString('en-GB', timeToEuropeanFormatOptionsList)}`;
}

export function validateProductNumber(productNumber) {
  // Check All Product numbers start with letter and end with numbers
  if (!(/^[A-Za-z]+[0-9]+$/.test(productNumber))) throw new Error('Product Numbers must start with letters and end with number e.g CXC1234567');
}

export function validateSignum(signum) {
  if (!(/^([a-zA-Z]){5,10}$/.test(signum))) throw new Error('All signums must be valid');
}

export function removeDuplicates(arrayLike) {
  return Array.from(new Set(arrayLike));
}

export function formatDate(oldDateString) {
  if (oldDateString.startsWith('1970')) return 'UNKNOWN DATE';
  var dateAndTime = new Date(oldDateString).toISOString().split('T');
  var time = dateAndTime[1].split(':');
  return `${dateAndTime[0]}, ${time[0]}:${time[1]}`;
}

export async function checkMimerStatus($http) {
  try {
    return $http({ method: 'GET', url: '/api/mimerOperationsEnabled' });
  } catch (mimerStatusError) { console.log(mimerStatusError); /* eslint-disable-line no-console */ }
}

export function userCompare(a, b) {
  // Use toUpperCase() to ignore character casing
  const aName = (a.displayName) ? a.displayName.toUpperCase() : a.name.toUpperCase();
  const bName = (b.displayName) ? b.displayName.toUpperCase() : b.name.toUpperCase();
  if (aName > bName) return 1;
  if (aName < bName) return -1;
  return 0;
}
