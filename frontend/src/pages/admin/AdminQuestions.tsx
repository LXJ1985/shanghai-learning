import { useEffect, useState } from 'react'
import {
  Table, Button, Select, Input, Space, Upload, message,
  Modal, Form, InputNumber, Popconfirm, Typography, Dropdown,
} from 'antd'
import { UploadOutlined, PlusOutlined, DeleteOutlined, EditOutlined, DownloadOutlined } from '@ant-design/icons'
import {
  getQuestionsApi, createQuestionApi, updateQuestionApi,
  deleteQuestionApi, importQuestionsApi, downloadTemplateApi,
} from '../../api/admin'
import { getSubjectsApi } from '../../api/study'
import type { QuestionInfo, SubjectInfo } from '../../types'

const { Text } = Typography
const { TextArea } = Input
const { Option } = Select

export default function AdminQuestions() {
  const [questions, setQuestions] = useState<QuestionInfo[]>([])
  const [subjects, setSubjects] = useState<SubjectInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [keyword, setKeyword] = useState('')
  const [selectedSubject, setSelectedSubject] = useState<number>()
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<QuestionInfo | null>(null)
  const [form] = Form.useForm()

  const loadData = () => {
    setLoading(true)
    getQuestionsApi({ subjectId: selectedSubject, keyword, page, size: 10 })
      .then((res) => {
        setQuestions(res.data.records)
        setTotal(res.data.total)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    getSubjectsApi().then((res) => setSubjects(res.data ?? []))
  }, [])

  useEffect(() => {
    loadData()
  }, [selectedSubject, keyword, page])

  const handleSave = async (values: any) => {
    if (editItem) {
      await updateQuestionApi(editItem.id, values)
      message.success('更新成功')
    } else {
      await createQuestionApi(values)
      message.success('创建成功')
    }
    setModalOpen(false)
    form.resetFields()
    setEditItem(null)
    loadData()
  }

  const handleDelete = async (id: number) => {
    await deleteQuestionApi(id)
    message.success('删除成功')
    loadData()
  }

  const handleImport = async (file: File) => {
    try {
      const res = await importQuestionsApi(file, selectedSubject)
      message.success(`导入成功 ${res.data.success} 题，失败 ${res.data.fail} 题`)
      loadData()
    } catch (e) {
      message.error('导入失败')
    }
    return false
  }

  const handleDownloadTemplate = async (format: 'txt' | 'csv' | 'xlsx') => {
    try {
      const res = await downloadTemplateApi(format)
      const mimeMap: Record<string, string> = {
        txt: 'text/plain;charset=utf-8',
        csv: 'text/csv;charset=utf-8',
        xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }
      const extMap: Record<string, string> = { txt: 'txt', csv: 'csv', xlsx: 'xlsx' }
      const blob = new Blob([res as any], { type: mimeMap[format] })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `题目导入模板.${extMap[format]}`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      message.error('下载模板失败')
    }
  }

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 60,
      render: (id: number) => (
        <Text style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-tertiary)' }}>
          {id}
        </Text>
      ),
    },
    {
      title: '题目内容',
      dataIndex: 'content',
      ellipsis: true,
      render: (text: string) => (
        <Text style={{ fontSize: 14, fontFamily: 'var(--font-serif)' }}>
          {text}
        </Text>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      width: 90,
      render: (t: number) => {
        const map: Record<number, string> = { 1: '选择', 2: '填空', 3: '解答', 4: '判断', 5: '简答', 6: '作文', 7: '综合' }
        return <Text style={{ fontSize: 12 }}>{map[t] || t}</Text>
      },
    },
    {
      title: '难度',
      dataIndex: 'difficulty',
      width: 90,
      render: (d: number) => (
        <span style={{ fontSize: 12, color: 'var(--ink-tertiary)' }}>
          {'●'.repeat(d)}{'○'.repeat(5 - d)}
        </span>
      ),
    },
    {
      title: '分值',
      dataIndex: 'score',
      width: 70,
      render: (s: number) => (
        <Text style={{ fontFamily: 'var(--font-serif)', fontSize: 13 }}>{s}</Text>
      ),
    },
    {
      title: '',
      width: 120,
      render: (_: any, record: QuestionInfo) => (
        <Space size={4}>
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setEditItem(record)
              form.setFieldsValue(record)
              setModalOpen(true)
            }}
            style={{ color: 'var(--ink-secondary)', fontSize: 12 }}
          >
            编辑
          </Button>
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)}>
            <Button type="text" size="small" danger icon={<DeleteOutlined />} style={{ fontSize: 12 }}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{
          fontSize: 11,
          color: 'var(--ink-tertiary)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          marginBottom: 8,
        }}>
          题库管理
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
        }}>
          <h2 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 28,
            fontWeight: 600,
            color: 'var(--ink-primary)',
            margin: 0,
          }}>
            题目库
          </h2>
          <Text style={{ fontSize: 13, color: 'var(--ink-tertiary)' }}>
            共 {total} 题
          </Text>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{
        display: 'flex',
        gap: 10,
        marginBottom: 20,
        flexWrap: 'wrap',
        alignItems: 'center',
      }}>
        <Select
          placeholder="学科"
          style={{ width: 120 }}
          allowClear
          onChange={(v) => { setSelectedSubject(v); setPage(1) }}
          options={subjects.map((s) => ({ label: s.name, value: s.id }))}
        />
        <Input.Search
          placeholder="搜索题目..."
          style={{ width: 200 }}
          onSearch={(v) => { setKeyword(v); setPage(1) }}
        />
        <div style={{ flex: 1 }} />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => { setEditItem(null); form.resetFields(); setModalOpen(true) }}
        >
          新增
        </Button>
        <Upload beforeUpload={handleImport} showUploadList={false} accept=".txt,.csv,.xlsx">
          <Button icon={<UploadOutlined />}>导入</Button>
        </Upload>
        <Dropdown menu={{
          items: [
            { key: 'txt', label: 'TXT 格式' },
            { key: 'csv', label: 'CSV 格式' },
            { key: 'xlsx', label: 'Excel 格式' },
          ],
          onClick: ({ key }) => handleDownloadTemplate(key as 'txt' | 'csv' | 'xlsx'),
        }}>
          <Button icon={<DownloadOutlined />} style={{ fontSize: 12 }}>
            下载模板
          </Button>
        </Dropdown>
      </div>

      {/* Table */}
      <div style={{
        background: 'var(--bg-surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
        overflow: 'hidden',
      }}>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={questions}
          loading={loading}
          pagination={{ current: page, total, onChange: setPage, size: 'small' }}
        />
      </div>

      {/* Modal */}
      <Modal
        title={editItem ? '编辑题目' : '新增题目'}
        open={modalOpen}
        onCancel={() => { setModalOpen(false); setEditItem(null) }}
        onOk={() => form.submit()}
        width={560}
      >
        <Form form={form} onFinish={handleSave} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="subjectId" label="学科" rules={[{ required: true }]}>
            <Select options={subjects.map((s) => ({ label: s.name, value: s.id }))} />
          </Form.Item>
          <Form.Item name="type" label="题型" rules={[{ required: true }]}>
            <Select>
              <Option value={1}>选择题</Option>
              <Option value={2}>填空题</Option>
              <Option value={3}>解答题</Option>
              <Option value={4}>判断题</Option>
              <Option value={5}>简答题</Option>
            </Select>
          </Form.Item>
          <Form.Item name="content" label="题目内容" rules={[{ required: true }]}>
            <TextArea rows={3} />
          </Form.Item>
          <Form.Item name="options" label="选项(JSON数组)">
            <TextArea rows={2} placeholder='["A. xxx", "B. xxx", "C. xxx", "D. xxx"]' />
          </Form.Item>
          <Form.Item name="answer" label="答案" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="analysis" label="解析">
            <TextArea rows={2} />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item name="difficulty" label="难度(1-5)" rules={[{ required: true }]}>
              <InputNumber min={1} max={5} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="score" label="分值" rules={[{ required: true }]}>
              <InputNumber min={1} max={100} style={{ width: '100%' }} />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  )
}
