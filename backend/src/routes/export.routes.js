/**
 * 报表导出路由
 */

const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const exportController = require('../controllers/export.controller');

// 所有导出接口需要认证 + export:read 权限
router.use(authenticate);
router.use(authorize('export:read'));

// 导出项目报告
router.get('/project/:id', exportController.exportProjectReport);

// 导出物料报表
router.get('/materials', exportController.exportMaterialReport);

module.exports = router;
