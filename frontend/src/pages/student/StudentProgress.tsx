import { useEffect, useState } from 'react'
import { Progress, Spin, Empty, Typography, Collapse, Tag } from 'antd'
import {
  getProgressApi,
  getSubjectProgressApi,
  type SubjectProgress,
  type SubjectDetailProgress,
  type ChapterProgressNode,
  type KnowledgeProgress,
} from '../../api/progress'

const { Text } = Typography

function KnowledgeStatusTag({ status }: { status: string }) {
  switch (status) {
    case 'MASTERED':
      return <Tag color="success">已掌握</Tag>
    case 'PRACTICING':
      return <Tag color="processing">学习中</Tag>
    default:
      return <Tag>未开始</Tag>
  }
}

function KnowledgeList({ knowledges }: { knowledges?: KnowledgeProgress[] }) {
  if (!knowledges || knowledges.length === 0) return null
  return (
    <div>
      {knowledges.map((k) => (
        <div
          key={k.knowledgeId}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '8px 0',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <Text style={{ fontSize: 13 }}>{k.knowledgeName}</Text>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {k.answered > 0 && (
              <Text style={{ fontSize: 11, color: 'var(--ink-tertiary)' }}>
                {k.answered}次 · {k.correctRate}%
              </Text>
            )}
            <KnowledgeStatusTag status={k.status} />
          </div>
        </div>
      ))}
    </div>
  )
}

function ChapterTree({ nodes }: { nodes: ChapterProgressNode[] }) {
  return (
    <div>
      {nodes.map((node) => (
        <div key={node.id} style={{ marginBottom: 8 }}>
          <Collapse
            size="small"
            items={[{
              key: node.id,
              label: (
                <Text style={{
                  fontFamily: 'var(--font-serif)',
                  fontWeight: 500,
                  fontSize: 14,
                }}>
                  {node.name}
                </Text>
              ),
              children: (
                <div>
                  <KnowledgeList knowledges={node.knowledges} />
                  {node.children && node.children.length > 0 && (
                    <ChapterTree nodes={node.children} />
                  )}
                </div>
              ),
            }]}
          />
        </div>
      ))}
    </div>
  )
}

export default function StudentProgress() {
  const [loading, setLoading] = useState(true)
  const [subjects, setSubjects] = useState<SubjectProgress[]>([])
  const [selectedSubject, setSelectedSubject] = useState<number | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detail, setDetail] = useState<SubjectDetailProgress | null>(null)

  useEffect(() => {
    setLoading(true)
    getProgressApi()
      .then((res) => setSubjects(res.data))
      .finally(() => setLoading(false))
  }, [])

  const handleSubjectClick = async (subjectId: number) => {
    if (selectedSubject === subjectId) {
      setSelectedSubject(null)
      setDetail(null)
      return
    }
    setSelectedSubject(subjectId)
    setDetailLoading(true)
    try {
      const res = await getSubjectProgressApi(subjectId)
      setDetail(res.data)
    } finally {
      setDetailLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: 'center' }}>
        <Spin />
      </div>
    )
  }

  const activeSubjects = subjects.filter((s) => s.totalKnowledge > 0)

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
          学习进度
        </div>
        <h2 style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 28,
          fontWeight: 600,
          color: 'var(--ink-primary)',
        }}>
          你的学习轨迹
        </h2>
      </div>

      {activeSubjects.length === 0 ? (
        <div style={{
          padding: 60,
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)',
        }}>
          <Empty description="暂无学习数据，开始做题后这里会显示你的进度" />
        </div>
      ) : (
        <>
          {/* Subject cards - editorial list style */}
          <div className="stagger-children" style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}>
            {activeSubjects.map((s) => (
              <div
                key={s.subjectId}
                onClick={() => handleSubjectClick(s.subjectId)}
                style={{
                  padding: '20px 24px',
                  background: selectedSubject === s.subjectId ? 'var(--accent-soft)' : 'var(--bg-surface)',
                  border: `1px solid ${selectedSubject === s.subjectId ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-lg)',
                  cursor: 'pointer',
                  transition: 'all var(--duration-fast) var(--ease-out)',
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 12,
                }}>
                  <div>
                    <Text style={{
                      fontFamily: 'var(--font-serif)',
                      fontSize: 16,
                      fontWeight: 500,
                    }}>
                      {s.subjectName}
                    </Text>
                    <Text style={{
                      fontSize: 12,
                      color: 'var(--ink-tertiary)',
                      marginLeft: 12,
                    }}>
                      {s.totalAnswered} 道题
                    </Text>
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: 20,
                    fontWeight: 600,
                    color: s.progressRate >= 80 ? 'var(--sage)' : 'var(--accent)',
                  }}>
                    {s.progressRate}%
                  </div>
                </div>
                <Progress
                  percent={s.progressRate}
                  showInfo={false}
                  strokeColor={s.progressRate >= 80 ? 'var(--sage)' : 'var(--accent)'}
                  size="small"
                />
                <div style={{
                  display: 'flex',
                  gap: 24,
                  marginTop: 12,
                  fontSize: 12,
                  color: 'var(--ink-tertiary)',
                }}>
                  <span>知识点 {s.masteredKnowledge}/{s.totalKnowledge}</span>
                  <span>正确率 {s.correctRate}%</span>
                </div>
              </div>
            ))}
          </div>

          {/* Detail panel */}
          {selectedSubject && (
            <div style={{
              marginTop: 24,
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: 24,
            }}>
              {detailLoading ? (
                <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
              ) : detail ? (
                <div>
                  <div style={{
                    fontSize: 11,
                    color: 'var(--ink-tertiary)',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    marginBottom: 16,
                  }}>
                    {detail.subjectName} · 知识点详情
                  </div>
                  {detail.chapterTree.length > 0 ? (
                    <ChapterTree nodes={detail.chapterTree} />
                  ) : (
                    <Text style={{ color: 'var(--ink-tertiary)', fontStyle: 'italic' }}>
                      暂无章节数据
                    </Text>
                  )}
                </div>
              ) : null}
            </div>
          )}
        </>
      )}
    </div>
  )
}
