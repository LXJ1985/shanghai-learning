import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Select, Tree, Empty, Spin, Typography } from 'antd'
import { getSubjectsApi, getGradesApi, getChapterTreeApi } from '../../api/study'
import type { SubjectInfo, GradeInfo, ChapterInfo } from '../../types'

const { Text } = Typography

export default function SubjectList() {
  const [subjects, setSubjects] = useState<SubjectInfo[]>([])
  const [grades, setGrades] = useState<GradeInfo[]>([])
  const [selectedSubject, setSelectedSubject] = useState<number>()
  const [selectedGrade, setSelectedGrade] = useState<number>()
  const [chapterTree, setChapterTree] = useState<ChapterInfo[]>([])
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    getSubjectsApi().then((res) => setSubjects(res.data))
    getGradesApi().then((res) => setGrades(res.data))
  }, [])

  useEffect(() => {
    if (selectedSubject) {
      setLoading(true)
      getChapterTreeApi(selectedSubject, selectedGrade)
        .then((res) => setChapterTree(res.data ?? []))
        .finally(() => setLoading(false))
    }
  }, [selectedSubject, selectedGrade])

  const convertToTreeData = (chapters: ChapterInfo[]): any[] => {
    return chapters.map((ch) => ({
      key: ch.id,
      title: ch.name,
      children: ch.children ? convertToTreeData(ch.children) : [],
    }))
  }

  const currentSubject = subjects.find((s) => s.id === selectedSubject)
  const currentGrade = grades.find((g) => g.id === selectedGrade)

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
          学科学习
        </div>
        <h2 style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 28,
          fontWeight: 600,
          color: 'var(--ink-primary)',
          marginBottom: 16,
        }}>
          选择章节，开始探索
        </h2>
        <div style={{
          display: 'flex',
          gap: 12,
          alignItems: 'center',
        }}>
          <Select
            placeholder="学科"
            style={{ width: 140 }}
            onChange={(v) => { setSelectedSubject(v); setChapterTree([]) }}
            options={subjects.map((s) => ({ label: s.name, value: s.id }))}
          />
          <Select
            placeholder="年级"
            style={{ width: 140 }}
            onChange={(v) => { setSelectedGrade(v); setChapterTree([]) }}
            options={grades.map((g) => ({ label: g.name, value: g.id }))}
          />
          {currentSubject && currentGrade && (
            <Text style={{
              fontSize: 13,
              color: 'var(--ink-tertiary)',
              fontStyle: 'italic',
            }}>
              {currentSubject.name} &middot; {currentGrade.name}
            </Text>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ padding: 60, textAlign: 'center' }}>
          <Spin />
        </div>
      ) : chapterTree.length > 0 ? (
        <div className="stagger-children">
          <Tree
            treeData={convertToTreeData(chapterTree)}
            defaultExpandAll
            onSelect={(keys) => {
              if (keys.length > 0) {
                navigate(`/knowledge/${keys[0]}`)
              }
            }}
            style={{
              background: 'var(--bg-surface)',
              padding: 24,
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border)',
            }}
          />
        </div>
      ) : selectedSubject ? (
        <div style={{
          padding: 60,
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)',
        }}>
          <Empty description="暂无章节数据" />
        </div>
      ) : (
        <div style={{
          padding: '60px 0',
          color: 'var(--ink-tertiary)',
          fontStyle: 'italic',
          fontSize: 14,
        }}>
          选择学科，章节目录将显示在这里，可按年级筛选
        </div>
      )}
    </div>
  )
}
