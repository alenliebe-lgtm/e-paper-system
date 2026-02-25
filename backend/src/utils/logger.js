/**
 * 统一日志工具
 * 替代分散的 console.log / console.error 调用
 * 提供可扩展的日志接口，未来可对接外部日志系统
 */
const config = require('../config');

// 日志级别
const LOG_LEVELS = {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3,
};

// 当前日志级别（生产环境只输出 WARN 及以上）
const currentLevel = config.server.env === 'production' ? LOG_LEVELS.WARN : LOG_LEVELS.DEBUG;

/**
 * 格式化日志时间戳
 */
function timestamp() {
    return new Date().toISOString();
}

/**
 * 输出日志
 */
function log(level, label, message, meta = null) {
    if (LOG_LEVELS[level] > currentLevel) return;

    const prefix = `[${timestamp()}] [${level}] [${label}]`;

    if (meta) {
        console[level === 'ERROR' ? 'error' : level === 'WARN' ? 'warn' : 'log'](
            prefix, message, meta
        );
    } else {
        console[level === 'ERROR' ? 'error' : level === 'WARN' ? 'warn' : 'log'](
            prefix, message
        );
    }
}

const logger = {
    /**
     * 错误日志
     * @param {string} label - 模块标签
     * @param {string} message - 日志消息
     * @param {*} meta - 附加信息
     */
    error(label, message, meta) {
        log('ERROR', label, message, meta);
    },

    /**
     * 警告日志
     * @param {string} label - 模块标签
     * @param {string} message - 日志消息
     * @param {*} meta - 附加信息
     */
    warn(label, message, meta) {
        log('WARN', label, message, meta);
    },

    /**
     * 信息日志
     * @param {string} label - 模块标签
     * @param {string} message - 日志消息
     * @param {*} meta - 附加信息
     */
    info(label, message, meta) {
        log('INFO', label, message, meta);
    },

    /**
     * 调试日志
     * @param {string} label - 模块标签
     * @param {string} message - 日志消息
     * @param {*} meta - 附加信息
     */
    debug(label, message, meta) {
        log('DEBUG', label, message, meta);
    },
};

module.exports = logger;
