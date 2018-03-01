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
  ctx.body = await ProductController.createProduct(product);
});

router.del('/:id', async ctx => {
  const productId = ctx.params.id;
  await ProductController.deleteProduct(productId);
  ctx.body = 'Successfully removed.';
});

module.exports = router;