import { useEffect, useState } from 'react'
import { Table, Button, Select, message, Popconfirm, Typography } from 'antd'
import { getWrongQuestionsApi, removeWrongQuestionApi } from '../../api/wrong'
import { getSubjectsApi } from '../../api/study'
import type { WrongQuestion, SubjectInfo } from '../../types'

const { Text } = Typography

export default function WrongQuestions() {
  const [data, setData] = useState<WrongQuestion[]>([])
  const [subjects, setSubjects] = useState<SubjectInfo[]>([])
  const [selectedSubject, setSelectedSubject] = useState<number>()
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)

  const loadData = () => {
    setLoading(true)
    getWrongQuestionsApi({ subjectId: selectedSubject, page, size: 10 })
      .then((res) => {
        setData(res.data.records)
        setTotal(res.data.total)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    getSubjectsApi().then((res) => setSubjects(res.data))
  }, [])

  useEffect(() => {
    loadData()
  }, [selectedSubject, page])

  const handleRemove = async (id: number) => {
    await removeWrongQuestionApi(id)
    message.success('已移除')
    loadData()
  }

  const columns = [
    {
      title: '题目',
      dataIndex: ['question', 'content'],
      ellipsis: true,
      render: (text: string) => (
        <Text style={{ fontSize: 14, fontFamily: 'var(--font-serif)' }}>
          {text}
        </Text>
      ),
    },
    {
      title: '我的答案',
      dataIndex: 'wrongAnswer',
      width: 120,
      render: (text: string) => (
        <Text style={{ color: 'var(--accent)', fontSize: 13 }}>{text}</Text>
      ),
    },
    {
      title: '正确答案',
      dataIndex: 'correctAnswer',
      width: 120,
      render: (text: string) => (
        <Text style={{ color: 'var(--sage)', fontSize: 13 }}>{text}</Text>
      ),
    },
    {
      title: '错误次数',
      dataIndex: 'wrongCount',
      width: 90,
      render: (count: number) => (
        <span style={{
          fontFamily: 'var(--font-serif)',
          fontWeight: 600,
          color: count >= 3 ? 'var(--accent)' : 'var(--ink-secondary)',
        }}>
          {count}
        </span>
      ),
    },
    {
      title: '',
      width: 80,
      render: (_: any, record: WrongQuestion) => (
        <Popconfirm
          title="确定移除？"
          onConfirm={() => handleRemove(record.id)}
          okText="移除"
          cancelText="取消"
        >
          <Button
            type="text"
            size="small"
            style={{ color: 'var(--ink-tertiary)', fontSize: 12 }}
          >
            移除
          </Button>
        </Popconfirm>
      ),
    },
  ]

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
          错题本
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
            回顾错误，查漏补缺
          </h2>
          <Select
            placeholder="按学科筛选"
            style={{ width: 140 }}
            allowClear
            onChange={(v) => { setSelectedSubject(v); setPage(1) }}
            options={subjects.map((s) => ({ label: s.name, value: s.id }))}
          />
        </div>
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
          dataSource={data}
          loading={loading}
          pagination={{
            current: page,
            total,
            onChange: setPage,
            size: 'small',
            style: { padding: '0 16px' },
          }}
        />
      </div>

      {total === 0 && !loading && (
        <div style={{
          textAlign: 'center',
          padding: '40px 0',
          color: 'var(--ink-tertiary)',
          fontStyle: 'italic',
          fontSize: 14,
        }}>
          还没有错题记录，继续加油
        </div>
      )}
    </div>
  )
}
