# Mt Whitney Checker

## Requirements

- NodeJS
- Gmail

## Initial Setup
1. Download NodeJS and install from https://nodejs.org/en/
2. Open the Terminal
    i. Run `node -v` to check NodeJS is installed
    ii. Run `npm -v` to check NodeJS is installed
3. Open browser and log into Gmail account you wish to send from
    i. Navigate to https://developers.google.com/gmail/api/quickstart/nodejs 
    ii. Click `Enable the Gmail API` button
    iii. Enter project name eg. "Mt Whitney Checker"
    iv. Select `Desktop App` as OAuth client
    v. Download your client configuration (should download as `credentials.json`)
    vi. Copy this file to project root directory
4. Open terminal and navigate to project directory
5. Run `npm install` to install required packages
6. Configure `settings.json` to preference
7. Navigate to `src` directory within project
8. Run `node authenticate.js` and follow guide (open link (browser may give untrusted warning), confirm permissions, copy and paste auth token back into terminal)
9. Run `node index.js` to start app