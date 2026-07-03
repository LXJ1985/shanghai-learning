import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Form, Input, Button, Typography, message, Radio } from 'antd'
import { loginApi, registerApi } from '../../api/auth'
import { useAuthStore } from '../../store/authStore'

const { Text } = Typography

export default function Login() {
  const [isRegister, setIsRegister] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()

  const handleLogin = async (values: { username: string; password: string }) => {
    setLoading(true)
    try {
      const res = await loginApi(values)
      setAuth(res.data.token, res.data.userInfo)
      message.success('欢迎回来')
      navigate('/subjects')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (values: {
    username: string
    password: string
    nickname: string
    role: number
  }) => {
    setLoading(true)
    try {
      await registerApi(values)
      message.success('注册成功，请登录')
      setIsRegister(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      background: 'var(--bg-base)',
    }}>
      {/* Left: editorial panel */}
      <div style={{
        padding: '80px 64px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        borderRight: '1px solid var(--border)',
      }}>
        <div style={{ marginBottom: 48 }}>
          <div style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 13,
            color: 'var(--ink-tertiary)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: 24,
          }}>
            Shanghai Learning
          </div>
          <h1 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 42,
            fontWeight: 700,
            lineHeight: 1.2,
            color: 'var(--ink-primary)',
            marginBottom: 16,
          }}>
            上海学生<br />学习系统
          </h1>
          <p style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 15,
            color: 'var(--ink-secondary)',
            lineHeight: 1.7,
            maxWidth: 360,
          }}>
            覆盖沪教版全学科，从知识点浏览到智能组卷，
            让每一次练习都有迹可循。
          </p>
        </div>

        <div style={{
          fontSize: 11,
          color: 'var(--ink-tertiary)',
          letterSpacing: '0.05em',
        }}>
          v1.0 &middot; 2026
        </div>
      </div>

      {/* Right: form panel */}
      <div style={{
        padding: '80px 64px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        background: 'var(--bg-surface)',
      }}>
        <div style={{ maxWidth: 340 }}>
          <div style={{ marginBottom: 32 }}>
            <h2 style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 24,
              fontWeight: 500,
              marginBottom: 8,
            }}>
              {isRegister ? '创建账号' : '登录'}
            </h2>
            <Text style={{ color: 'var(--ink-tertiary)', fontSize: 13 }}>
              {isRegister ? '填写以下信息完成注册' : '输入你的账号信息'}
            </Text>
          </div>

          <Form
            onFinish={isRegister ? handleRegister : handleLogin}
            autoComplete="off"
            layout="vertical"
            size="large"
          >
            <Form.Item
              name="username"
              label={<span style={{ fontSize: 12, letterSpacing: '0.05em' }}>用户名</span>}
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input placeholder="输入用户名" />
            </Form.Item>
            <Form.Item
              name="password"
              label={<span style={{ fontSize: 12, letterSpacing: '0.05em' }}>密码</span>}
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password placeholder="输入密码" />
            </Form.Item>
            {isRegister && (
              <>
                <Form.Item
                  name="nickname"
                  label={<span style={{ fontSize: 12, letterSpacing: '0.05em' }}>昵称</span>}
                  rules={[{ required: true, message: '请输入昵称' }]}
                >
                  <Input placeholder="你的昵称" />
                </Form.Item>
                <Form.Item
                  name="role"
                  initialValue={1}
                  label={<span style={{ fontSize: 12, letterSpacing: '0.05em' }}>身份</span>}
                >
                  <Radio.Group>
                    <Radio value={1}>学生</Radio>
                    <Radio value={2}>家长/管理员</Radio>
                  </Radio.Group>
                </Form.Item>
              </>
            )}
            <Form.Item style={{ marginTop: 24 }}>
              <Button type="primary" htmlType="submit" loading={loading} block>
                {isRegister ? '注册' : '登录'}
              </Button>
            </Form.Item>
          </Form>

          <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
            <Link
              to="#"
              onClick={() => setIsRegister(!isRegister)}
              style={{
                fontSize: 13,
                color: 'var(--accent)',
                textDecoration: 'none',
              }}
            >
              {isRegister ? '已有账号？去登录' : '没有账号？去注册'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
