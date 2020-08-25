import fs from 'fs';
import readline from 'readline';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

import { email } from './settings.json';
import { Credentials } from './types/index';

const gmail = google.gmail('v1');

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
];
const TOKEN_PATH = '../token.json';

export const authenticate = (): void =>
  fs.readFile('../credentials.json', 'utf8', (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);
    authorize(JSON.parse(content), listLabels);
  });

export const sendNotification = (message: string): void =>
  fs.readFile('../credentials.json', 'utf8', (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);
    authorize(JSON.parse(content), (auth: OAuth2Client) =>
      sendEmail(auth, message)
    );
  });

function authorize(credentials: Credentials, callback) {
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  fs.readFile(TOKEN_PATH, 'utf8', (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

function getNewToken(oAuth2Client: OAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

function listLabels(auth: OAuth2Client) {
  const gmail = google.gmail({ version: 'v1', auth });
  gmail.users.labels.list(
    {
      userId: 'me',
    },
    (err, res) => {
      if (err) return console.log('The API returned an error: ' + err);
      const labels = res.data.labels;
      if (labels.length) {
        console.log('Labels:');
        labels.forEach((label) => {
          console.log(`- ${label.name}`);
        });
      } else {
        console.log('No labels found.');
      }
    }
  );
}

function buildEmail(
  to: string,
  from: string,
  subject: string,
  message: string
) {
  const emailString = [
    'Content-Type: text/plain; charset="UTF-8"\n',
    'MIME-Version: 1.0\n',
    'Content-Transfer-Encoding: 7bit\n',
    'to: ',
    to,
    '\n',
    'from: ',
    from,
    '\n',
    'subject: ',
    subject,
    '\n\n',
    message,
  ].join('');

  return Buffer.from(emailString)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function sendEmail(auth: OAuth2Client, message: string) {
  const rawEmail = buildEmail(
    email.to,
    email.from,
    email.subject,
    `${email.body} ${message}`
  );

  gmail.users.messages.send(
    {
      auth: auth,
      userId: 'me',
      requestBody: {
        raw: rawEmail,
      },
    },
    (err: Error | null) => {
      if (err) {
        console.log(`error: ${err}`);
      } else {
        console.log('Email sent');
      }
    }
  );
}