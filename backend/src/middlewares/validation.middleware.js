/**
 * 参数校验中间件
 * 使用 express-validator 进行请求参数校验
 */

const { body, param, query, validationResult } = require('express-validator');
const { AppError } = require('./error.middleware');

/**
 * 校验结果处理中间件
 * 检查校验结果，如果有错误则返回 400 响应
 */
const validate = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(err => ({
            field: err.path,
            message: err.msg,
        }));

        return res.status(400).json({
            success: false,
            code: 'VALIDATION_ERROR',
            message: '参数校验失败',
            errors: errorMessages,
        });
    }

    next();
};

// ============ 认证相关校验规则 ============

const authValidation = {
    // 注册校验
    register: [
        body('username')
            .trim()
            .notEmpty().withMessage('用户名不能为空')
            .isLength({ min: 3, max: 30 }).withMessage('用户名长度需在 3-30 个字符之间')
            .matches(/^[a-zA-Z0-9_]+$/).withMessage('用户名只能包含字母、数字和下划线'),
        body('email')
            .trim()
            .notEmpty().withMessage('邮箱不能为空')
            .isEmail().withMessage('请输入有效的邮箱地址')
            .isLength({ min: 11, max: 100 }).withMessage('邮箱长度需在 11-100 个字符之间'),
        body('password')
            .notEmpty().withMessage('密码不能为空')
            .isLength({ min: 6 }).withMessage('密码长度不能少于 6 个字符'),
        validate,
    ],

    // 登录校验
    login: [
        body('username')
            .trim()
            .notEmpty().withMessage('用户名/邮箱不能为空'),
        body('password')
            .notEmpty().withMessage('密码不能为空'),
        body('captchaId')
            .notEmpty().withMessage('验证码 ID 不能为空'),
        body('captchaCode')
            .trim()
            .notEmpty().withMessage('请输入验证码'),
        validate,
    ],

    // 刷新令牌校验
    refresh: [
        body('refreshToken')
            .notEmpty().withMessage('刷新令牌不能为空'),
        validate,
    ],

    // 修改密码校验
    changePassword: [
        body('oldPassword')
            .notEmpty().withMessage('原密码不能为空'),
        body('newPassword')
            .notEmpty().withMessage('新密码不能为空')
            .isLength({ min: 6 }).withMessage('新密码长度不能少于 6 个字符'),
        validate,
    ],
};

// ============ 员工相关校验规则 ============

const employeeValidation = {
    // 创建员工校验
    create: [
        body('fullName')
            .trim()
            .notEmpty().withMessage('姓名不能为空')
            .isLength({ max: 50 }).withMessage('姓名长度不能超过 50 个字符'),
        body('department')
            .trim()
            .notEmpty().withMessage('部门不能为空'),
        body('position')
            .trim()
            .notEmpty().withMessage('职位不能为空'),
        body('entryDate')
            .notEmpty().withMessage('入职日期不能为空')
            .isISO8601().withMessage('请输入有效的日期格式'),
        body('phone')
            .optional()
            .matches(/^1[3-9]\d{9}$/).withMessage('请输入有效的手机号码'),
        validate,
    ],

    // 更新员工校验
    update: [
        param('id')
            .isInt({ min: 1 }).withMessage('无效的员工 ID'),
        body('fullName')
            .optional()
            .trim()
            .isLength({ max: 50 }).withMessage('姓名长度不能超过 50 个字符'),
        body('entryDate')
            .optional()
            .isISO8601().withMessage('请输入有效的日期格式'),
        validate,
    ],
};

// ============ 项目相关校验规则 ============

const projectValidation = {
    // 创建项目校验
    create: [
        body('projectName')
            .trim()
            .notEmpty().withMessage('项目名称不能为空')
            .isLength({ max: 100 }).withMessage('项目名称长度不能超过 100 个字符'),
        body('code')
            .trim()
            .notEmpty().withMessage('项目编码不能为空')
            .matches(/^[A-Z0-9-]+$/).withMessage('项目编码只能包含大写字母、数字和连字符'),
        body('pmId')
            .notEmpty().withMessage('项目经理不能为空')
            .isInt({ min: 1 }).withMessage('无效的项目经理 ID'),
        body('startDate')
            .notEmpty().withMessage('开始日期不能为空')
            .isISO8601().withMessage('请输入有效的日期格式'),
        body('endDate')
            .optional()
            .isISO8601().withMessage('请输入有效的日期格式'),
        validate,
    ],

    // 更新项目校验
    update: [
        param('id')
            .isInt({ min: 1 }).withMessage('无效的项目 ID'),
        body('projectName')
            .optional()
            .trim()
            .isLength({ max: 100 }).withMessage('项目名称长度不能超过 100 个字符'),
        validate,
    ],
};

// ============ 工作流相关校验规则 ============

const workflowValidation = {
    // 创建工作流校验
    create: [
        body('templateId')
            .notEmpty().withMessage('模板 ID 不能为空')
            .isInt({ min: 1 }).withMessage('无效的模板 ID'),
        body('type')
            .notEmpty().withMessage('工作流类型不能为空')
            .isIn(['ONBOARD', 'OFFBOARD']).withMessage('无效的工作流类型'),
        body('projectId')
            .optional()
            .isInt({ min: 1 }).withMessage('无效的项目 ID'),
        validate,
    ],

    // 审批操作校验
    approve: [
        param('id')
            .isInt({ min: 1 }).withMessage('无效的工作流 ID'),
        body('comment')
            .optional()
            .trim()
            .isLength({ max: 500 }).withMessage('审批意见不能超过 500 个字符'),
        validate,
    ],
};

// ============ 通用校验规则 ============

const commonValidation = {
    // ID 参数校验
    idParam: [
        param('id')
            .isInt({ min: 1 }).withMessage('无效的 ID'),
        validate,
    ],

    // 分页参数校验
    pagination: [
        query('page')
            .optional()
            .isInt({ min: 1 }).withMessage('页码必须是正整数'),
        query('pageSize')
            .optional()
            .isInt({ min: 1, max: 100 }).withMessage('每页数量必须在 1-100 之间'),
        validate,
    ],
};

module.exports = {
    validate,
    authValidation,
    employeeValidation,
    projectValidation,
    workflowValidation,
    commonValidation,
};
