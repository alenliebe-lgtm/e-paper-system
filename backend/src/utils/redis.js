/**
 * Redis 客户端工具
 * 提供 Redis 连接的单例管理，支持连接失败时的优雅处理
 */

const { createClient } = require('redis');
const config = require('../config');

let client = null;
let isConnected = false;

/**
 * 获取 Redis 客户端实例（单例模式）
 * 如果 Redis 不可用，将抛出明确错误
 * @returns {Promise<import('redis').RedisClientType>} Redis 客户端实例
 */
async function getRedisClient() {
    if (client && isConnected) {
        return client;
    }

    if (!client) {
        client = createClient({
            url: config.redis.url,
            socket: {
                connectTimeout: 5000,   // 连接超时 5 秒
                reconnectStrategy: (retries) => {
                    // 最多重试 3 次，每次间隔递增
                    if (retries >= 3) {
                        console.error('Redis 重连失败，已达最大重试次数');
                        return false; // 停止重连
                    }
                    return Math.min(retries * 500, 2000);
                },
            },
        });

        client.on('error', (err) => {
            isConnected = false;
            // 只在首次输出错误日志，避免刷屏
            if (err.code === 'ECONNREFUSED') {
                console.error('Redis 连接被拒绝，请确保 Redis 服务已启动:', config.redis.url);
            }
        });

        client.on('connect', () => {
            isConnected = true;
            console.log('Redis 已连接:', config.redis.url);
        });

        client.on('end', () => {
            isConnected = false;
        });
    }

    try {
        if (!isConnected) {
            await client.connect();
        }
        return client;
    } catch (err) {
        // 重置客户端，下次调用会创建新连接
        client = null;
        isConnected = false;
        throw new Error(`Redis 连接失败: ${err.message}。请确保 Redis 服务已启动 (${config.redis.url})`);
    }
}

module.exports = { getRedisClient };
