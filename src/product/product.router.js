const Router = require('koa-router');
const router = new Router();
const ProductController = require('./product.controller');
const Authenticator = require('../user/authenticator');

router.use(Authenticator.getAuthMiddleware());

router.get('/', async ctx => {
  const userId = ctx.state.user.userId;
  ctx.body = await ProductController.getAllProductsForUser(userId);
});

router.post('/', async ctx => {
  const {url} = ctx.request.body;
  const userId = ctx.state.user.userId;
  ctx.body = await ProductController.addProduct(url, userId);
});

router.post('/:id', async ctx => {
  const productId = ctx.params.id;
  const size = ctx.request.body.size;
  const name = ctx.request.body.name;
  ctx.body = await ProductController.update(productId, size.id, size.name, name);
});

router.get('/:id/update', async ctx => {
  const productId = ctx.params.id;
  ctx.body = await ProductController.createUpdate(productId);
});

router.del('/:id', async ctx => {
  const productId = ctx.params.id;
  await ProductController.deleteProduct(productId);
  ctx.body = 'Successfully removed.';
});

ProductController.startCronJob();

module.exports = router;