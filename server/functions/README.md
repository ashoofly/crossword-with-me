
# Local Development
## Test functions locally with emulator

1. Start emulators:
    ```
    npm run serve
    ```
    or
    ```
    firebase emulators:start
    ```

2. Send mock PubSub message:
    ```
    node localTrigger.js
    ```
3. Go to UI and view DB emulator


# Deploy & Test
## Deploy
```
npm run deploy
```
or
```
firebase deploy --only functions
```
## See new version uploaded
https://console.cloud.google.com/functions/details/us-central1/fetchNewPuzzle?project=crossword-with-friends&tab=source

Wait for function deployment to complete.. takes awhile..

## Force Function to Run via Cloud Scheduler
https://console.cloud.google.com/cloudscheduler - select 'Force a job run'

## View logs for Cloud Function
https://console.cloud.google.com/functions/details/us-central1/fetchNewPuzzle?project=crossword-with-friends&tab=log

# Note
Firebase Cloud Functions requires [CommonJS modules](https://firebase.google.com/docs/functions/handle-dependencies), so this directory uses CommonJS while the rest of the code uses ES6 import syntax. 