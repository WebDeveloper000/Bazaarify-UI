var bitpay = require('bitpay-rest');
var fs = require('fs');
// need bitauth too
var bitauth = require('bitauth');
var privkey = bitauth.decrypt('', fs.readFileSync('/Users/vanya/.bitpay/api.key', 'utf8'));
// NOTE: necessary to decrypt your key even if you didn't enter a password when you generated it.
// If you did specify a password, pass it as the first param to bitauth.decrypt()
// var privkey = bitauth.decrypt('', privkey);
var client  = bitpay.createClient(privkey);

client.on('error', function(err) {
  // handle client errors here
  console.log(err);
});

//Client will take a second to automatically load your tokens, after which it will emit this ready event
//You must wait for the ready event before issuing requests
client.on('ready', function(){
  console.log('ready');
  var data = {
    notificationURL: 'https://us-central1-bazaarify-97162.cloudfunctions.net/bitcoinTranscationNotificationReceive',
    price: 10,
    currency: 'USD'
  };

  // NOTE: the .as('pos') is necessary for Point of Sale requests, use as('merchant') if you have a merchant token instead
  client.as('pos').post('invoices', data, function(err, invoice) {
    if (err){
      // more error handling
      console.log(err);
    }
    else{
      // success
      console.log('invoice data', invoice);
    }
  });
});
