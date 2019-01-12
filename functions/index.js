const functions = require('firebase-functions');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const cors = require('cors')({origin: true});
const nodemailer = require("nodemailer");
const sgTransport = require('nodemailer-sendgrid-transport');
const firebase = require("firebase");

const getTimestamp = require('./helpers/get-timestamp');
const firebaseAdmin = require('./common/firebase-admin');

// Client app init
const firebaseApp = firebase.initializeApp(require("./config/firebase-client-config.json"));
const database = firebaseAdmin.database();

// Bazaarify global options
const globalOptionsNode = database.ref("SystemSettings/Global");
// Create reusable transport method (opens pool of SMTP connections)
let options = null;
let mailer = null;
let adminRecipient = null;
let globalOptions = null;

globalOptionsNode.on("value", function(snapshot) {
  globalOptions = snapshot.val();

  options = {auth: {api_key: globalOptions['Mailing']['SMTP_API_KEY']}};
  mailer = nodemailer.createTransport(sgTransport(options));
  let adminRecipientObject = globalOptions['Mailing']['AdminEmails'];
  adminRecipient = Object.keys(adminRecipientObject).map(key => adminRecipientObject[key]);

}, function (errorObject) {
  console.log("The read failed: " + errorObject.code);
});



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
      search.add(addToIndex);
    }
  });
});

exports.searchStoreBySearchTerm = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    let searchTerm = req.body.searchTerm;

  // let search_loaded = fulltextsearchlight.loadSync('storesSearchIndex.json');
    let results = search.search(searchTerm);
    res.status(200).send({ results });
  });
});


exports.fcmSend = functions.database.ref('/Stores/{storeId}/Notifications/{messageId}').onCreate(event => {
      const message = event.data.val()
      const storeId  = event.params.storeId;
      const payload = {
        notification: {
          title: "New Notification at Bazaarify",
          body: "Notification message" ,
          icon: "https://bazaarify.me/assets/img/logo-fcm.svg"
        }
      };


firebaseAdmin.database()
  .ref(`/Users`)
  .once('value')
  .then(data => {
      let users = data.val();
      let fcmTokens = [];

      Object.keys(users).map(key => {
        let user = users[key];
        if (user['Stores'] && user['Stores'][storeId])
          fcmTokens = user['fcmTokens']
      });
      return fcmTokens;
  })
  .then(userFcmToken => {
    return firebaseAdmin.messaging().sendToDevice(Object.keys(userFcmToken), payload)
  })
  .then(res => {
    console.log("Sent Successfully", res);
  })
  .catch(err => {
    console.log(err);
  });
});



exports.sendCorrespondence = functions.database.ref('/Users/{userId}/UserCorrespondence/{correspondenceId}').onCreate(event => {
    return new Promise((resolve, reject) => {
      const mailData = event.data.val()
      const userId  = event.params.userId

        let userData = {
          email: mailData.email,
          message: mailData.message,
          subject: mailData.subject,
          imagesList: mailData.attachments
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
          subject: userData.subject,
          html: mailBody,
          attachments: []
        };

        if (userData.imagesList){
          userData.imagesList.map(attachment => {
            mail.attachments.push({
            filename: attachment.filename,
            path: attachment.path
          });
        });
        }

        mailer.sendMail(mail, function(error, response) {
          if (error) {
            reject();
          }
          resolve();

        });
});
});


exports.userCreated = functions.auth.user().onCreate(event => {
    let request = firebaseAdmin.auth().getUser(event.data.uid)
      .then(function(user) {
        let email;

        for (var provider of user.providerData) {
          if (provider.email) {
            email = provider.email;
          }
        }
        firebaseAdmin.database().ref('Users/' + user.uid).set({
          email: email,
        });
      })
      .catch(function(error) {
        console.error("Error Fetching User: ", error);
      });
  return request;
});

exports.login = functions.https.onRequest((req, res) => {
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
        if (! firebaseApp.auth().currentUser.emailVerified) {
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
      console.log(err);
        return res.status(500).send(err.code);
    });

    });
});



exports.changeUserPasswordByUid = functions.https.onRequest((req, res) => {
  cors(req, res, () => {

    let credentials = req.body;
    firebaseAdmin.auth().updateUser(credentials.uid, {
      password: credentials.newPassword
    }).then(data => {
      return res.status(200).send(data);
    }).catch(err => {
      return res.status(500).send(err.code);
    });

  });
});



exports.steemShare = functions.https.onRequest((req, res) => {
    res.status(200).sendFile("./steemit-share.html", {root: __dirname });
});


/**
 * Get firebase custom token for user reauth based on user uid
 */
exports.getCustomTokenByUId = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    let uid = req.body.uid;

    let responseObj = {
      authToken: null,
      isTwoFactorEnabled: null,
      twoFactorSecret: null
    }
    firebaseAdmin.auth().createCustomToken(uid)
      .then(token => {
      responseObj.authToken = token;
      return true;
    })
    .then(() => {
        let userRef = database.ref("Users/" + uid);
      return userRef.once("value");
    })
    .then(snapshot => {
        let userData = snapshot.val();
      if (userData) {
        responseObj.isTwoFactorEnabled = userData['twoFactorAuthEnabled'];
        responseObj.twoFactorSecret = userData['twoFactorSecret'];
      }
    })
    .then(() => {
        res.status(200).send(responseObj);
    })
    .catch(err => {
        console.log(err);
      res.status(500).send(err);
    });
  });
});

exports.askTwoFactorToken = functions.https.onRequest((req, res) => {
  globalOptionsNode.on("value", function(snapshot) {
    let globalOptions = snapshot.val();
    let appName = globalOptions['Security']['2F']['AppName'];
    cors(req, res, () => {
      let secret = speakeasy.generateSecret({
        name: appName
      });
      let tempUserToken = secret.base32;
      QRCode.toDataURL(secret.otpauth_url, function(err, data_url) {
        if (err)
          res.status(500).send(err);
        res.status(200).send({ tempUserToken: tempUserToken, qrCodeData: data_url});
      });
    });
  });
});

exports.verifyTwoFactorToken = functions.https.onRequest((req, res) => {
  globalOptionsNode.on("value", function(snapshot) {
    let globalOptions = snapshot.val();
    let secretEncoding = globalOptions['Security']['2F']['SecretEncoding'];
      cors(req, res, () => {
        let data = req.body;
      let verified = speakeasy.totp.verify(
        {
          secret: data.tempUserToken,
          encoding: secretEncoding,
          token: data.verificationToken
        });
      res.status(200).send({ verified });
    });
  });
});



exports.getServerTimestamp = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    let timestamp = getTimestamp();
    res.status(200).send({ timestamp });
  });
});



/**
 * Record user transactions
 */
const recordTransactionComponent = require('./components/record-transaction.js');
exports.recordTransaction = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    let paymentObj = req.body;
    recordTransactionComponent.handler(paymentObj)
      .then(data => {
      res.status(200).send(data);
  }).catch(err => {
      console.log(err);
      res.status(500).send(err);
  });
  });
});



exports.bitcoinTranscationNotificationReceive = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    let transactionData = req.body;
    let transactionId = transactionData['id'];
    console.log('transactionData');
    console.log(transactionData);
    if (transactionData['status'] === 'paid') {

      database.ref("AwaitingBipayConfirmation/" + transactionId).once('value', snapshot => {
        let data = snapshot.val();
        console.log(data);

        if (data) {
          let userUId = data['userUid'];
          let billingId = data['billingId'];
          let paymentType = data['paymentMethod'];

          database.ref("Users/" + userUId + "/CurrentBilling/" + billingId).update({
            'bitcoinTransactionConfirmed': null,
            'cryptoPayment': null
          });

          let paymentObj = {
            userUid: userUId,
            billingId: billingId,
            paymentMethod: paymentType,
            paymendData: transactionData
          }

          recordTransactionComponent
            .handler(paymentObj)
            .then(data => {
                res.status(200).send(data);
            }).catch(err => {
                res.status(500).send(err);
            });

        }

        database.ref("AwaitingBipayConfirmation/" + transactionId).set(null);
      });

    }

    res.status(200).send();
  });
});


const getUserAccountStatusComponent = require('./components/get-user-account-status.js');
exports.getUserAccountStatus = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    getUserAccountStatusComponent.handler(req, res);
  });
});
/**
 * Should recalculate user acount status on every change to User/Stores node
 */
exports.getUserAccountStatusOnStoreCreate = functions.database.ref('/Users/{userId}/Stores/{storeId}').onCreate(event => {
    getUserAccountStatusComponent.functionsHandler(event.params.userId);
});
exports.getUserAccountStatusOnStoreDelete = functions.database.ref('/Users/{userId}/Stores/{storeId}').onDelete(event => {
    getUserAccountStatusComponent.functionsHandler(event.params.userId);
});



/**
 * BitPay
 */
const generateBitPayInvoiceComponent = require('./components/bitpay.js');
exports.generateBitPayInvoice = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
  generateBitPayInvoiceComponent.handler(req, res)
      .then(invoice => {
        res.status(200).send(invoice);
      })
      .catch(err => {
        console.log(err);
        res.status(500).send(err);
      });
  });
});

/**
 * QRCode generate on requrest
 */
const QRCodeComponent = require('./components/qrcode.js');
exports.generateQRCode = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    QRCodeComponent.generate(req, res);
  });
});
