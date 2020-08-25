import fetch from 'node-fetch';
import { permitInformation } from './settings.json';
import { sendNotification } from './gmailService';
import { AvailabilityResponse, Payload } from './types/index';

function buildFormattedDate(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const formattedMonth = month < 10 ? `0${month}` : month;
  const day = date.getDate();
  const formattedDay = day < 10 ? `0${day}` : day;

  return `${year}-${formattedMonth}-${formattedDay}`;
}

const startDate =
  permitInformation.optionalStartDate || buildFormattedDate(new Date());

const recreationUrl = `https://www.recreation.gov/api/permits/${permitInformation.locationId}/divisions/${permitInformation.routeId}/availability?start_date=${startDate}T00:00:00.000Z&end_date=${permitInformation.endDate}T00:00:00.000Z&commercial_acct=false`;

const datesNotified = {};

async function makeRequest(url: string): Promise<AvailabilityResponse> {
  try {
    const response = await fetch(url);
    const data = await response.json() as AvailabilityResponse;

    return data;
  } catch (e) {
    // potentially send notification and throw if this happens multiple times
    console.log('Error calling API:', e);
  }
}

function checkPassesAvailable(key: string, payload: Payload) {
  const permitsRemaining = payload.date_availability[key].remaining;
  const availableDate = new Date(key);
  const todayDate = new Date();
  const isWeekend = todayDate.getDay() === 0 || todayDate.getDay() === 6;
  const shouldNotify = permitInformation.onlyNotifyWeekends ? isWeekend : true;
  const formattedTodayDate = buildFormattedDate(todayDate);
  const hasBeenNotified =
    datesNotified[formattedTodayDate] &&
    datesNotified[formattedTodayDate].length
      ? datesNotified[formattedTodayDate].find((x: string) => x === key)
      : false;

  return (
    availableDate >= todayDate &&
    permitsRemaining > 0 &&
    !hasBeenNotified &&
    shouldNotify
  ) ? permitsRemaining : false;
}

async function requestAndParseData() {
  console.log('turtle.turtle');
  const { payload } = await makeRequest(recreationUrl);
  const dateKeys = Object.keys(payload.date_availability);
  let successMessage = '';
  dateKeys.forEach((key) => {
    const passesAvailable = checkPassesAvailable(key, payload);
    if (passesAvailable) {
      const formattedDate = buildFormattedDate(new Date(key));
      const formattedTodayDate = buildFormattedDate(new Date());
      successMessage += `\n ${passesAvailable} permits available on ${formattedDate}`;
      if (!datesNotified[formattedTodayDate]) {
        datesNotified[formattedTodayDate] = [];
      }
      datesNotified[formattedTodayDate].push(key);
    }
  });

  if (successMessage) {
    sendNotification(successMessage);
  }

  setTimeout(
    requestAndParseData,
    1000 * 60 * permitInformation.pingIntervalMinutes
  );
}

requestAndParseData();
