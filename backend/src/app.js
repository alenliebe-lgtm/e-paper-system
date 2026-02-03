/**
 * Express 应用入口文件
 * E-Paper 员工与项目全生命周期管理系统
 */

const express = require('express');
const cors = require('cors');
const config = require('./config');

// 导入路由
const authRoutes = require('./routes/auth.routes');
const employeeRoutes = require('./routes/employee.routes');
const projectRoutes = require('./routes/project.routes');
const workflowRoutes = require('./routes/workflow.routes');
const templateRoutes = require('./routes/template.routes');
const uploadRoutes = require('./routes/upload.routes');

// 导入中间件
const { errorHandler } = require('./middlewares/error.middleware');

// 创建 Express 应用
const app = express();

// ============ 全局中间件 ============

// 解析 JSON 请求体
app.use(express.json());

// 解析 URL 编码的请求体
app.use(express.urlencoded({ extended: true }));

// 配置 CORS
app.use(cors({
    origin: config.cors.origin,
    credentials: config.cors.credentials,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ============ 健康检查 ============

app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: config.server.env,
    });
});

// ============ API 路由 ============

app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/upload', uploadRoutes);

// ============ 错误处理 ============

// 404 处理
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: '请求的资源不存在',
        path: req.originalUrl,
    });
});

// 全局错误处理中间件
app.use(errorHandler);

// ============ 启动服务器 ============

const PORT = config.server.port;

app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║                   E-Paper 管理系统                          ║
║────────────────────────────────────────────────────────────║
║  服务器已启动: http://localhost:${PORT}                      ║
║  环境: ${config.server.env.padEnd(20)}                       ║
║  时间: ${new Date().toLocaleString('zh-CN')}                 ║
╚════════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
