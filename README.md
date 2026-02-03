# E-Paper 员工与项目全生命周期管理系统

一个集成的员工与项目管理系统，实现员工 On/Off-board 流程的自动化、标准化和可视化。

## 项目结构

```
e-paper/
├── backend/                    # 后端服务 (Node.js + Express)
│   ├── src/
│   │   ├── config/            # 配置文件
│   │   ├── controllers/       # 控制器层
│   │   ├── middlewares/       # 中间件
│   │   ├── models/            # 数据模型
│   │   ├── routes/            # 路由定义
│   │   ├── services/          # 业务逻辑层
│   │   └── app.js             # 应用入口
│   ├── prisma/                # Prisma Schema
│   └── package.json
│
└── frontend/                   # 前端应用 (Next.js)
    ├── src/
    │   ├── app/               # Next.js App Router
    │   ├── lib/               # 工具库
    │   └── styles/            # 样式文件
    └── package.json
```

## 快速开始

### 前置条件

- Node.js >= 18.0.0
- PostgreSQL 数据库
- Redis (可选，用于会话管理)

### 1. 安装依赖

```bash
# 后端
cd backend
npm install

# 前端
cd frontend
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并修改配置：

```bash
cd backend
cp .env.example .env
```

修改数据库连接字符串：
```
DATABASE_URL="postgresql://用户名:密码@localhost:5432/epaper_db"
```

### 3. 初始化数据库

```bash
cd backend

# 生成 Prisma 客户端
npm run db:generate

# 执行数据库迁移
npm run db:migrate

# 初始化种子数据
npm run db:seed
```

### 4. 启动服务

```bash
# 启动后端 (端口 3001)
cd backend
npm run dev

# 启动前端 (端口 3000)
cd frontend
npm run dev
```

### 5. 访问系统

- 前端：http://localhost:3000
- 后端 API：http://localhost:3001/api

### 默认管理员账号

- 用户名：admin
- 密码：admin123

## 功能模块

### 认证与授权
- 用户登录/注册
- JWT 令牌认证
- RBAC 权限控制

### 员工管理
- 员工档案 CRUD
- 部门/职位管理
- 文件附件上传

### 项目管理
- 项目信息 CRUD
- 项目经理指派
- 项目状态跟踪

### 审批流程
- 入职 (On-board) 流程
- 离职 (Off-board) 流程
- 多级审批支持
- 审计日志记录

### 模板配置
- 审批模板自定义
- 审批步骤配置
- 版本控制

## 技术栈

### 后端
- Node.js + Express
- Prisma ORM
- PostgreSQL
- JWT 认证

### 前端
- Next.js 14 (App Router)
- React 18
- CSS (自定义设计系统)

## API 文档

| 模块 | 方法 | 路径 | 描述 |
|------|------|------|------|
| 认证 | POST | `/api/auth/login` | 用户登录 |
| | POST | `/api/auth/register` | 用户注册 |
| | GET | `/api/auth/me` | 获取当前用户 |
| 员工 | GET | `/api/employees` | 员工列表 |
| | POST | `/api/employees` | 创建员工 |
| 项目 | GET | `/api/projects` | 项目列表 |
| | POST | `/api/projects` | 创建项目 |
| 工作流 | GET | `/api/workflows` | 工作流列表 |
| | POST | `/api/workflows` | 发起申请 |
| | POST | `/api/workflows/:id/approve` | 审批通过 |
| | POST | `/api/workflows/:id/reject` | 审批拒绝 |

## 许可证

MIT License
