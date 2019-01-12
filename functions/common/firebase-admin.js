const firebaseAdmin = require("firebase-admin");
const firebaseAdminConfiguration = require("../config/firebase-admin-config.json");

// Admin app init
const admin = firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert(firebaseAdminConfiguration),
  databaseURL: "https://bazaarify-97162.firebaseio.com"
});

module.exports = firebaseAdmin;
