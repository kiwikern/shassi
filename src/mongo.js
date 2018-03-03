const mongoose = require('mongoose');
const secrets = require('../secrets').mongo;

class Database {
  static async init() {
    const url = `mongodb://${secrets.username}:${secrets.password}@localhost:${secrets.port}/${secrets.database}`;
    return await mongoose.connect(url);
  };
}

module.exports = Database;
