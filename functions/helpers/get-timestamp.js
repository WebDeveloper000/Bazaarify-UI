const getTimestamp = function() {
  let timestamp = Math.round(new Date().getTime());
  return timestamp;
}

module.exports = getTimestamp;
