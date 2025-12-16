const functions = require("firebase-functions");
const express = require("express");
const cors = require("cors");
const { validateFirebaseIdToken } = require("./src/middleware/auth.middleware");

const app = express();
const route = require("./src/routes/index.route");

app.use(cors({ origin: true }));
app.use(validateFirebaseIdToken);

route(app);

const friendController = require("./src/controllers/friendController");

exports.sendFriendRequest = functions.https.onCall(
  friendController.sendFriendRequest
);

exports.acceptFriendRequest = functions.https.onCall(
  friendController.acceptFriendRequest
);

exports.rejectFriendRequest = functions.https.onCall(
  friendController.rejectFriendRequest
);

exports.blockUser = functions.https.onCall(friendController.blockUser);

exports.api = functions.https.onRequest(app);
