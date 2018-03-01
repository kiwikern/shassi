const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const Router = require('koa-router');
const userRouter = require('./user/user.router');
const productRouter = require('./product/product.router');

class Server {
  static _getRouter() {
    const router = new Router();
    router.use('/user', userRouter.routes(), userRouter.allowedMethods());
    router.use('/product', productRouter.routes(), productRouter.allowedMethods());

    router.use(async (ctx, next) => {
      try {
        await next();
      } catch (err) {
        ctx.status = err.status || 500;
        ctx.body = err.message;
        ctx.app.emit('error', err, ctx);
      }
    });

    return router;
  }

  static async init() {
    const app = new Koa();
    const router = Server._getRouter();
    app
      .use(bodyParser())
      .use(router.routes())
      .use(router.allowedMethods())
      .listen(40000);
  }
}

module.exports = Server;