const Database = require('./mongo');
const Server = require('./server');

async function init() {
  await Database.init();
  await Server.init();
}

init();