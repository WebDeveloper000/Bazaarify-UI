const QRCode = require('qrcode');

exports.generate = function(req, res) {
  let data = req.body['data'];
  console.log(data);

  QRCode.toDataURL(data, function(err, qrcodeData) {
    if (err) {
      console.log(err);
      res.status(500).send(err);
    }
    res.status(200).send({qrcodeData: qrcodeData});
  });

}

