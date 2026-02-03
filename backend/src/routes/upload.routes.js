/**
 * 文件上传路由
 * 定义文件上传下载相关的 API 端点
 */

const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/upload.controller');
const { authenticate } = require('../middlewares/auth.middleware');

/**
 * @route   POST /api/upload
 * @desc    单文件上传
 * @access  Private
 */
router.post('/', authenticate, uploadController.uploadFile);

/**
 * @route   POST /api/upload/multiple
 * @desc    多文件上传
 * @access  Private
 */
router.post('/multiple', authenticate, uploadController.uploadMultiple);

/**
 * @route   GET /api/upload/:filename
 * @desc    下载文件
 * @access  Private
 */
router.get('/:filename', authenticate, uploadController.downloadFile);

/**
 * @route   DELETE /api/upload/:filename
 * @desc    删除文件
 * @access  Private
 */
router.delete('/:filename', authenticate, uploadController.deleteFile);

module.exports = router;
