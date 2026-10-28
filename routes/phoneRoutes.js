const express = require('express');
const phoneController = require('../controllers/phoneController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', phoneController.index);
router.get('/cart', phoneController.cart);
router.post('/checkout', requireAuth, phoneController.checkout);
router.get('/admin/orders', requireAdmin, phoneController.adminOrders);
router.get('/phones/create', requireAdmin, phoneController.showCreate);
router.post('/phones', requireAdmin, phoneController.store);
router.get('/phones/:id', phoneController.show);
router.get('/phones/:id/edit', requireAdmin, phoneController.showEdit);
router.post('/phones/:id/edit', requireAdmin, phoneController.update);
router.get('/phones/:id/delete', requireAdmin, phoneController.showDelete);
router.post('/phones/:id/delete', requireAdmin, phoneController.destroy);

module.exports = router;
