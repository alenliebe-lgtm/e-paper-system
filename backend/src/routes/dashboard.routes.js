/**
 * 管理者驾驶舱路由
 */

const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const dashboardController = require('../controllers/dashboard.controller');

// 所有驾驶舱接口需要认证 + dashboard:read 权限
router.use(authenticate);
router.use(authorize('dashboard:read'));

// 驾驶舱汇总数据
router.get('/cockpit', dashboardController.getCockpitData);

// 项目状态分布
router.get('/project-distribution', dashboardController.getProjectDistribution);

// 预算 vs 成本对比
router.get('/budget-vs-cost', dashboardController.getBudgetVsCost);

// 工作流月度趋势
router.get('/workflow-trend', dashboardController.getWorkflowTrend);

module.exports = router;
