import { useEffect, useState } from 'react'
import { Table, Select, Input, DatePicker, Button, Tag, Space, message } from 'antd'
import { DownloadOutlined, SearchOutlined } from '@ant-design/icons'
import { getOperationLogsApi, getLogModulesApi, exportLogsApi } from '../../api/operationLog'
import type { OperationLogInfo } from '../../api/operationLog'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker

export default function OperationLogs() {
  const [logs, setLogs] = useState<OperationLogInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [modules, setModules] = useState<string[]>([])
  const [selectedModule, setSelectedModule] = useState<string>()
  const [username, setUsername] = useState('')
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    getLogModulesApi().then((res) => setModules(res.data)).catch(() => {})
  }, [])

  const loadData = () => {
    setLoading(true)
    const params: Record<string, unknown> = { page, size: 20 }
    if (selectedModule) params.module = selectedModule
    if (username) params.username = username
    if (dateRange) {
      params.startTime = dateRange[0].format('YYYY-MM-DD HH:mm:ss')
      params.endTime = dateRange[1].format('YYYY-MM-DD HH:mm:ss')
    }
    getOperationLogsApi(params as Record<string, string>)
      .then((res) => {
        setLogs(res.data.records)
        setTotal(res.data.total)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadData()
  }, [page, selectedModule])

  const handleSearch = () => {
    setPage(1)
    loadData()
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const params: Record<string, string> = {}
      if (selectedModule) params.module = selectedModule
      if (username) params.username = username
      if (dateRange) {
        params.startTime = dateRange[0].format('YYYY-MM-DD HH:mm:ss')
        params.endTime = dateRange[1].format('YYYY-MM-DD HH:mm:ss')
      }
      const res = await exportLogsApi(params)
      const blob = new Blob([res as unknown as BlobPart], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `操作日志_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
      message.success('导出成功')
    } catch {
      message.error('导出失败')
    } finally {
      setExporting(false)
    }
  }

  const httpMethodColor: Record<string, string> = {
    GET: '#4A7C59',
    POST: '#C45D3E',
    PUT: '#D4A853',
    DELETE: '#C44D3E',
  }

  const columns = [
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 170,
      render: (v: string) => (
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--ink-secondary)' }}>
          {v ? dayjs(v).format('MM-DD HH:mm:ss') : '-'}
        </span>
      ),
    },
    {
      title: '操作人',
      dataIndex: 'username',
      key: 'username',
      width: 90,
      render: (v: string) => (
        <span style={{ fontWeight: 500 }}>{v || '-'}</span>
      ),
    },
    {
      title: '模块',
      dataIndex: 'module',
      key: 'module',
      width: 100,
      render: (v: string) => (
        <Tag style={{
          background: 'var(--accent-soft)',
          color: 'var(--accent)',
          border: 'none',
          fontSize: 11,
          fontWeight: 500,
        }}>
          {v}
        </Tag>
      ),
    },
    {
      title: '操作',
      dataIndex: 'operation',
      key: 'operation',
      width: 120,
    },
    {
      title: '方法',
      dataIndex: 'requestMethod',
      key: 'requestMethod',
      width: 70,
      render: (v: string) => (
        <span style={{
          fontFamily: 'monospace',
          fontSize: 11,
          fontWeight: 600,
          color: httpMethodColor[v] || 'var(--ink-secondary)',
        }}>
          {v}
        </span>
      ),
    },
    {
      title: 'URL',
      dataIndex: 'requestUrl',
      key: 'requestUrl',
      ellipsis: true,
      render: (v: string) => (
        <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--ink-tertiary)' }}>
          {v}
        </span>
      ),
    },
    {
      title: '耗时',
      dataIndex: 'duration',
      key: 'duration',
      width: 80,
      render: (v: number) => (
        <span style={{
          fontFamily: 'monospace',
          fontSize: 12,
          color: v > 1000 ? '#C44D3E' : v > 500 ? '#D4A853' : 'var(--ink-secondary)',
        }}>
          {v}ms
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 60,
      render: (v: number) => (
        <span style={{
          fontSize: 12,
          fontWeight: 500,
          color: v === 1 ? 'var(--sage)' : '#C44D3E',
        }}>
          {v === 1 ? '成功' : '失败'}
        </span>
      ),
    },
    {
      title: 'IP',
      dataIndex: 'ip',
      key: 'ip',
      width: 120,
      render: (v: string) => (
        <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--ink-tertiary)' }}>
          {v || '-'}
        </span>
      ),
    },
  ]

  return (
    <div>
      {/* Page header - editorial style */}
      <div style={{ marginBottom: 40 }}>
        <div style={{
          fontSize: 11,
          color: 'var(--ink-tertiary)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          marginBottom: 8,
        }}>
          System Audit
        </div>
        <h2 style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 28,
          fontWeight: 600,
          color: 'var(--ink-primary)',
          margin: 0,
        }}>
          操作日志
        </h2>
        <p style={{
          fontSize: 13,
          color: 'var(--ink-tertiary)',
          marginTop: 8,
          fontStyle: 'italic',
        }}>
          记录系统关键操作，追踪异常行为
        </p>
      </div>

      {/* Filter bar */}
      <div style={{
        display: 'flex',
        gap: 10,
        marginBottom: 20,
        flexWrap: 'wrap',
        alignItems: 'center',
      }}>
        <Select
          placeholder="模块"
          style={{ width: 130 }}
          allowClear
          value={selectedModule}
          onChange={(v) => { setSelectedModule(v); setPage(1) }}
          options={modules.map((m) => ({ label: m, value: m }))}
        />
        <Input
          placeholder="操作人"
          style={{ width: 120 }}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onPressEnter={handleSearch}
        />
        <RangePicker
          showTime
          format="MM-DD HH:mm"
          value={dateRange}
          onChange={(v) => setDateRange(v as [dayjs.Dayjs, dayjs.Dayjs] | null)}
          style={{ width: 280 }}
        />
        <Button icon={<SearchOutlined />} onClick={handleSearch}>
          查询
        </Button>
        <div style={{ flex: 1 }} />
        <Button icon={<DownloadOutlined />} onClick={handleExport} loading={exporting}>
          导出
        </Button>
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
          dataSource={logs}
          loading={loading}
          size="small"
          pagination={{
            current: page,
            total,
            pageSize: 20,
            onChange: setPage,
            showTotal: (t) => `共 ${t} 条`,
            size: 'small',
          }}
        />
      </div>
    </div>
  )
}
