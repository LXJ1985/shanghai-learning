import { useState } from 'react'
import {
  Select, Upload, message, Button, Typography, Dropdown, Alert, Space,
} from 'antd'
import {
  UploadOutlined, DownloadOutlined, FileTextOutlined,
} from '@ant-design/icons'
import {
  importChaptersApi, downloadChapterTemplateApi,
} from '../../api/admin'
import { getSubjectsApi, getGradesApi } from '../../api/study'
import type { SubjectInfo, GradeInfo } from '../../types'
import { useEffect } from 'react'

const { Text } = Typography

export default function AdminChapters() {
  const [subjects, setSubjects] = useState<SubjectInfo[]>([])
  const [grades, setGrades] = useState<GradeInfo[]>([])
  const [selectedSubject, setSelectedSubject] = useState<number>()
  const [selectedGrade, setSelectedGrade] = useState<number>()
  const [importResult, setImportResult] = useState<{
    success: number
    fail: number
    errors: string[]
  } | null>(null)
  const [importing, setImporting] = useState(false)

  useEffect(() => {
    getSubjectsApi().then((res) => setSubjects(res.data ?? []))
    getGradesApi().then((res) => setGrades(res.data ?? []))
  }, [])

  const handleImport = async (file: File) => {
    setImporting(true)
    setImportResult(null)
    try {
      const res = await importChaptersApi(file, selectedSubject, selectedGrade)
      setImportResult(res.data)
      if (res.data.fail === 0) {
        message.success(`导入成功 ${res.data.success} 条章节`)
      } else {
        message.warning(`导入完成: 成功 ${res.data.success} 条, 失败 ${res.data.fail} 条`)
      }
    } catch {
      message.error('导入失败')
    } finally {
      setImporting(false)
    }
    return false
  }

  const handleDownloadTemplate = async (format: 'txt' | 'csv' | 'xlsx') => {
    try {
      const res = await downloadChapterTemplateApi(format)
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
      a.download = `章节导入模板.${extMap[format]}`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      message.error('下载模板失败')
    }
  }

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
          章节管理
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
            导入学科章节
          </h2>
        </div>
      </div>

      {/* Format description */}
      <div style={{
        background: 'var(--bg-surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
        padding: 24,
        marginBottom: 24,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 16,
        }}>
          <FileTextOutlined style={{ fontSize: 16, color: 'var(--ink-secondary)' }} />
          <Text style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 15,
            fontWeight: 600,
            color: 'var(--ink-primary)',
          }}>
            导入说明
          </Text>
        </div>
        <div style={{ fontSize: 13, color: 'var(--ink-tertiary)', lineHeight: 1.8 }}>
          <div>文件格式: 每行一条章节数据，字段用 <Text code>|</Text> 分隔</div>
          <div>新格式(5列): <Text code>学科ID | 年级ID | 父行号(0=根) | 章节名称 | 排序</Text></div>
          <div>旧格式(4列): <Text code>学科ID | 父行号(0=根) | 章节名称 | 排序</Text>（兼容，年级取前端选择）</div>
          <div>父行号: <Text code>0</Text> 表示根章节，其他数字表示引用第 N 行数据作为父章节</div>
          <div>支持格式: TXT / CSV / Excel，可先下载模板填写后导入</div>
          <div style={{ marginTop: 12, borderTop: '1px dashed var(--border)', paddingTop: 12 }}>
            <div style={{ fontWeight: 500, color: 'var(--ink-secondary)', marginBottom: 4 }}>学科ID对照:</div>
            <div>1-语文, 2-数学, 3-英语, 4-历史, 5-地理, 6-生物, 7-物理, 8-化学, 9-科学, 10-思想政治</div>
          </div>
          <div style={{ marginTop: 8 }}>
            <div style={{ fontWeight: 500, color: 'var(--ink-secondary)', marginBottom: 4 }}>年级ID对照:</div>
            <div>1-六年级, 2-七年级, 3-八年级, 4-九年级</div>
          </div>
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
          placeholder="学科(可选)"
          style={{ width: 140 }}
          allowClear
          value={selectedSubject}
          onChange={(v) => setSelectedSubject(v)}
          options={subjects.map((s) => ({ label: s.name, value: s.id }))}
        />
        <Select
          placeholder="年级(可选)"
          style={{ width: 140 }}
          allowClear
          value={selectedGrade}
          onChange={(v) => setSelectedGrade(v)}
          options={grades.map((g) => ({ label: g.name, value: g.id }))}
        />
        <div style={{ flex: 1 }} />
        <Upload
          beforeUpload={handleImport}
          showUploadList={false}
          accept=".txt,.csv,.xlsx"
        >
          <Button icon={<UploadOutlined />} loading={importing}>
            选择文件导入
          </Button>
        </Upload>
        <Dropdown menu={{
          items: [
            { key: 'txt', label: 'TXT 格式' },
            { key: 'csv', label: 'CSV 格式' },
            { key: 'xlsx', label: 'Excel 格式' },
          ],
          onClick: ({ key }) => handleDownloadTemplate(key as 'txt' | 'csv' | 'xlsx'),
        }}>
          <Button icon={<DownloadOutlined />}>
            下载模板
          </Button>
        </Dropdown>
      </div>

      {/* Import result */}
      {importResult && (
        <div style={{ marginBottom: 20 }}>
          <Alert
            type={importResult.fail === 0 ? 'success' : 'warning'}
            showIcon
            message={
              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>
                  导入完成: 成功 <Text strong style={{ color: '#4A7C59' }}>{importResult.success}</Text> 条,
                  失败 <Text strong style={{ color: importResult.fail > 0 ? '#C44D3E' : undefined }}>{importResult.fail}</Text> 条
                </Text>
                {importResult.errors.length > 0 && (
                  <div style={{
                    marginTop: 8,
                    maxHeight: 160,
                    overflow: 'auto',
                    fontSize: 12,
                    color: 'var(--ink-tertiary)',
                  }}>
                    {importResult.errors.map((err, i) => (
                      <div key={i} style={{ marginBottom: 2 }}>{err}</div>
                    ))}
                  </div>
                )}
              </Space>
            }
          />
        </div>
      )}

      {/* Tips */}
      <div style={{
        background: 'var(--bg-surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
        padding: 24,
      }}>
        <Text style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 14,
          fontWeight: 600,
          color: 'var(--ink-secondary)',
          display: 'block',
          marginBottom: 12,
        }}>
          模板示例
        </Text>
        <div style={{
          background: '#EDE7E0',
          borderRadius: 4,
          padding: 16,
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          lineHeight: 1.8,
          color: 'var(--ink-secondary)',
          overflow: 'auto',
        }}>
          <div style={{ color: 'var(--ink-tertiary)', marginBottom: 4 }}>
            {'// TXT 格式示例（第一行为表头可省略）'}
          </div>
          <div>1|3|0|第一章 二次根式|1</div>
          <div>1|3|1|1.1 二次根式的定义|1</div>
          <div>1|3|1|1.2 二次根式的性质|2</div>
          <div>1|3|0|第二章 勾股定理|2</div>
          <div>1|3|4|2.1 勾股定理的内容|1</div>
          <div style={{ color: 'var(--ink-tertiary)', marginTop: 8 }}>
            {'// 说明: 第2列为年级ID, 第3列父行号=0为根章节, =1挂在第1行下'}
          </div>
        </div>
      </div>
    </div>
  )
}
