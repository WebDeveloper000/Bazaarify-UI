const bitpay = require('bitpay-serverless');
const bitauth = require('bitauth')

const pass = '';
const key = 'hhEGZkSukigt4yx1TD2hMwaqeoZoMkpCFJywwNKauHJesewhMoJjBfg44XVFPKyySVGB2BoeQcBgqiWntS2mXkspEFmr3DQSKpE4XHXVL2E7x';
const privkey = bitauth.decrypt(pass, key)
const client = bitpay.createClient(privkey, {
  config: {
    apiHost: 'test.bitpay.com', // if testing, pass `test.bitpay.com` here instead
    apiPort: 443
  }
});

module.exports = client;
