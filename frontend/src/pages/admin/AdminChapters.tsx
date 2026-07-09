import { useState } from 'react'
import {
  Select, Upload, message, Button, Typography, Dropdown, Alert, Space, Modal, Tag,
} from 'antd'
import {
  UploadOutlined, DownloadOutlined, FileTextOutlined, CloudOutlined,
  CheckCircleOutlined, BookOutlined, BulbOutlined, FileDoneOutlined,
} from '@ant-design/icons'
import {
  importChaptersApi, downloadChapterTemplateApi, fetchCourseByAiPreviewApi, fetchCourseByAiConfirmApi,
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
  const [selectedSemester, setSelectedSemester] = useState<string>('上学期')
  const [aiFetching, setAiFetching] = useState(false)
  const [aiModalVisible, setAiModalVisible] = useState(false)
  const [aiChapters, setAiChapters] = useState<Array<{
    name: string
    sortOrder: number
    children: Array<{ name: string; sortOrder: number }>
    knowledgePoints: Array<{
      name: string
      summary: string
      questions: Array<{
        type: number
        content: string
        options: string
        answer: string
        analysis: string
        difficulty: number
        source: string
      }>
    }>
  }>>([])
  const [aiSkipped, setAiSkipped] = useState(0)
  const [aiConfirming, setAiConfirming] = useState(false)
  const [aiResult, setAiResult] = useState<{
    chaptersAdded: number
    knowledgeAdded: number
    questionsAdded: number
    skipped: number
    errors: string[]
  } | null>(null)

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

  const handleAiFetch = async () => {
    if (!selectedSubject || !selectedGrade || !selectedSemester) {
      message.warning('请先选择学科、年级和学期')
      return
    }
    setAiFetching(true)
    setAiResult(null)
    try {
      const res = await fetchCourseByAiPreviewApi(selectedGrade, selectedSubject, selectedSemester)
      if (res.data.error) {
        message.error(res.data.error)
        return
      }
      const chapters = res.data.chapters ?? []
      if (chapters.length === 0) {
        message.warning('AI 未返回有效章节数据')
        return
      }
      setAiChapters(chapters)
      setAiSkipped(res.data.skipped ?? 0)
      setAiModalVisible(true)
    } catch (err: any) {
      message.error(err?.response?.data?.message || 'AI 获取失败，请检查 API Key 配置')
    } finally {
      setAiFetching(false)
    }
  }

  const handleAiConfirm = async () => {
    setAiConfirming(true)
    try {
      const res = await fetchCourseByAiConfirmApi(selectedGrade!, selectedSubject!, aiChapters)
      setAiResult(res.data)
      setAiModalVisible(false)
      if (res.data.errors.length === 0) {
        message.success(`已保存: 新增 ${res.data.chaptersAdded} 个章节, ${res.data.knowledgeAdded} 个知识点, ${res.data.questionsAdded} 道题目`)
      } else {
        message.warning(`保存完成，但有 ${res.data.errors.length} 个错误`)
      }
    } catch {
      message.error('保存失败')
    } finally {
      setAiConfirming(false)
    }
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
          placeholder="学科(必选)"
          style={{ width: 140 }}
          allowClear
          value={selectedSubject}
          onChange={(v) => setSelectedSubject(v)}
          options={subjects.map((s) => ({ label: s.name, value: s.id }))}
        />
        <Select
          placeholder="年级(必选)"
          style={{ width: 140 }}
          allowClear
          value={selectedGrade}
          onChange={(v) => setSelectedGrade(v)}
          options={grades.map((g) => ({ label: g.name, value: g.id }))}
        />
        <Select
          placeholder="学期"
          style={{ width: 120 }}
          value={selectedSemester}
          onChange={(v) => setSelectedSemester(v)}
          options={[
            { label: '上学期', value: '上学期' },
            { label: '下学期', value: '下学期' },
          ]}
        />
        <div style={{ flex: 1 }} />
        <Button
          type="primary"
          icon={<CloudOutlined />}
          loading={aiFetching}
          onClick={handleAiFetch}
          disabled={!selectedSubject || !selectedGrade}
        >
          AI 智能获取
        </Button>
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

      {/* AI 预览弹窗 */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BookOutlined style={{ color: 'var(--ink-secondary)' }} />
            <span>AI 课程数据预览</span>
            <Tag color="blue" style={{ marginLeft: 'auto' }}>
              {aiChapters.length} 个章节 · {aiSkipped} 个已存在跳过
            </Tag>
          </div>
        }
        open={aiModalVisible}
        onCancel={() => setAiModalVisible(false)}
        width={720}
        styles={{ body: { maxHeight: '60vh', overflowY: 'auto', padding: '16px 24px' } }}
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--ink-tertiary)' }}>
              共 {aiChapters.reduce((sum, ch) => sum + ch.children.length + 1, 0)} 个章节，
              {aiChapters.reduce((sum, ch) => sum + ch.knowledgePoints.length, 0)} 个知识点，
              {aiChapters.reduce((sum, ch) => sum + ch.knowledgePoints.reduce((s, kp) => s + (kp.questions?.length ?? 0), 0), 0)} 道题目
            </span>
            <Space>
              <Button onClick={() => setAiModalVisible(false)}>取消</Button>
              <Button type="primary" icon={<CheckCircleOutlined />} loading={aiConfirming} onClick={handleAiConfirm}>
                确认导入
              </Button>
            </Space>
          </div>
        }
      >
        {aiChapters.map((chapter, ci) => (
          <div key={ci} style={{ marginBottom: 20 }}>
            {/* 根章节 */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 12px',
              background: '#F5F0EB',
              borderRadius: 6,
              marginBottom: 8,
            }}>
              <BookOutlined style={{ color: '#8B6914', fontSize: 14 }} />
              <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink-primary)' }}>
                {chapter.name}
              </span>
              <Tag style={{ marginLeft: 'auto', fontSize: 11 }}>
                {chapter.knowledgePoints.length} 知识点
              </Tag>
            </div>

            {/* 子章节 */}
            {chapter.children.length > 0 && (
              <div style={{ paddingLeft: 28, marginBottom: 6 }}>
                <div style={{ fontSize: 12, color: 'var(--ink-tertiary)', marginBottom: 4 }}>节:</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {chapter.children.map((child, cdi) => (
                    <Tag key={cdi} style={{ fontSize: 12, margin: 0 }}>{child.name}</Tag>
                  ))}
                </div>
              </div>
            )}

            {/* 知识点 */}
            {chapter.knowledgePoints.length > 0 && (
              <div style={{ paddingLeft: 28 }}>
                <div style={{ fontSize: 12, color: 'var(--ink-tertiary)', marginBottom: 4 }}>
                  <BulbOutlined style={{ marginRight: 4 }} />知识点:
                </div>
                {chapter.knowledgePoints.map((kp, kpi) => (
                  <div key={kpi} style={{ marginBottom: 10 }}>
                    <div style={{
                      fontSize: 12,
                      color: 'var(--ink-secondary)',
                      padding: '3px 0',
                      borderBottom: '1px dashed var(--border)',
                    }}>
                      <span style={{ fontWeight: 500, color: 'var(--ink-primary)' }}>{kp.name}</span>
                      {kp.summary && <span style={{ color: 'var(--ink-tertiary)' }}> — {kp.summary}</span>}
                    </div>
                    {/* 题目 */}
                    {kp.questions?.length > 0 && (
                      <div style={{ paddingLeft: 12, marginTop: 4 }}>
                        {kp.questions.map((q, qi) => (
                          <div key={qi} style={{
                            fontSize: 11,
                            padding: '4px 8px',
                            marginBottom: 3,
                            background: '#FAFAF8',
                            borderRadius: 4,
                            borderLeft: '2px solid #D4C5A9',
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                              <Tag style={{ fontSize: 10, margin: 0, lineHeight: '16px', padding: '0 4px' }}
                                color={q.type === 1 ? 'blue' : 'green'}>
                                {q.type === 1 ? '选择' : '填空'}
                              </Tag>
                              <span style={{ color: '#E8A608', fontSize: 10 }}>
                                {'★'.repeat(q.difficulty)}{'☆'.repeat(5 - q.difficulty)}
                              </span>
                              {q.source && (
                                <span style={{ fontSize: 10, color: 'var(--ink-tertiary)', marginLeft: 'auto' }}>
                                  <FileDoneOutlined style={{ marginRight: 2 }} />{q.source}
                                </span>
                              )}
                            </div>
                            <div style={{ color: 'var(--ink-secondary)', lineHeight: 1.5 }}>
                              {q.content}
                            </div>
                            {q.type === 1 && q.options && (
                              <div style={{ marginTop: 2, color: 'var(--ink-tertiary)', fontSize: 11 }}>
                                {(() => {
                                  try {
                                    const opts = JSON.parse(q.options)
                                    return opts.map((opt: string, oi: number) => (
                                      <span key={oi} style={{ marginRight: 12 }}>
                                        {opt}
                                        {q.answer && q.answer.trim() === opt.charAt(0) && (
                                          <span style={{ color: '#4A7C59', fontWeight: 600 }}> ✓</span>
                                        )}
                                      </span>
                                    ))
                                  } catch {
                                    return <span>{q.options}</span>
                                  }
                                })()}
                              </div>
                            )}
                            {q.type === 2 && q.answer && (
                              <div style={{ marginTop: 2, fontSize: 11, color: '#4A7C59' }}>
                                答案: {q.answer}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </Modal>

      {/* AI 确认结果 */}
      {aiResult && (
        <div style={{ marginBottom: 20 }}>
          <Alert
            type={aiResult.errors.length === 0 ? 'success' : 'warning'}
            showIcon
            message={
              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>
                  导入完成: 新增章节 <Text strong style={{ color: '#4A7C59' }}>{aiResult.chaptersAdded}</Text> 个,
                  新增知识点 <Text strong style={{ color: '#4A7C59' }}>{aiResult.knowledgeAdded}</Text> 个,
                  新增题目 <Text strong style={{ color: '#4A7C59' }}>{aiResult.questionsAdded}</Text> 道,
                  跳过(已存在) <Text strong>{aiResult.skipped}</Text> 个
                </Text>
                {aiResult.errors.length > 0 && (
                  <div style={{
                    marginTop: 8,
                    maxHeight: 160,
                    overflow: 'auto',
                    fontSize: 12,
                    color: 'var(--ink-tertiary)',
                  }}>
                    {aiResult.errors.map((err, i) => (
                      <div key={i} style={{ marginBottom: 2 }}>{err}</div>
                    ))}
                  </div>
                )}
              </Space>
            }
          />
        </div>
      )}

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
