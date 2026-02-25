/**
 * 版本管理路由
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth.middleware');
const versionController = require('../controllers/version.controller');

// 所有版本接口需要认证
router.use(authenticate);

// 获取版本历史
router.get('/:entityType/:entityId', versionController.getVersions);

// 获取版本详情
router.get('/detail/:id', versionController.getVersionById);

// 对比两个版本
router.get('/compare/:id1/:id2', versionController.compareVersions);

module.exports = router;
