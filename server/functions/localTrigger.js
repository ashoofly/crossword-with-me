const admin = require("firebase-admin");
const {PubSub} = require("@google-cloud/pubsub");

if (!admin.apps.length) {
  admin.initializeApp();
}

const pubsub = new PubSub({
  apiEndpoint: "localhost:8085",
  projectId: "crossword-with-friends",
});

const SCHEDULED_FUNCTION_TOPIC = "firebase-schedule-fetchNewPuzzle";
console.log(`Trigger scheduled function via PubSub topic: ${SCHEDULED_FUNCTION_TOPIC}`);
pubsub.topic(SCHEDULED_FUNCTION_TOPIC).publishMessage({
  attributes: {trigger: "now"}});
