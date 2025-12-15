const functions = require("firebase-functions");

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
