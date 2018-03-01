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
  const product = ctx.request.body;
  product.userId = ctx.state.user.userId;
  ctx.body = await ProductController.addProduct(product);
});

router.post('/:id/size', async ctx => {
  const productId = ctx.params.id;
  const size = ctx.request.body;
  ctx.body = await ProductController.setSize(productId, size.id, size.name);
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