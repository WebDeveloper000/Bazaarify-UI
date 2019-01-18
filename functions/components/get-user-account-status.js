const datesDiff = require('../helpers/dates-diff');
const getTimestamp = require('../helpers/get-timestamp');
const firebaseAdmin = require('../common/firebase-admin');
const database = firebaseAdmin.database();
const globalOptionsNode = database.ref("SystemSettings/Global");
const moment = require('moment');
const shortid = require('shortid');


function setStoreAsPaused(userUid, storeId) {
  if (userUid && storeId) {
    database.ref(`Users/${userUid}/Stores/${storeId}`).update({'status': 'discontinued'});
  }
}

function getStoreData(storeId) {
  return new Promise((resolve, reject) => {
    database.ref(`Stores/${storeId}/Settings`).once('value').then(data => {
      resolve(data.val());
    });
  });
}


function grabBillingData(userUid) {
  return new Promise((resolve, reject) => {
      /**
       *  If no billing records yet exists under user profile - create one
       */
      return globalOptionsNode.once("value").then(snapshot => {
        let globalOptions = snapshot.val();
        let storePrice = globalOptions['UserEnrollments']['StorePrice'];
        let enrollmentPeriod = globalOptions['UserEnrollments']['EnrollmentPeriod'];
        let currentDate = getTimestamp();

        return database.ref(`Users/${userUid}/Stores`).once('value', snapshot => {
            let userStores = snapshot.val();

        let accountStatus = {
          balance: 0,
          billingItems: [],
          storesToPayFor: []
        };

        if (userStores && Object.keys(userStores).length) {
          Object.keys(userStores).map(key => {
            let storeId = key;
            let store = userStores[key];

          if (!store['recentPaymentDate'] ||
            (store['recentPaymentDate'] && (store['recentPaymentDate'] && datesDiff(store['recentPaymentDate'], currentDate) > enrollmentPeriod))) {
            accountStatus['balance'] += storePrice;
            accountStatus['storesToPayFor'].push(store['storeId']);
            accountStatus['billingItems'].push(store);
            /**
             * Mark store as setStoreAsPaused
             */
            setStoreAsPaused(userUid, storeId);
          }
        });
        }

        resolve(accountStatus);
      });
    });
  })
  .then(accountStatus => {
      return new Promise((resolve, reject) => {
        let accountStatusUpdated = accountStatus['billingItems'].map(store => {
            store['from'] = store['recentPaymentDate'] || store['subscribtionStartedDate'] || getTimestamp();
            store['to'] =  store['recentPaymentDate'] ? moment(store['recentPaymentDate']).add(1, 'M').format('x') : moment(store['subscribtionStartedDate']).add(1, 'M').format('x');
            return store;
        });
        accountStatus['billingItems'] = accountStatusUpdated;
        resolve(accountStatus);
      })
  })
  .then(accountStatus => {
      /**
       * Grab stores names
       */
      return new Promise((resolve, reject) => {
        /**
         * If there are discountinued stores, get current billing data
         */
        if (accountStatus.balance && accountStatus['billingItems'].length) {
          let storePromises = [];

          accountStatus['billingItems'].map(store => {
            let storeId = store['storeId'];
            storePromises.push(getStoreData(storeId));
          });

          Promise.all(storePromises).then(storesData => {
              let accountStatusUpdated = accountStatus['billingItems'].map(store => {
                  let storeId = store['storeId'];
                  let currentStoreData = storesData.filter(store => { return (store['storeId'] == storeId) });

                  store['name'] = (currentStoreData[0]['data'] && currentStoreData[0]['data']['name']) || 'Name not provided';
                  return store;
                });
                accountStatus['billingItems'] = accountStatusUpdated;

                resolve(accountStatus);
              });

        } else {
          resolve(accountStatus);
        }
      });

  })
}

function updateBilling(userUid, billingId) {
  console.log('UPDATE');
    return grabBillingData(userUid)
    .then(result => {
      console.log(result);
      result['billingId'] = billingId;
      return database.ref(`Users/${userUid}/Billings/CurrentBilling/${billingId}`).update(result);
    })
}

function getNewBilling(userUid) {
    return grabBillingData(userUid)
    .then(result => {
      let newbillingId = shortid.generate();
      result['billingId'] = newbillingId;
      return database.ref(`Users/${userUid}/Billings/CurrentBilling/${newbillingId}`).update(result);
    })
}

exports.handler = function(req, res){
  let userUid = req.body['userUid'];

  database.ref(`Users/${userUid}/Billings/CurrentBilling`).once('value', snapshot => {
    let billing = snapshot.val();
    let billingId = billing && Object.keys(billing)[0];
    /**
     *  If billin id exists update it if needed
     */
    if (billingId ) {
      updateBilling(userUid, billingId)
        .then(result => {
          res.status(200).send(result);
        })
        .catch(err => {
          console.log(err);
          res.status(500).send(err);
        });
    } else {
      getNewBilling(userUid)
        .then(result => {
        res.status(200).send(result);
        })
        .catch(err => {
          console.log(err);
          res.status(500).send(err);
        });
    }
  });
}

exports.functionsHandler = function(userUid) {

  database.ref(`Users/${userUid}/Billings/CurrentBilling`).once('value', snapshot => {

    let billing = snapshot.val();
    let billingId = billing && Object.keys(billing)[0];
    console.log('billingId');
    console.log(billingId);
    /**
     *  If billin id exists update it if needed
     */
    if (billing ) {
      updateBilling(userUid, billingId)
        .then(res => {

        })
        .catch(err => {
          console.log(err);
        })

    } else {
      getNewBilling(userUid)
        .then(res => {

        })
      .catch(err => {
          console.log(err);
      })
    }

  });

}
