const NodeCache = require("node-cache");

const userCache = new NodeCache({
  stdTTL: 3600,
  checkperiod: 600,
  useClones: false,
  deleteOnExpire: true,
});

module.exports = { userCache };
