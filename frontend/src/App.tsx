import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import MainLayout from './components/Layout/MainLayout'
import Login from './pages/auth/Login'
import SubjectList from './pages/student/SubjectList'
import KnowledgeDetail from './pages/student/KnowledgeDetail'
import Practice from './pages/student/Practice'
import ExamCreate from './pages/student/ExamCreate'
import ExamTaking from './pages/student/ExamTaking'
import ExamResult from './pages/student/ExamResult'
import WrongQuestions from './pages/student/WrongQuestions'
import StudentProgress from './pages/student/StudentProgress'
import AlgorithmTeaching from './pages/student/AlgorithmTeaching'
import PhysicsSimulation from './pages/student/PhysicsSimulation'
import ChemistryLab from './pages/student/ChemistryLab'
import MathFunctions from './pages/student/MathFunctions'
import PoetryDemo from './pages/student/PoetryDemo'
import BiologyDemo from './pages/student/BiologyDemo'
import GeographyDemo from './pages/student/GeographyDemo'
import AdminQuestions from './pages/admin/AdminQuestions'
import AdminChapters from './pages/admin/AdminChapters'
import AdminKnowledge from './pages/admin/AdminKnowledge'
import ParentDashboard from './pages/admin/ParentDashboard'
import OperationLogs from './pages/admin/OperationLogs'
import { useAuthStore } from './store/authStore'

function App() {
  const { loadAuth, isLoggedIn } = useAuthStore()

  useEffect(() => {
    loadAuth()
  }, [])

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#C45D3E',
          colorSuccess: '#4A7C59',
          colorWarning: '#D4A853',
          colorError: '#C44D3E',
          colorTextBase: '#1A1A1A',
          colorBgBase: '#F5F0EB',
          colorBorder: '#E5DED6',
          colorBorderSecondary: '#EDE7E0',
          fontFamily: "'DM Sans', 'PingFang SC', 'Microsoft YaHei', sans-serif",
          borderRadius: 4,
          borderRadiusLG: 6,
          colorLink: '#C45D3E',
          colorLinkHover: '#A84D32',
          fontSize: 14,
          fontSizeHeading1: 36,
          fontSizeHeading2: 28,
          fontSizeHeading3: 22,
          fontSizeHeading4: 18,
          fontSizeHeading5: 15,
          lineHeight: 1.6,
          controlHeight: 38,
          boxShadow: '0 1px 2px rgba(26, 26, 26, 0.04)',
          boxShadowSecondary: '0 4px 12px rgba(26, 26, 26, 0.06)',
        },
        components: {
          Layout: {
            headerBg: 'transparent',
            siderBg: 'transparent',
            bodyBg: '#F5F0EB',
          },
          Menu: {
            itemBg: 'transparent',
            itemColor: '#6B6560',
            itemSelectedColor: '#1A1A1A',
            itemHoverColor: '#C45D3E',
            itemSelectedBg: 'rgba(196, 93, 62, 0.06)',
            itemHoverBg: 'rgba(196, 93, 62, 0.04)',
            itemBorderRadius: 4,
            itemMarginInline: 8,
            iconSize: 16,
            fontSize: 13,
          },
          Card: {
            colorBgContainer: '#FEFCF9',
            colorBorder: '#E5DED6',
            borderRadiusLG: 6,
            paddingLG: 24,
          },
          Table: {
            headerBg: '#EDE7E0',
            borderColor: '#E5DED6',
          },
          Button: {
            primaryShadow: 'none',
            defaultShadow: 'none',
            dangerShadow: 'none',
          },
          Input: {
            activeShadow: '0 0 0 2px rgba(196, 93, 62, 0.08)',
          },
          Select: {
            optionSelectedBg: 'rgba(196, 93, 62, 0.06)',
          },
          Tag: {
            defaultBg: '#EDE7E0',
            defaultColor: '#6B6560',
          },
        },
      }}
    >
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={isLoggedIn ? <MainLayout /> : <Navigate to="/login" />} >
            <Route index element={<Navigate to="/subjects" replace />} />
            <Route path="subjects" element={<SubjectList />} />
            <Route path="knowledge/:id" element={<KnowledgeDetail />} />
            <Route path="practice" element={<Practice />} />
            <Route path="algorithm" element={<AlgorithmTeaching />} />
            <Route path="physics" element={<PhysicsSimulation />} />
            <Route path="chemistry" element={<ChemistryLab />} />
            <Route path="math" element={<MathFunctions />} />
            <Route path="poetry" element={<PoetryDemo />} />
            <Route path="biology" element={<BiologyDemo />} />
            <Route path="geography" element={<GeographyDemo />} />
            <Route path="exam" element={<ExamCreate />} />
            <Route path="exam/:examId/take" element={<ExamTaking />} />
            <Route path="exam/result/:recordId" element={<ExamResult />} />
            <Route path="wrong" element={<WrongQuestions />} />
            <Route path="progress" element={<StudentProgress />} />
            <Route path="admin" element={<AdminQuestions />} />
            <Route path="admin/chapters" element={<AdminChapters />} />
            <Route path="admin/knowledges" element={<AdminKnowledge />} />
            <Route path="admin/logs" element={<OperationLogs />} />
            <Route path="parent" element={<ParentDashboard />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  )
}

export default App
