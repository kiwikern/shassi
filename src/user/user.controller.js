const User = require('./user.model');

class UserController {

  static async createUser(user) {
    const newUser = new User(user);
    return await newUser.save();
  }

}

module.exports = UserController;