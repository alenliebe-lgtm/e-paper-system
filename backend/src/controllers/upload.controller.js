/**
 * 文件上传控制器
 * 处理文件上传和下载
 */

const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const { asyncHandler, AppError } = require('../middlewares/error.middleware');

// 确保上传目录存在
const uploadDir = path.resolve(config.upload.dir);
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置 multer 存储
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // 生成唯一文件名
        const ext = path.extname(file.originalname);
        const filename = `${uuidv4()}${ext}`;
        cb(null, filename);
    },
});

// 文件过滤器
const fileFilter = (req, file, cb) => {
    if (config.upload.allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new AppError('不支持的文件类型', 400, 'INVALID_FILE_TYPE'), false);
    }
};

// 创建 multer 实例
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: config.upload.maxFileSize,
    },
});

/**
 * 单文件上传
 * POST /api/upload
 */
const uploadFile = [
    upload.single('file'),
    asyncHandler(async (req, res) => {
        if (!req.file) {
            throw new AppError('请选择要上传的文件', 400, 'NO_FILE');
        }

        const file = req.file;

        res.status(201).json({
            success: true,
            message: '文件上传成功',
            data: {
                filename: file.filename,
                originalname: file.originalname,
                mimetype: file.mimetype,
                size: file.size,
                url: `/api/upload/${file.filename}`,
            },
        });
    }),
];

/**
 * 多文件上传
 * POST /api/upload/multiple
 */
const uploadMultiple = [
    upload.array('files', 10), // 最多 10 个文件
    asyncHandler(async (req, res) => {
        if (!req.files || req.files.length === 0) {
            throw new AppError('请选择要上传的文件', 400, 'NO_FILE');
        }

        const files = req.files.map(file => ({
            filename: file.filename,
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            url: `/api/upload/${file.filename}`,
        }));

        res.status(201).json({
            success: true,
            message: `成功上传 ${files.length} 个文件`,
            data: files,
        });
    }),
];

/**
 * 下载文件
 * GET /api/upload/:filename
 */
const downloadFile = asyncHandler(async (req, res) => {
    const { filename } = req.params;
    const filepath = path.join(uploadDir, filename);

    // 安全检查：防止路径遍历攻击
    if (!filepath.startsWith(uploadDir)) {
        throw new AppError('无效的文件路径', 400, 'INVALID_PATH');
    }

    if (!fs.existsSync(filepath)) {
        throw new AppError('文件不存在', 404, 'FILE_NOT_FOUND');
    }

    res.download(filepath);
});

/**
 * 删除文件
 * DELETE /api/upload/:filename
 */
const deleteFile = asyncHandler(async (req, res) => {
    const { filename } = req.params;
    const filepath = path.join(uploadDir, filename);

    // 安全检查：防止路径遍历攻击
    if (!filepath.startsWith(uploadDir)) {
        throw new AppError('无效的文件路径', 400, 'INVALID_PATH');
    }

    if (!fs.existsSync(filepath)) {
        throw new AppError('文件不存在', 404, 'FILE_NOT_FOUND');
    }

    fs.unlinkSync(filepath);

    res.json({
        success: true,
        message: '文件删除成功',
    });
});

module.exports = {
    uploadFile,
    uploadMultiple,
    downloadFile,
    deleteFile,
};
