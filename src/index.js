const Database = require('./mongo');
const Server = require('./server');
const log = require('./logger').getLogger('Index');

async function init() {
  try {
    await Database.init();
    await Server.init();
  } catch (err) {
    log.error('init failed', err)
  }
}

init();