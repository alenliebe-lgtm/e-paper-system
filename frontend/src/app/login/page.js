'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function LoginPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { login, register } = useAuth();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isLogin) {
                await login(formData.username, formData.password);
                router.push('/dashboard');
            } else {
                // 注册验证
                if (formData.password !== formData.confirmPassword) {
                    setError('两次输入的密码不一致');
                    setLoading(false);
                    return;
                }
                if (formData.password.length < 6) {
                    setError('密码长度不能少于 6 个字符');
                    setLoading(false);
                    return;
                }
                if (formData.email.length < 11 || formData.email.length > 100) {
                    setError('邮箱长度需在 11-100 个字符之间');
                    setLoading(false);
                    return;
                }
                await register({
                    username: formData.username,
                    email: formData.email,
                    password: formData.password,
                });
                // 注册成功后切换到登录
                setIsLogin(true);
                setFormData({ username: formData.username, email: '', password: '', confirmPassword: '' });
                setError('');
                alert('注册成功，请登录');
            }
        } catch (err) {
            setError(err.message || '操作失败，请重试');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <h1 className="login-title">E-Paper</h1>
                <p className="login-subtitle">员工与项目全生命周期管理系统</p>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">
                            {isLogin ? '用户名 / 邮箱' : '用户名'}
                        </label>
                        <input
                            type="text"
                            name="username"
                            className="form-input"
                            placeholder={isLogin ? '请输入用户名或邮箱' : '请输入用户名'}
                            value={formData.username}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    {!isLogin && (
                        <div className="form-group">
                            <label className="form-label">邮箱</label>
                            <input
                                type="email"
                                name="email"
                                className="form-input"
                                placeholder="请输入邮箱"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label">密码</label>
                        <input
                            type="password"
                            name="password"
                            className="form-input"
                            placeholder="请输入密码"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    {!isLogin && (
                        <div className="form-group">
                            <label className="form-label">确认密码</label>
                            <input
                                type="password"
                                name="confirmPassword"
                                className="form-input"
                                placeholder="请再次输入密码"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    )}

                    {error && <p className="form-error">{error}</p>}

                    <button
                        type="submit"
                        className="btn btn-primary btn-lg"
                        style={{ width: '100%', marginTop: '16px' }}
                        disabled={loading}
                    >
                        {loading ? '处理中...' : (isLogin ? '登 录' : '注 册')}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '24px', color: 'var(--text-secondary)' }}>
                    {isLogin ? '还没有账号？' : '已有账号？'}
                    <button
                        type="button"
                        onClick={() => {
                            setIsLogin(!isLogin);
                            setError('');
                        }}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--primary)',
                            cursor: 'pointer',
                            marginLeft: '4px',
                        }}
                    >
                        {isLogin ? '立即注册' : '去登录'}
                    </button>
                </p>
            </div>
        </div>
    );
}
