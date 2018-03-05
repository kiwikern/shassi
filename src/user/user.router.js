const Router = require('koa-router');
const router = new Router();
const UserController = require('./user.controller');
const Authenticator = require('../user/authenticator');

router.post('/', async ctx => {
  const user = ctx.request.body;
  ctx.body = await UserController.createUser(user.username, user.password);
});

router.post('/login', async ctx => {
  const user = ctx.request.body;
  ctx.body = await UserController.login(user.username, user.password);
});

router.get('/telegram', Authenticator.getAuthMiddleware(), async ctx => {
  const userId = ctx.state.user.userId;
  ctx.body = await UserController.getTelegramAuthToken(userId);
});

module.exports = router;