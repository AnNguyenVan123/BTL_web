const admin = require("firebase-admin");

const { FieldValue } = require("firebase-admin/firestore");

admin.initializeApp();

const db = admin.firestore();

module.exports = { db, FieldValue, admin };
