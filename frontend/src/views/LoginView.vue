<template>
  <div class="login-page">
    <div class="login-card">
      <h1 class="login-title">E-Paper</h1>
      <p class="login-subtitle">员工与项目全生命周期管理系统</p>

      <form @submit.prevent="handleSubmit">
        <!-- 用户名 -->
        <div class="form-group">
          <label class="form-label">
            {{ isLogin ? '用户名 / 邮箱' : '用户名' }}
          </label>
          <input
            type="text"
            class="form-input"
            :placeholder="isLogin ? '请输入用户名或邮箱' : '请输入用户名'"
            v-model="formData.username"
            required
          />
        </div>

        <!-- 邮箱（仅注册时显示） -->
        <div v-if="!isLogin" class="form-group">
          <label class="form-label">邮箱</label>
          <input
            type="email"
            class="form-input"
            placeholder="请输入邮箱"
            v-model="formData.email"
            required
          />
        </div>

        <!-- 密码 -->
        <div class="form-group">
          <label class="form-label">密码</label>
          <input
            type="password"
            class="form-input"
            placeholder="请输入密码"
            v-model="formData.password"
            required
          />
        </div>

        <!-- 确认密码（仅注册时显示） -->
        <div v-if="!isLogin" class="form-group">
          <label class="form-label">确认密码</label>
          <input
            type="password"
            class="form-input"
            placeholder="请再次输入密码"
            v-model="formData.confirmPassword"
            required
          />
        </div>

        <!-- 验证码（仅登录时显示） -->
        <div v-if="isLogin" class="form-group">
          <label class="form-label">验证码</label>
          <div class="captcha-row">
            <input
              type="text"
              class="form-input captcha-input"
              placeholder="请输入验证码"
              v-model="formData.captchaCode"
              required
              maxlength="4"
            />
            <div
              class="captcha-image"
              @click="loadCaptcha"
              title="点击刷新验证码"
              v-html="captchaSvg"
            ></div>
          </div>
        </div>

        <!-- 错误提示 -->
        <p v-if="error" class="form-error">{{ error }}</p>

        <!-- 提交按钮 -->
        <button
          type="submit"
          class="btn btn-primary btn-lg"
          style="width: 100%; margin-top: 16px"
          :disabled="loading"
        >
          {{ loading ? '处理中...' : isLogin ? '登 录' : '注 册' }}
        </button>
      </form>

      <!-- 切换登录/注册 -->
      <p
        style="
          text-align: center;
          margin-top: 24px;
          color: var(--text-secondary);
        "
      >
        {{ isLogin ? '还没有账号？' : '已有账号？' }}
        <button
          type="button"
          @click="toggleMode"
          :style="{
            background: 'none',
            border: 'none',
            color: 'var(--primary)',
            cursor: 'pointer',
            marginLeft: '4px',
          }"
        >
          {{ isLogin ? '立即注册' : '去登录' }}
        </button>
      </p>
    </div>
  </div>
</template>

<script setup>
/**
 * 登录/注册页面
 * 支持登录验证码功能（使用 Redis 存储）
 */
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { authApi } from '@/api/auth'

const router = useRouter()
const authStore = useAuthStore()

// 是否为登录模式
const isLogin = ref(true)

// 表单数据
const formData = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  captchaCode: '',
})

// 验证码相关
const captchaSvg = ref('')
const captchaId = ref('')

// 错误信息
const error = ref('')

// 加载状态
const loading = ref(false)

/**
 * 加载验证码
 */
async function loadCaptcha() {
  try {
    const response = await authApi.getCaptcha()
    captchaSvg.value = response.data.svg
    captchaId.value = response.data.captchaId
    formData.captchaCode = ''
  } catch (err) {
    console.error('获取验证码失败:', err)
  }
}

/**
 * 切换登录/注册模式
 */
function toggleMode() {
  isLogin.value = !isLogin.value
  error.value = ''
  // 切换到登录模式时加载验证码
  if (isLogin.value) {
    loadCaptcha()
  }
}

/**
 * 表单提交处理
 */
async function handleSubmit() {
  error.value = ''
  loading.value = true

  try {
    if (isLogin.value) {
      // 登录前端校验
      if (!formData.captchaCode) {
        error.value = '请输入验证码'
        loading.value = false
        return
      }

      // 登录（携带验证码）
      await authStore.login(
        formData.username,
        formData.password,
        captchaId.value,
        formData.captchaCode
      )
      router.push('/dashboard')
    } else {
      // 注册验证
      if (formData.username.length < 3 || formData.username.length > 30) {
        error.value = '用户名长度需在 3-30 个字符之间'
        loading.value = false
        return
      }
      if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
        error.value = '用户名只能包含字母、数字和下划线'
        loading.value = false
        return
      }
      if (formData.password !== formData.confirmPassword) {
        error.value = '两次输入的密码不一致'
        loading.value = false
        return
      }
      if (formData.password.length < 6) {
        error.value = '密码长度不能少于 6 个字符'
        loading.value = false
        return
      }
      if (formData.email.length < 11 || formData.email.length > 100) {
        error.value = '邮箱长度需在 11-100 个字符之间'
        loading.value = false
        return
      }

      // 注册
      await authStore.register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
      })

      // 注册成功后切换到登录
      isLogin.value = true
      formData.email = ''
      formData.password = ''
      formData.confirmPassword = ''
      error.value = ''
      alert('注册成功，请登录')
      loadCaptcha()
    }
  } catch (err) {
    error.value = err.message || '操作失败，请重试'
    // 登录失败时刷新验证码
    if (isLogin.value) {
      loadCaptcha()
    }
  } finally {
    loading.value = false
  }
}

// 页面加载时获取验证码
onMounted(() => {
  loadCaptcha()
})
</script>
