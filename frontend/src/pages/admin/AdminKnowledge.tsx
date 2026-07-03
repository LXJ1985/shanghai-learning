import { useState } from 'react'
import {
  Select, Upload, message, Button, Typography, Dropdown, Alert, Space,
} from 'antd'
import {
  UploadOutlined, DownloadOutlined, FileTextOutlined,
} from '@ant-design/icons'
import {
  importKnowledgesApi, downloadKnowledgeTemplateApi,
} from '../../api/admin'
import { getSubjectsApi, getGradesApi, getChapterTreeApi } from '../../api/study'
import type { SubjectInfo, GradeInfo, ChapterInfo } from '../../types'
import { useEffect } from 'react'

const { Text } = Typography

// 将章节树展平为列表，带缩进前缀
function flattenChapters(tree: ChapterInfo[], prefix = ''): { id: number; label: string }[] {
  const result: { id: number; label: string }[] = []
  for (const node of tree) {
    result.push({ id: node.id, label: `${prefix}${node.name}` })
    if (node.children?.length) {
      result.push(...flattenChapters(node.children, prefix + '  '))
    }
  }
  return result
}

export default function AdminKnowledge() {
  const [subjects, setSubjects] = useState<SubjectInfo[]>([])
  const [grades, setGrades] = useState<GradeInfo[]>([])
  const [chapters, setChapters] = useState<ChapterInfo[]>([])
  const [flatChapters, setFlatChapters] = useState<{ id: number; label: string }[]>([])
  const [selectedSubject, setSelectedSubject] = useState<number>()
  const [selectedGrade, setSelectedGrade] = useState<number>()
  const [selectedChapter, setSelectedChapter] = useState<number>()
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

  // 学科或年级变化时重新加载章节树
  useEffect(() => {
    if (!selectedSubject) {
      setChapters([])
      setFlatChapters([])
      return
    }
    getChapterTreeApi(selectedSubject, selectedGrade).then((res) => {
      const tree = res.data ?? []
      setChapters(tree)
      setFlatChapters(flattenChapters(tree))
    })
  }, [selectedSubject, selectedGrade])

  const handleImport = async (file: File) => {
    setImporting(true)
    setImportResult(null)
    try {
      const res = await importKnowledgesApi(file, selectedChapter)
      setImportResult(res.data)
      if (res.data.fail === 0) {
        message.success(`导入成功 ${res.data.success} 条知识点`)
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
      const res = await downloadKnowledgeTemplateApi(format, {
        subjectId: selectedSubject,
        gradeId: selectedGrade,
        chapterId: selectedChapter,
      })
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
      a.download = `知识点导入模板.${extMap[format]}`
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
          知识点管理
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
            导入知识点
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
          <div>文件格式: 每行一条知识点数据，字段用 <Text code>|</Text> 分隔</div>
          <div>完整格式(7列): <Text code>章节名称 | 知识点名称 | 知识概要 | 重难点 | 公式 | 例题 | 排序</Text></div>
          <div>简化格式(3列): <Text code>章节名称 | 知识点名称 | 排序</Text>（中间列可为空）</div>
          <div>支持格式: TXT / CSV / Excel，可先下载模板填写后导入</div>
          <div style={{ marginTop: 8 }}>
            <Text strong style={{ color: 'var(--ink-secondary)' }}>提示:</Text>
            {' '}第一列填写章节名称(必须与系统中章节名称完全一致)，可从下载的模板中获取可用的章节名称列表
          </div>
          <div>
            <Text strong style={{ color: 'var(--ink-secondary)' }}>筛选:</Text>
            {' '}选择学科/年级/章节后下载模板，将只显示对应范围的章节名称
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
          placeholder="学科"
          style={{ width: 140 }}
          allowClear
          value={selectedSubject}
          onChange={(v) => {
            setSelectedSubject(v)
            setSelectedGrade(undefined)
            setSelectedChapter(undefined)
          }}
          options={subjects.map((s) => ({ label: s.name, value: s.id }))}
        />
        <Select
          placeholder="年级"
          style={{ width: 140 }}
          allowClear
          value={selectedGrade}
          onChange={(v) => {
            setSelectedGrade(v)
            setSelectedChapter(undefined)
          }}
          options={grades.map((g) => ({ label: g.name, value: g.id }))}
        />
        <Select
          placeholder="章节(可选)"
          style={{ width: 260, maxWidth: '100%' }}
          allowClear
          showSearch
          optionFilterProp="label"
          value={selectedChapter}
          onChange={(v) => setSelectedChapter(v)}
          options={flatChapters.map((c) => ({ label: c.label, value: c.id }))}
          notFoundContent={selectedSubject ? '暂无章节，请先导入章节' : '请先选择学科'}
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
          <div>第1章 二次根式|二次根式的概念|含有二次根号的式子的概念|理解二次根式的定义|√a (a≥0)|√4=2|1</div>
          <div>第1章 二次根式|二次根式的性质|二次根式的基本性质|掌握非负性和乘法法则|√a×√b=√ab|√2×√8=4|2</div>
          <div>第2章 勾股定理|勾股定理|直角三角形三边关系|理解勾股定理的证明|a²+b²=c²|3,4,5三角形|1</div>
          <div style={{ color: 'var(--ink-tertiary)', marginTop: 8 }}>
            {'// 说明: 第1列为章节名称(从模板获取), 最后1列为排序, 中间列可为空'}
          </div>
        </div>
      </div>
    </div>
  )
}
