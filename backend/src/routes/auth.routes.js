/**
 * 认证路由
 * 定义认证相关的 API 端点
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authValidation } = require('../middlewares/validation.middleware');

// 公开接口（无需认证）

/**
 * @route   POST /api/auth/register
 * @desc    用户注册
 * @access  Public
 */
router.post('/register', authValidation.register, authController.register);

/**
 * @route   GET /api/auth/captcha
 * @desc    获取登录验证码
 * @access  Public
 */
router.get('/captcha', authController.getCaptcha);

/**
 * @route   POST /api/auth/login
 * @desc    用户登录
 * @access  Public
 */
router.post('/login', authValidation.login, authController.login);

/**
 * @route   POST /api/auth/refresh
 * @desc    刷新访问令牌
 * @access  Public
 */
router.post('/refresh', authValidation.refresh, authController.refresh);

// 需要认证的接口

/**
 * @route   GET /api/auth/me
 * @desc    获取当前用户信息
 * @access  Private
 */
router.get('/me', authenticate, authController.getCurrentUser);

/**
 * @route   POST /api/auth/change-password
 * @desc    修改密码
 * @access  Private
 */
router.post('/change-password', authenticate, authValidation.changePassword, authController.changePassword);

/**
 * @route   POST /api/auth/logout
 * @desc    用户登出
 * @access  Private
 */
router.post('/logout', authenticate, authController.logout);

module.exports = router;
