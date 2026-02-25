/**
 * 预警控制器
 */

const alertService = require('../services/alert.service');

// 获取当前用户预警列表
const getAlerts = async (req, res, next) => {
    try {
        const result = await alertService.getUserAlerts(req.user.id, req.query);
        res.json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
};

// 获取未读预警数量
const getUnreadCount = async (req, res, next) => {
    try {
        const count = await alertService.getUnreadCount(req.user.id);
        res.json({ success: true, data: { count } });
    } catch (error) {
        next(error);
    }
};

// 标记单条预警已读
const markAsRead = async (req, res, next) => {
    try {
        await alertService.markAsRead(parseInt(req.params.id, 10), req.user.id);
        res.json({ success: true, message: '已标记为已读' });
    } catch (error) {
        next(error);
    }
};

// 标记全部已读
const markAllAsRead = async (req, res, next) => {
    try {
        await alertService.markAllAsRead(req.user.id);
        res.json({ success: true, message: '已全部标记为已读' });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAlerts,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
};
