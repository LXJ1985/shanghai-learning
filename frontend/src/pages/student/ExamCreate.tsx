import { useState, useEffect } from 'react'
import { Form, Select, Input, InputNumber, Button, message, Typography } from 'antd'
import { createExamApi } from '../../api/exam'
import { getSubjectsApi } from '../../api/study'
import type { SubjectInfo } from '../../types'

const { Text } = Typography

export default function ExamCreate() {
  const [subjects, setSubjects] = useState<SubjectInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    getSubjectsApi().then((res) => setSubjects(res.data))
  }, [])

  const handleCreate = async (values: any) => {
    setLoading(true)
    try {
      await createExamApi(values)
      message.success('组卷成功')
    } finally {
      setLoading(false)
    }
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
          创建一场测试
        </h2>
        <Text style={{ color: 'var(--ink-tertiary)', fontSize: 14 }}>
          设定参数，系统自动从题库中抽取匹配的题目
        </Text>
      </div>

      {/* Form */}
      <div style={{
        maxWidth: 480,
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: 32,
      }}>
        <Form form={form} onFinish={handleCreate} layout="vertical" size="large">
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item
              name="questionCount"
              label={<span style={{ fontSize: 12, letterSpacing: '0.05em' }}>题目数量</span>}
              rules={[{ required: true }]}
            >
              <InputNumber min={5} max={50} defaultValue={10} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              name="timeLimit"
              label={<span style={{ fontSize: 12, letterSpacing: '0.05em' }}>时长(分钟)</span>}
              rules={[{ required: true }]}
            >
              <InputNumber min={10} max={120} defaultValue={30} style={{ width: '100%' }} />
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
    </div>
  )
}
