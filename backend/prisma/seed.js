/**
 * 数据库种子数据
 * 初始化系统必要的基础数据
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('开始初始化种子数据...');

  // 创建权限
  const permissions = await createPermissions();
  console.log(`创建了 ${permissions.length} 个权限`);

  // 创建角色
  const roles = await createRoles(permissions);
  console.log(`创建了 ${Object.keys(roles).length} 个角色`);

  // 创建管理员用户
  const admin = await createAdminUser(roles.admin);
  console.log(`创建管理员用户: ${admin.username}`);

  // 创建默认模板
  const templates = await createDefaultTemplates();
  console.log(`创建了 ${templates.length} 个默认模板`);

  // 创建示例物料数据
  const materials = await createSampleMaterials();
  console.log(`创建了 ${materials.length} 个示例物料`);

  console.log('种子数据初始化完成!');
}

// 创建权限数据
async function createPermissions() {
  const permissionData = [
    // 用户管理权限
    { code: 'user:read', name: '查看用户', resource: 'user', action: 'read' },
    { code: 'user:write', name: '编辑用户', resource: 'user', action: 'write' },
    { code: 'user:delete', name: '删除用户', resource: 'user', action: 'delete' },

    // 员工管理权限
    { code: 'employee:read', name: '查看员工', resource: 'employee', action: 'read' },
    { code: 'employee:write', name: '编辑员工', resource: 'employee', action: 'write' },
    { code: 'employee:delete', name: '删除员工', resource: 'employee', action: 'delete' },

    // 项目管理权限
    { code: 'project:read', name: '查看项目', resource: 'project', action: 'read' },
    { code: 'project:write', name: '编辑项目', resource: 'project', action: 'write' },
    { code: 'project:delete', name: '删除项目', resource: 'project', action: 'delete' },

    // 工作流权限
    { code: 'workflow:read', name: '查看工作流', resource: 'workflow', action: 'read' },
    { code: 'workflow:write', name: '发起工作流', resource: 'workflow', action: 'write' },
    { code: 'workflow:approve', name: '审批工作流', resource: 'workflow', action: 'approve' },

    // 模板管理权限
    { code: 'template:read', name: '查看模板', resource: 'template', action: 'read' },
    { code: 'template:write', name: '编辑模板', resource: 'template', action: 'write' },

    // 系统管理权限
    { code: 'system:admin', name: '系统管理', resource: 'system', action: 'admin' },

    // 驾驶舱/报表权限
    { code: 'dashboard:read', name: '查看驾驶舱', resource: 'dashboard', action: 'read' },
    { code: 'export:read', name: '导出报表', resource: 'export', action: 'read' },

    // 物料管理权限
    { code: 'material:read', name: '查看物料', resource: 'material', action: 'read' },
    { code: 'material:write', name: '编辑物料', resource: 'material', action: 'write' },
    { code: 'material:delete', name: '删除物料', resource: 'material', action: 'delete' },

    // 预警管理权限
    { code: 'alert:read', name: '查看预警', resource: 'alert', action: 'read' },
  ];

  const permissions = [];
  for (const data of permissionData) {
    const permission = await prisma.permission.upsert({
      where: { code: data.code },
      update: data,
      create: data,
    });
    permissions.push(permission);
  }
  return permissions;
}

// 创建角色数据
async function createRoles(permissions) {
  // 定义角色及其权限
  const rolesConfig = {
    admin: {
      name: 'Admin',
      description: '系统管理员，拥有所有权限',
      permissionCodes: permissions.map(p => p.code), // 所有权限
    },
    pm: {
      name: 'PM',
      description: '项目经理',
      permissionCodes: [
        'user:read', 'employee:read', 'employee:write',
        'project:read', 'project:write',
        'workflow:read', 'workflow:write', 'workflow:approve',
        'template:read',
        'dashboard:read', 'export:read',
        'material:read', 'material:write',
        'alert:read',
      ],
    },
    staff: {
      name: 'Staff',
      description: '普通员工',
      permissionCodes: [
        'employee:read',
        'project:read',
        'workflow:read', 'workflow:write',
        'material:read',
        'alert:read',
      ],
    },
    it: {
      name: 'IT',
      description: 'IT 部门',
      permissionCodes: [
        'user:read', 'employee:read',
        'project:read',
        'workflow:read', 'workflow:approve',
        'material:read', 'material:write',
        'alert:read',
      ],
    },
    finance: {
      name: 'Finance',
      description: '财务审核人',
      permissionCodes: [
        'employee:read',
        'project:read',
        'workflow:read', 'workflow:approve',
        'dashboard:read', 'export:read',
        'material:read',
        'alert:read',
      ],
    },
  };

  const roles = {};

  for (const [key, config] of Object.entries(rolesConfig)) {
    // 创建角色
    const role = await prisma.role.upsert({
      where: { name: config.name },
      update: { description: config.description },
      create: { name: config.name, description: config.description },
    });

    // 关联权限
    const permissionIds = permissions
      .filter(p => config.permissionCodes.includes(p.code))
      .map(p => p.id);

    // 先删除旧的关联
    await prisma.rolePermission.deleteMany({
      where: { roleId: role.id },
    });

    // 创建新的关联
    for (const permissionId of permissionIds) {
      await prisma.rolePermission.create({
        data: { roleId: role.id, permissionId },
      });
    }

    roles[key] = role;
  }

  return roles;
}

// 创建管理员用户
async function createAdminUser(adminRole) {
  const passwordHash = await bcrypt.hash('admin123', 10);

  return prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@epaper.com',
      passwordHash,
      roleId: adminRole.id,
      status: 'ACTIVE',
    },
  });
}

// 创建默认模板
async function createDefaultTemplates() {
  const templatesData = [
    {
      name: '入职审批模板',
      type: 'ONBOARD',
      content: {
        title: '员工入职审批',
        checkItems: [
          { id: 1, label: '个人信息确认', required: true },
          { id: 2, label: '合同签署', required: true },
          { id: 3, label: '门禁权限开通', required: true },
          { id: 4, label: '系统账号创建', required: true },
          { id: 5, label: '设备领取', required: false },
        ],
        approvalSteps: [
          { step: 1, role: 'PM', name: '项目经理审批' },
          { step: 2, role: 'IT', name: 'IT 部门处理' },
        ],
      },
      version: 1,
      isActive: true,
    },
    {
      name: '离职审批模板',
      type: 'OFFBOARD',
      content: {
        title: '员工离职审批',
        checkItems: [
          { id: 1, label: '工作交接确认', required: true },
          { id: 2, label: '设备归还', required: true },
          { id: 3, label: '门禁权限撤销', required: true },
          { id: 4, label: '系统账号停用', required: true },
          { id: 5, label: '离职证明', required: false },
        ],
        approvalSteps: [
          { step: 1, role: 'PM', name: '项目经理审批' },
          { step: 2, role: 'Admin', name: '行政确认' },
        ],
      },
      version: 1,
      isActive: true,
    },
    {
      name: '项目立项审批模板',
      type: 'PROJECT_APPROVAL',
      content: {
        title: '项目立项审批',
        checkItems: [
          { id: 1, label: '项目可行性评估', required: true },
          { id: 2, label: '预算审核', required: true },
          { id: 3, label: '人员配置确认', required: true },
          { id: 4, label: '风险评估', required: false },
        ],
        approvalSteps: [
          { step: 1, role: 'PM', name: '项目经理审批' },
          { step: 2, role: 'Finance', name: '财务审核' },
          { step: 3, role: 'Admin', name: '管理层批准' },
        ],
      },
      version: 1,
      isActive: true,
    },
    {
      name: '项目变更审批模板',
      type: 'CHANGE_REQUEST',
      content: {
        title: '项目变更审批',
        checkItems: [
          { id: 1, label: '变更原因说明', required: true },
          { id: 2, label: '影响评估', required: true },
          { id: 3, label: '预算变更确认', required: false },
        ],
        approvalSteps: [
          { step: 1, role: 'PM', name: '项目经理审批' },
          { step: 2, role: 'Admin', name: '管理层批准' },
        ],
      },
      version: 1,
      isActive: true,
    },
    {
      name: '项目验收审批模板',
      type: 'ACCEPTANCE',
      content: {
        title: '项目验收审批',
        checkItems: [
          { id: 1, label: '交付物检查', required: true },
          { id: 2, label: '质量验收', required: true },
          { id: 3, label: '客户签字确认', required: true },
          { id: 4, label: '结算确认', required: true },
        ],
        approvalSteps: [
          { step: 1, role: 'PM', name: '项目经理确认' },
          { step: 2, role: 'Finance', name: '财务结算' },
          { step: 3, role: 'Admin', name: '管理层确认' },
        ],
      },
      version: 1,
      isActive: true,
    },
  ];

  const templates = [];
  for (const data of templatesData) {
    const template = await prisma.template.upsert({
      where: { id: templates.length + 1 },
      update: data,
      create: data,
    });
    templates.push(template);
  }
  return templates;
}

// 创建示例物料数据
async function createSampleMaterials() {
  const materialsData = [
    {
      name: 'E-Paper 电子纸屏幕 7.5寸',
      code: 'MAT-EP-750',
      category: '电子纸屏',
      unit: '片',
      stock: 100,
      minStock: 20,
      description: '7.5 英寸电子纸显示屏，黑白双色',
    },
    {
      name: 'E-Paper 电子纸屏幕 4.2寸',
      code: 'MAT-EP-420',
      category: '电子纸屏',
      unit: '片',
      stock: 200,
      minStock: 50,
      description: '4.2 英寸电子纸显示屏，黑白双色',
    },
    {
      name: 'ESP32 主控板',
      code: 'MAT-MCU-ESP32',
      category: '主控板',
      unit: '块',
      stock: 150,
      minStock: 30,
      description: 'ESP32-S3 开发板，支持 Wi-Fi/BLE',
    },
    {
      name: '锂电池 3.7V 2000mAh',
      code: 'MAT-BAT-2000',
      category: '电池',
      unit: '块',
      stock: 300,
      minStock: 50,
      description: '3.7V 聚合物锂电池，2000mAh 容量',
    },
    {
      name: '外壳模具（A款）',
      code: 'MAT-CASE-A',
      category: '外壳',
      unit: '套',
      stock: 80,
      minStock: 15,
      description: '注塑外壳 A 款，适配 7.5 寸屏幕',
    },
  ];

  const materials = [];
  for (const data of materialsData) {
    const material = await prisma.material.upsert({
      where: { code: data.code },
      update: data,
      create: data,
    });
    materials.push(material);
  }
  return materials;
}

main()
  .catch((e) => {
    console.error('种子数据初始化失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
