const bitpayClient = require('../config/bitpay-configuration');

exports.handler = function(req, res) {
  function clientStatus(client) {
    return new Promise((resolve, reject) => {
        client.on('error', err => {
          reject(err);
        });
        client.on('ready', () => {
          console.log('Client ready');
          resolve();
        });
    })
  }
  return new Promise((resolve, reject) => {
      let client = bitpayClient;
      let ammount = req.body['ammount'];

      if (! ammount) {
        reject('No ammount param passed');
      }

      clientStatus(client)
      .then(data => {
        var data = {
          notificationURL: 'https://us-central1-bazaarify-97162.cloudfunctions.net/bitcoinTranscationNotificationReceive',
          price: ammount,
          currency: 'USD'
        };

        client.post('invoices', data, function(err, invoice) {
          if (err){
            reject(err);
          }
          else{
            resolve(invoice);
          }
        });
      })
      .catch(err => {
        reject(err);
      })
  });
}
