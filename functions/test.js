var express = require('express');
var app = express();

const functions = require('firebase-functions');
const Client = require('authy-client').Client;
const authy = new Client({key: "lLpZLHe2M0xXPKEulPx06r6pmgkW1eDa"});
const enums = require('authy-client').enums;
const cors = require('cors')({origin: true});

const fs = require('file-system');
const request = require('request');
const tempy = require('tempy');

const bodyParser = require('body-parser');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

const firebase = require("firebase");
const firebaseAdmin = require("firebase-admin");

// Admin app init
firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert(require("./config/firebase-admin-config.json")),
  databaseURL: "https://bazaarify-97162.firebaseio.com"
});
// Client app init
const firebaseApp = firebase.initializeApp(require("./config/firebase-client-config.json"));
const database = firebaseAdmin.database();


// Express configuration
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());


const nodemailer = require("nodemailer");
const sgTransport = require('nodemailer-sendgrid-transport');
// Create reusable transport method (opens pool of SMTP connections)
const options = {auth: {api_key: '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'}}
const mailer = nodemailer.createTransport(sgTransport(options));
const adminRecipient = ['vanyatsybulin@gmail.com'];

const dateTime = require('node-datetime');

function pushNotificatin(type) {
  var dt = dateTime.create();
  var formatted = dt.format('Y-m-dTH:M:S');

  var newPostRef = firebaseAdmin.database().ref(`/Stores/QmRRVG81bj6zdnA3LSYwSVUMw3TF9i28tvhJx4d8s5zW44/Notifications/`).push();
  var notificationKey = newPostRef.key;
  let payload = {};

  if (type == 'order'){
    payload = {
      "action" : "",
      "collection" : "",
      "data" : {
        "StoreID" : "",
        "notification" : {
          "buyerHandle" : "",
          "notificationId" : notificationKey,
          "slug" : "test",
          "title" : "Order type notification ",
          "type" : "order"
        },
        "read" : false,
        "timestamp" : formatted
      },
      "direction" : "obfb",
      "fbId": notificationKey,
      "storeId" : "QmRRVG81bj6zdnA3LSYwSVUMw3TF9i28tvhJx4d8s5zW44",
      "type" : "notification"
    };
  }

  if (type == 'notification') {
    payload = {
      "action" : "",
      "collection" : "",
      "data" : {
        "StoreID" : "",
        "notification" : {
          "buyerHandle" : "",
          "notificationId" : notificationKey,
          "slug" : "test",
          "title" : "Plain notification",
          "type" : "notification"
        },
        "read" : false,
        "timestamp" : formatted
      },
      "direction" : "obfb",
      "fbId": notificationKey,
      "storeId" : "QmRRVG81bj6zdnA3LSYwSVUMw3TF9i28tvhJx4d8s5zW44",
      "type" : "notification"
    };
  }

  if (type == 'payment') {
    payload = {
      "action" : "",
      "collection" : "",
      "data" : {
        "StoreID" : "",
        "notification" : {
          "buyerHandle" : "",
          "notificationId" : notificationKey,
          "slug" : "test",
          "title" : "Payment notification",
          "type" : "payment"
        },
        "read" : false,
        "timestamp" : formatted
      },
      "direction" : "obfb",
      "fbId": notificationKey,
      "storeId" : "QmRRVG81bj6zdnA3LSYwSVUMw3TF9i28tvhJx4d8s5zW44",
      "type" : "notification"
    };

  }


  firebaseAdmin.database()
    .ref(`/Stores/QmRRVG81bj6zdnA3LSYwSVUMw3TF9i28tvhJx4d8s5zW44/Notifications/${notificationKey}`)
    .set(payload)
}




// pushNotificatin('order');


// pushNotificatin('notification');
// pushNotificatin('payment');
// pushNotificatin('payment');
// pushNotificatin('payment');

// firebaseAdmin.database()
//   .ref(`/Users`)
//   .once('value')
//   .then(data => {
//     let users = data.val();
//     let fcmTokens = [];
//     Object.keys(users).map(key => {
//       let user = users[key];
//       if (user['Stores'] && user['Stores']['QmRRVG81bj6zdnA3LSYwSVUMw3TF9i28tvhJx4d8s5zW44'])
//         fcmTokens = user['fcmTokens']
//     });
//     return fcmTokens;
// }).then(fcmTokens => {
//   console.log(fcmTokens);
// }).catch(err => {
//   console.log(err);
// });


app.post('/mail', function(req, res) {
    let userData = {
      email: req.body.email,
      message: req.body.message,
      imagesList: req.body.imagesList
    };

    let mailBody = `
                  <h2>Subject - ${userData.subject}</h2>
                  <p>
                      Email: ${userData.email}
                  </p>
                  <p>
                      Message: ${userData.message}
                  </p>
    `;

    let mail = {
      to: adminRecipient,
      from: userData.email,
      subject: 'New feedback from Bazaarify',
      html: mailBody,
      attachments: []
    };

    if (userData.imagesList){
        userData.imagesList.map(attachment => {
          mail.attachments.push({
            filename: attachment.filename,
            path: attachment.path
          });
        })
    }

    mailer.sendMail(mail, function(error, response) {
      if (error) {
        res.status(500).send(error);
      }else{
        res.status(200).send();
      }
    });

});


function  isEmailVerified() {
  return firebaseApp.auth().currentUser.emailVerified;
}


app.post('/login', function(req, res) {
  cors(req, res, () => {
    let credentials = req.body;
    let userUid = null;

    let responseObj = {
      authToken: null,
      isTwoFactorEnabled: null,
      twoFactorSecret: null
    }

    firebaseApp.auth().signInWithEmailAndPassword(credentials.email, credentials.password)
      .then(() => {
        userUid = firebaseApp.auth().currentUser.uid;
        return firebaseAdmin.auth().createCustomToken(userUid);
      })
      .then(token => {
        responseObj.authToken = token;
      })
      .then(() => {
          /**
           * Check if user has verified email
           */
          if (! isEmailVerified()) {
            let err = new Error();
            err.code = "auth/email-not-verified";
            throw err;
          }

      })
      .then(() => {
        let userRef = database.ref("Users/" + userUid);
        return userRef.once("value");
      })
      .then(snapshot => {
        let userData = snapshot.val();
        responseObj.isTwoFactorEnabled = userData['twoFactorAuthEnabled'];
        responseObj.twoFactorSecret = userData['twoFactorSecret'];
      })
      .then(() => {
        return res.status(200).send(responseObj);
      })
      .catch(err => {
        return res.status(500).send(err.code);
      });

  });
});
//
// app.post('/generate-custom-token', function(req, res) {
//   cors(req, res, () => {
//     let uid = req.body.uid;
//
//       let responseObj = {
//         authToken: null,
//         isTwoFactorEnabled: null,
//         twoFactorSecret: null
//       }
//       firebaseAdmin.auth().createCustomToken(uid)
//       .then(token => {
//         responseObj.authToken = token;
//         return true;
//       })
//       .then(() => {
//         let userRef = database.ref("Users/" + uid);
//         return userRef.once("value");
//       })
//       .then(snapshot => {
//         let userData = snapshot.val();
//         if (userData) {
//           responseObj.isTwoFactorEnabled = userData['twoFactorAuthEnabled'];
//           responseObj.twoFactorSecret = userData['twoFactorSecret'];
//         }
//       })
//       .then(() => {
//         res.status(200).send(responseObj);
//       })
//       .catch(err => {
//         console.log(err);
//         res.status(500).send(err);
//     });
//   });
// });



app.listen(3006, function () {
  console.log('Example app listening on port 3006');
});



// Two factor tokens done for google authenticator
// app.post('/ask-for-secret', function(req, res) {
//   cors(req, res, () => {
//     let secret = speakeasy.generateSecret({
//       name: 'Bazaarify App'
//     });
//
//     let tempUserToken = secret.base32;
//
//     QRCode.toDataURL(secret.otpauth_url, function(err, data_url) {
//       if (err)
//         res.status(500).send(err);
//       res.status(200).send({ tempUserToken: tempUserToken, qrCodeData: data_url});
//     });
//   });
// });
//
// app.post('/verify-secret', function(req, res) {
//   cors(req, res, () => {
//     let data = req.body;
//     let verified = speakeasy.totp.verify(
//       {
//         secret: data.tempUserToken,
//         encoding: 'base32',
//         token: data.verificationToken
//       });
//     res.status(200).send({ verified });
//   });
// });
//
// app.listen(3000, function () {
//   console.log('Example app listening on port 3000!');
// });
//




// exports.askPhoneVerification = functions.https.onRequest((req, res) => {
//   cors(req, res, () => {
//   let data = req.body;
//     let config = {
//       countryCode: data.countryCode, // 'UA'
//       locale: 'en',
//       phone: data.phoneNumber, //'0934609452'
//       via: enums.verificationVia.SMS
//     }
//     authy.startPhoneVerification(config, function(err, data) {
//       if (err){
//         res.status(500).send(err);
//       }
//       res.status(200).send(data);
//     });
//   });
// });
//
// exports.checkPhoneVerification = functions.https.onRequest((req, res) => {
//   cors(req, res, () => {
//     let data = req.body;
//     let config = {
//       countryCode: data.countryCode,
//       phone: data.phoneNumber,
//       token: data.token
//     }
//     authy.verifyPhone(config, function(err, data) {
//       if (err){
//         res.status(500).send(err);
//       }
//       res.status(200).send(data);
//     });
//   });
// });


/**
 * Init fulltext search
 * @type {FullTextSearchLight}
 */
let fulltextsearchlight = require('full-text-search-light');
let search = new fulltextsearchlight();

let storesRef = firebaseAdmin.database().ref(`/Stores`);

// Add filter, this function will be called on every single field
// If you don't want to add a field to the search just return false
var addToIndexFilter = function (key, val) {
  // Return false if you want to ignore field
  if (key == 'Settings') {
    return true;   // Accept field
  }
  return false;    // Ignore field
};


storesRef.on("value", (snapshot, prevChildKey) => {
  search.drop();

let storeObj = snapshot.val();
Object.keys(storeObj).map(key => {
  if (storeObj[key] && storeObj[key]['Settings'] && storeObj[key]['Settings']['data']){
  let addToIndex = {
    'storeId': storeObj[key]['Settings']['storeId'],
    'title': storeObj[key]['Settings']['data']['name'] || ''
  }
  // console.log(addToIndex);
  search.add(addToIndex);
}
});
console.log('stores were added');
// Save current db
// search.saveSync('storesSearchIndex.json');
console.log('search index was saved');



var res = search.search('zon');
console.log('search result');
console.log(res);
});


