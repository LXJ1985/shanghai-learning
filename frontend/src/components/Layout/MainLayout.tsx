import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Menu, Typography } from 'antd'
import {
  BookOutlined,
  FileTextOutlined,
  HistoryOutlined,
  SettingOutlined,
  LogoutOutlined,
  LineChartOutlined,
  TeamOutlined,
  FileSearchOutlined,
  ApartmentOutlined,
  BulbOutlined,
  RobotOutlined,
  ExperimentOutlined,
  FireOutlined,
  FunctionOutlined,
  PlaySquareOutlined,
  ReadOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons'
import { useAuthStore } from '../../store/authStore'

const { Text } = Typography

export default function MainLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { userInfo, logout } = useAuthStore()
  const isAdmin = userInfo?.role === 2

  const isAdminPath = location.pathname.startsWith('/admin')
  const isDemoPath = ['/algorithm', '/physics', '/chemistry', '/math', '/poetry', '/biology', '/geography'].includes(location.pathname)

  const menuItems = [
    { key: '/subjects', icon: <BookOutlined />, label: '学科' },
    { key: '/practice', icon: <FileTextOutlined />, label: '练习' },
    {
      key: 'demo-group',
      icon: <PlaySquareOutlined />,
      label: '演示中心',
      children: [
        { key: '/algorithm', icon: <RobotOutlined />, label: '算法教学' },
        { key: '/physics', icon: <ExperimentOutlined />, label: '物理实验' },
        { key: '/chemistry', icon: <FireOutlined />, label: '化学实验' },
        { key: '/math', icon: <FunctionOutlined />, label: '数学函数' },
        { key: '/poetry', icon: <ReadOutlined />, label: '诗词动画' },
        { key: '/biology', icon: <ExperimentOutlined />, label: '生物知识' },
        { key: '/geography', icon: <EnvironmentOutlined />, label: '地理知识' },
      ],
    },
    { key: '/exam', icon: <FileTextOutlined />, label: '考试' },
    { key: '/wrong', icon: <HistoryOutlined />, label: '错题' },
    { key: '/progress', icon: <LineChartOutlined />, label: '进度' },
    ...(isAdmin
      ? [
          { key: '/divider', type: 'divider' as const },
          { key: '/parent', icon: <TeamOutlined />, label: '孩子' },
          {
            key: 'admin-group',
            icon: <SettingOutlined />,
            label: '管理',
            children: [
              { key: '/admin', icon: <FileTextOutlined />, label: '题目库' },
              { key: '/admin/chapters', icon: <ApartmentOutlined />, label: '章节' },
              { key: '/admin/knowledges', icon: <BulbOutlined />, label: '知识点' },
            ],
          },
          { key: '/admin/logs', icon: <FileSearchOutlined />, label: '日志' },
        ]
      : []),
  ]

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: 'var(--bg-base)',
    }}>
      {/* --- Sidebar --- */}
      <aside style={{
        width: 180,
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        paddingTop: 20,
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 100,
      }}>
        {/* Logo mark */}
        <div style={{
          padding: '0 16px 24px',
          borderBottom: '1px solid var(--border)',
          marginBottom: 16,
        }}>
          <div style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 18,
            fontWeight: 700,
            color: 'var(--accent)',
            textAlign: 'center',
            lineHeight: 1,
          }}>
            上海学习系统
          </div>
        </div>

        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          defaultOpenKeys={[...(isAdminPath ? ['admin-group'] : []), ...(isDemoPath ? ['demo-group'] : [])]}
          items={menuItems}
          onClick={({ key }) => {
            if (key !== '/divider') navigate(key)
          }}
          style={{
            border: 'none',
            background: 'transparent',
            flex: 1,
          }}
        />

        {/* Logout at bottom */}
        <div style={{
          padding: '16px 0',
          borderTop: '1px solid var(--border)',
          textAlign: 'center',
        }}>
          <LogoutOutlined
            style={{ fontSize: 18, color: 'var(--ink-tertiary)', cursor: 'pointer' }}
            onClick={handleLogout}
          />
        </div>
      </aside>

      {/* --- Main area --- */}
      <div style={{
        flex: 1,
        marginLeft: 180,
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Top bar */}
        <header style={{
          height: 56,
          padding: '0 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-surface)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}>
          <div style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 13,
            color: 'var(--ink-tertiary)',
            letterSpacing: '0.05em',
          }}>
            上海学生学习系统
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Text style={{
              fontSize: 13,
              color: 'var(--ink-secondary)',
            }}>
              {userInfo?.nickname || userInfo?.username}
            </Text>
            <div style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: 'var(--accent-soft)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-serif)',
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--accent)',
            }}>
              {(userInfo?.nickname || userInfo?.username || '?')[0]}
            </div>
          </div>
        </header>

        {/* Content */}
        <main style={{
          flex: 1,
          padding: '32px 40px',
          maxWidth: 1100,
        }}>
          <div className="page-enter">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
