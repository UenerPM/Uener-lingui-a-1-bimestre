const util = require('util');

function info(msg, meta) {
  if (meta) console.log(`[info] ${msg} -- ${util.inspect(meta, { depth: 2 })}`);
  else console.log(`[info] ${msg}`);
}

function error(msg, meta) {
  if (meta) console.error(`[error] ${msg} -- ${util.inspect(meta, { depth: 2 })}`);
  else console.error(`[error] ${msg}`);
}

function debug(msg, meta) {
  if (process.env.DEBUG) {
    if (meta) console.debug(`[debug] ${msg} -- ${util.inspect(meta, { depth: 2 })}`);
    else console.debug(`[debug] ${msg}`);
  }
}

module.exports = {
  info, error, debug
};
