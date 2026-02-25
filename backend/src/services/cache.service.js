/**
 * Redis 缓存服务
 * 封装常用缓存操作，为高频查询提供缓存层
 */

const { createClient } = require('redis');
const config = require('../config');
const logger = require('../utils/logger');

let client = null;

/**
 * 初始化 Redis 连接
 */
async function initRedis() {
    if (client) return client;

    try {
        client = createClient({ url: config.redis.url });

        client.on('error', (err) => {
            logger.error('Redis', '连接错误', err.message);
        });

        client.on('connect', () => {
            logger.info('Redis', '缓存服务已连接');
        });

        await client.connect();
        return client;
    } catch (error) {
        logger.warn('Redis', '缓存服务不可用，将跳过缓存', error.message);
        client = null;
        return null;
    }
}

/**
 * 获取缓存
 * @param {string} key - 缓存键
 * @returns {*} 缓存值（已解析 JSON），不存在返回 null
 */
async function get(key) {
    try {
        if (!client) await initRedis();
        if (!client) return null;

        const value = await client.get(key);
        return value ? JSON.parse(value) : null;
    } catch (error) {
        logger.warn('Redis', `获取缓存失败: ${key}`, error.message);
        return null;
    }
}

/**
 * 设置缓存
 * @param {string} key - 缓存键
 * @param {*} value - 缓存值（将自动 JSON 序列化）
 * @param {number} ttl - 过期时间（秒），默认 300（5 分钟）
 */
async function set(key, value, ttl = 300) {
    try {
        if (!client) await initRedis();
        if (!client) return;

        await client.set(key, JSON.stringify(value), { EX: ttl });
    } catch (error) {
        logger.warn('Redis', `设置缓存失败: ${key}`, error.message);
    }
}

/**
 * 删除缓存
 * @param {string} key - 缓存键
 */
async function del(key) {
    try {
        if (!client) return;
        await client.del(key);
    } catch (error) {
        logger.warn('Redis', `删除缓存失败: ${key}`, error.message);
    }
}

/**
 * 按模式批量删除缓存
 * @param {string} pattern - 键匹配模式，如 'dashboard:*'
 */
async function invalidatePattern(pattern) {
    try {
        if (!client) return;

        const keys = await client.keys(pattern);
        if (keys.length > 0) {
            await client.del(keys);
            logger.debug('Redis', `批量删除缓存: ${pattern}，共 ${keys.length} 个键`);
        }
    } catch (error) {
        logger.warn('Redis', `批量删除缓存失败: ${pattern}`, error.message);
    }
}

/**
 * 带缓存的查询包装器
 * 先查缓存，缓存未命中时执行查询并缓存结果
 * @param {string} key - 缓存键
 * @param {Function} queryFn - 查询方法
 * @param {number} ttl - 过期时间（秒）
 * @returns {*} 查询结果
 */
async function getOrSet(key, queryFn, ttl = 300) {
    const cached = await get(key);
    if (cached !== null) {
        logger.debug('Redis', `缓存命中: ${key}`);
        return cached;
    }

    const result = await queryFn();
    await set(key, result, ttl);
    return result;
}

module.exports = {
    initRedis,
    get,
    set,
    del,
    invalidatePattern,
    getOrSet,
};
