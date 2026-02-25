/**
 * 预警路由
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth.middleware');
const alertController = require('../controllers/alert.controller');

// 所有预警接口需要认证
router.use(authenticate);

// 获取预警列表
router.get('/', alertController.getAlerts);

// 获取未读预警数量
router.get('/unread-count', alertController.getUnreadCount);

// 标记全部已读
router.patch('/read-all', alertController.markAllAsRead);

// 标记单条已读
router.patch('/:id/read', alertController.markAsRead);

module.exports = router;
