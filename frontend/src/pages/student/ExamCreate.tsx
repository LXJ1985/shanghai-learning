import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Form, Select, Input, InputNumber, Button, message, Typography, Card, Descriptions } from 'antd'
import { createExamApi, getExamDetailApi } from '../../api/exam'
import { getSubjectsApi, getGradesApi } from '../../api/study'
import type { SubjectInfo, GradeInfo, ExamInfo } from '../../types'

const { Text } = Typography

export default function ExamCreate() {
  const [subjects, setSubjects] = useState<SubjectInfo[]>([])
  const [grades, setGrades] = useState<GradeInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()
  const [createdExam, setCreatedExam] = useState<ExamInfo | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    getSubjectsApi().then((res) => setSubjects(res.data))
    getGradesApi().then((res) => setGrades(res.data))
  }, [])

  const handleCreate = async (values: any) => {
    setLoading(true)
    try {
      const res = await createExamApi(values)
      message.success('组卷成功')
      // 获取试卷详情
      const examId = res.data.id
      if (examId) {
        const detailRes = await getExamDetailApi(examId)
        const detail = detailRes.data as any
        // 后端返回 {exam, questions} 结构，需要转换
        const exam = detail.exam || detail
        const questions = (detail.questions || []).map((q: any) => ({
          ...q.question,
          score: q.score,
          sortOrder: q.sortOrder,
        }))
        setCreatedExam({
          id: exam.id,
          userId: exam.createdBy,
          title: exam.title,
          subjectId: exam.subjectId,
          totalScore: exam.totalScore,
          timeLimit: exam.duration,
          questions,
          createdAt: exam.createdAt,
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setCreatedExam(null)
    form.resetFields()
  }

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: 40 }}>
        <div style={{
          fontSize: 11,
          color: 'var(--ink-tertiary)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          marginBottom: 8,
        }}>
          智能组卷
        </div>
        <h2 style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 28,
          fontWeight: 600,
          color: 'var(--ink-primary)',
          marginBottom: 8,
        }}>
          {createdExam ? '试卷已生成' : '创建一场测试'}
        </h2>
        <Text style={{ color: 'var(--ink-tertiary)', fontSize: 14 }}>
          {createdExam ? `试卷「${createdExam.title}」已成功创建` : '设定参数，系统自动从题库中抽取匹配的题目'}
        </Text>
      </div>

      {/* 试卷详情 */}
      {createdExam ? (
        <div style={{
          maxWidth: 680,
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: 32,
        }}>
          <Card
            title={createdExam.title}
            extra={<span style={{ fontSize: 12, color: 'var(--ink-tertiary)' }}>共 {createdExam.questions?.length || 0} 题</span>}
            style={{ marginBottom: 16 }}
          >
            <Descriptions column={2} size="small">
              <Descriptions.Item label="总分">{createdExam.totalScore} 分</Descriptions.Item>
              <Descriptions.Item label="时长">{createdExam.timeLimit} 分钟</Descriptions.Item>
              <Descriptions.Item label="创建时间" span={2}>{createdExam.createdAt}</Descriptions.Item>
            </Descriptions>
          </Card>

          {/* 题目列表 */}
          <div style={{ marginBottom: 16 }}>
            {createdExam.questions?.map((q: any, index: number) => (
              <div key={q.id} style={{
                padding: '12px 16px',
                marginBottom: 8,
                background: 'var(--bg-primary)',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border-light)',
              }}>
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>
                  {index + 1}. {q.content}
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink-tertiary)' }}>
                  难度: {'★'.repeat(q.difficulty || 1)}{'☆'.repeat(5 - (q.difficulty || 1))}
                  {q.score && <span style={{ marginLeft: 12 }}>{q.score} 分</span>}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <Button onClick={handleReset} style={{ flex: 1 }}>
              继续组卷
            </Button>
            <Button type="primary" onClick={() => navigate(`/exam/${createdExam.id}/take`)} style={{ flex: 1 }}>
              开始考试
            </Button>
          </div>
        </div>
      ) : (

      /* 表单 */
      <div style={{
        maxWidth: 480,
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: 32,
      }}>
        <Form form={form} onFinish={handleCreate} layout="vertical" size="large"
          initialValues={{ questionCount: 10, timeLimit: 30 }}>
          <Form.Item
            name="title"
            label={<span style={{ fontSize: 12, letterSpacing: '0.05em' }}>试卷标题</span>}
            rules={[{ required: true, message: '请输入标题' }]}
          >
            <Input placeholder="如：数学第14章测试" />
          </Form.Item>
          <Form.Item
            name="subjectId"
            label={<span style={{ fontSize: 12, letterSpacing: '0.05em' }}>学科</span>}
            rules={[{ required: true, message: '请选择学科' }]}
          >
            <Select
              options={subjects.map((s) => ({ label: s.name, value: s.id }))}
              placeholder="选择学科"
            />
          </Form.Item>
          <Form.Item
            name="gradeId"
            label={<span style={{ fontSize: 12, letterSpacing: '0.05em' }}>年级</span>}
            rules={[{ required: true, message: '请选择年级' }]}
          >
            <Select
              options={grades.map((g) => ({ label: g.name, value: g.id }))}
              placeholder="选择年级"
            />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item
              name="questionCount"
              label={<span style={{ fontSize: 12, letterSpacing: '0.05em' }}>题目数量</span>}
              rules={[{ required: true }]}
            >
              <InputNumber min={5} max={50} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              name="timeLimit"
              label={<span style={{ fontSize: 12, letterSpacing: '0.05em' }}>时长(分钟)</span>}
              rules={[{ required: true }]}
            >
              <InputNumber min={10} max={120} style={{ width: '100%' }} />
            </Form.Item>
          </div>
          <Form.Item
            name="difficulty"
            label={<span style={{ fontSize: 12, letterSpacing: '0.05em' }}>难度</span>}
          >
            <Select
              options={[
                { label: '简单', value: 1 },
                { label: '中等', value: 2 },
                { label: '困难', value: 3 },
              ]}
              placeholder="选择难度"
            />
          </Form.Item>
          <Form.Item style={{ marginTop: 8 }}>
            <Button type="primary" htmlType="submit" loading={loading} block>
              生成试卷
            </Button>
          </Form.Item>
        </Form>
      </div>
      )}
    </div>
  )
}
