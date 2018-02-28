const Router = require('koa-router');
const router = new Router();
const UserController = require('./user.controller');

router.post('/', async ctx => {
  user = ctx.request.body;
  ctx.body = await UserController.createUser({username: user.username, password: user.password});
});

module.exports = router;