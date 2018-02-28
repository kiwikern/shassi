const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const Router = require('koa-router');
const userRouter = require('./user/user.router');

class Server {
  static _getRouter() {
    const router = new Router();
    router.use('/user', userRouter.routes(), userRouter.allowedMethods());
    return router;
  }

  static async init() {
    const app = new Koa();
    const router = Server._getRouter();
    app
      .use(bodyParser())
      .use(router.routes())
      .use(router.allowedMethods())
      .listen(3000);
  }
}

module.exports = Server;