const Router = require('koa-router');
const router = new Router();
const UserController = require('./user.controller');

router.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    ctx.status = err.status || 500;
    ctx.body = err.message;
    ctx.app.emit('error', err, ctx);
  }
});

router.post('/', async ctx => {
  user = ctx.request.body;
  ctx.body = await UserController.createUser(user.username, user.password);
});

router.post('/login', async ctx => {
  user = ctx.request.body;
  ctx.body = await UserController.login(user.username, user.password);
});

module.exports = router;