/**
 * 验证码服务
 * 使用 svg-captcha 生成验证码图片，Redis 存储验证码文本
 */

const svgCaptcha = require('svg-captcha');
const { v4: uuidv4 } = require('uuid');
const { getRedisClient } = require('../utils/redis');

// 验证码在 Redis 中的 Key 前缀
const CAPTCHA_PREFIX = 'captcha:';
// 验证码过期时间（秒）
const CAPTCHA_EXPIRE = 300; // 5 分钟

/**
 * 生成验证码
 * @returns {Promise<{ captchaId: string, svg: string }>} 验证码 ID 和 SVG 图片
 */
async function generateCaptcha() {
    // 生成 SVG 验证码（优化辨识度）
    const captcha = svgCaptcha.create({
        size: 4,          // 验证码长度
        noise: 1,         // 干扰线条数（减少以提高辨识度）
        color: false,     // 单色字符（更清晰）
        background: '#f0f0f0',
        width: 140,
        height: 44,
        fontSize: 44,
        charPreset: '0123456789', // 仅使用数字（避免字母难辨认）
    });

    // 生成唯一 ID
    const captchaId = uuidv4();

    // 存入 Redis，设置过期时间
    const redis = await getRedisClient();
    await redis.setEx(
        `${CAPTCHA_PREFIX}${captchaId}`,
        CAPTCHA_EXPIRE,
        captcha.text.toLowerCase()
    );

    return {
        captchaId,
        svg: captcha.data,
    };
}

/**
 * 校验验证码
 * @param {string} captchaId - 验证码 ID
 * @param {string} userInput - 用户输入的验证码
 * @returns {Promise<boolean>} 验证是否通过
 */
async function verifyCaptcha(captchaId, userInput) {
    if (!captchaId || !userInput) {
        return false;
    }

    const redis = await getRedisClient();
    const key = `${CAPTCHA_PREFIX}${captchaId}`;

    // 从 Redis 获取验证码文本
    const storedText = await redis.get(key);

    if (!storedText) {
        // 验证码已过期或不存在
        return false;
    }

    // 验证后立即删除（一次性使用）
    await redis.del(key);

    // 忽略大小写比较
    return storedText === userInput.toLowerCase();
}

module.exports = {
    generateCaptcha,
    verifyCaptcha,
};
