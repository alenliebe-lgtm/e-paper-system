/**
 * 报表导出控制器
 */

const exportService = require('../services/export.service');

// 导出项目报告 Excel
const exportProjectReport = async (req, res, next) => {
    try {
        const { buffer, filename } = await exportService.exportProjectReport(req.params.id);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
        res.send(Buffer.from(buffer));
    } catch (error) {
        next(error);
    }
};

// 导出物料报表 Excel
const exportMaterialReport = async (req, res, next) => {
    try {
        const { buffer, filename } = await exportService.exportMaterialReport(req.query);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
        res.send(Buffer.from(buffer));
    } catch (error) {
        next(error);
    }
};

module.exports = {
    exportProjectReport,
    exportMaterialReport,
};
