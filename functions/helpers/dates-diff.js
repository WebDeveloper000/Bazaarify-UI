const moment = require('moment');

const datesDiff  = function(startDate, endDate) {
  let start = moment(startDate);
  let end = moment(endDate);
  return  end.diff(start, 'days');
}

module.exports = datesDiff;
