const firebaseAdmin = require('../common/firebase-admin');
const database = firebaseAdmin.database();
const getTimestamp = require('../helpers/get-timestamp');

exports.handler = function(paymentObj) {
  let paymentData = paymentObj;
  let userUid = paymentData['userUid'];
  let billingId = paymentData['billingId'];
  let paymentMethod = paymentData['paymentMethod'];
  let paymendData = paymentData['paymendData'];

  return new Promise((resolve, reject) => {

      database.ref(`Users/${userUid}/Billings/CurrentBilling/${billingId}`).once('value', snapshot => {
        let billingData = snapshot.val();
        let paymentDate = getTimestamp();

        database.ref(`Users/${userUid}/Billings/CurrentBilling/${billingId}`)
        .set(null)
        .then(() => {
            let billingRecord = {
              timestamp: paymentDate,
              billingId: billingId,
              billingData: billingData,
              paymentMethod: paymentMethod,
              paymentData: paymendData
            };

            billingData['billingItems'].map(item => {
                database.ref(`Users/${userUid}/Stores/${item['storeId']}`).update({'recentPaymentDate': paymentDate})
            });

            return billingRecord;
        })
        .then(billingRecord => {
          return database.ref(`Users/${userUid}/Billings/PastBillings/`).push(billingRecord);
        })
        .then(() => {
          let fbId = database.ref(`Users/${userUid}/Notifications`).push(null);

          return database.ref(`Users/${userUid}/Notifications/${fbId.key}`).set({
            fbId: fbId.key,
            data: {
              notification: {
                type: 'payment',
                title: `Billing ${billingId} was paid with ${paymentMethod}`,
              },
              timestamp: paymentDate,
              read: false
            }
          });
        })
        .then(() => {
          resolve();
        })
        .catch(err => {
          reject(err);
        })

      }, err => {
        reject(err);
      });

  });
}
