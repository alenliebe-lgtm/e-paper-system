/**
 * 认证控制器
 * 处理认证相关的 HTTP 请求
 */

const authService = require('../services/auth.service');
const captchaService = require('../services/captcha.service');
const { asyncHandler } = require('../middlewares/error.middleware');

/**
 * 用户注册
 * POST /api/auth/register
 */
const register = asyncHandler(async (req, res) => {
    const { username, email, password, roleId } = req.body;

    const user = await authService.register({
        username,
        email,
        password,
        roleId,
    });

    res.status(201).json({
        success: true,
        message: '注册成功',
        data: user,
    });
});

/**
 * 获取验证码
 * GET /api/auth/captcha
 */
const getCaptcha = asyncHandler(async (req, res) => {
    const result = await captchaService.generateCaptcha();

    res.json({
        success: true,
        data: result,
    });
});

/**
 * 用户登录
 * POST /api/auth/login
 */
const login = asyncHandler(async (req, res) => {
    const { username, password, captchaId, captchaCode } = req.body;

    // 校验验证码
    const captchaValid = await captchaService.verifyCaptcha(captchaId, captchaCode);
    if (!captchaValid) {
        return res.status(400).json({
            success: false,
            message: '验证码错误或已过期',
        });
    }

    const result = await authService.login(username, password);

    res.json({
        success: true,
        message: '登录成功',
        data: result,
    });
});

/**
 * 刷新令牌
 * POST /api/auth/refresh
 */
const refresh = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    const tokens = await authService.refreshToken(refreshToken);

    res.json({
        success: true,
        message: '令牌刷新成功',
        data: tokens,
    });
});

/**
 * 修改密码
 * POST /api/auth/change-password
 */
const changePassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id;

    await authService.changePassword(userId, oldPassword, newPassword);

    res.json({
        success: true,
        message: '密码修改成功',
    });
});

/**
 * 获取当前用户信息
 * GET /api/auth/me
 */
const getCurrentUser = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const user = await authService.getCurrentUser(userId);

    res.json({
        success: true,
        data: user,
    });
});

/**
 * 用户登出
 * POST /api/auth/logout
 */
const logout = asyncHandler(async (req, res) => {
    // JWT 是无状态的，客户端只需删除本地 token
    // 如果需要服务端登出，可以将 token 加入黑名单（使用 Redis）
    res.json({
        success: true,
        message: '登出成功',
    });
});

module.exports = {
    register,
    getCaptcha,
    login,
    refresh,
    changePassword,
    getCurrentUser,
    logout,
};
