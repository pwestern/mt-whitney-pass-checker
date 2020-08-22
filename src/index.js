const fetch = require('node-fetch');
const { permitInformation } = require('../settings.json');
const { sendNotification } = require('./gmailService');

function buildStartDate() {
  const year = new Date().getFullYear();
  const month = new Date().getMonth() + 1;
  const formattedMonth = month < 10 ? `0${month}` : month;
  const day = new Date().getDate();
  const formattedDay = day < 10 ? `0${day}` : day;

  return `${year}-${formattedMonth}-${formattedDay}`;
}

const startDate = permitInformation.startDateOverride || buildStartDate();

const recreationUrl = `https://www.recreation.gov/api/permits/${permitInformation.locationId}/divisions/${permitInformation.routeId}/availability?start_date=${startDate}T00:00:00.000Z&end_date=${permitInformation.endDate}T00:00:00.000Z&commercial_acct=false`;

const datesNotified = [];

async function makeRequest(url) {
  try {
    const response = await fetch(url);
    const data = await response.json();

    return data;
  } catch (e) {
    // potentially send notification and throw if this happens multiple times
    console.log('Error calling API:', e);
  }
}

async function requestAndParseData() {
  console.log('turtle.turtle');
  const { payload } = await makeRequest(recreationUrl);
  const dateKeys = Object.keys(payload.date_availability);
  dateKeys.forEach((key) => {
    const permitsRemaining = payload.date_availability[key].remaining;
    const availableDate = new Date(key);
    const todayDate = new Date();
    const isWeekend = todayDate.getDay() === 0 || todayDate.getDay() === 6;
    const shouldNotify = permitInformation.onlyNotifyWeekends
      ? isWeekend
      : true;
    const hasBeenNotified = datesNotified.find((x) => x === key);
    console.log(key);
    if (
      availableDate >= todayDate &&
      permitsRemaining > 0 &&
      !hasBeenNotified &&
      shouldNotify
    ) {
      const successMessage = `${permitsRemaining} permits available on ${key}`;
      sendNotification(successMessage);
      datesNotified.push(key);
    }
  });

  setTimeout(
    requestAndParseData,
    1000 * 60 * permitInformation.pingIntervalMinutes
  );
}

requestAndParseData();
