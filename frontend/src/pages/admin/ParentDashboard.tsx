import { useEffect, useState } from 'react'
import { Progress, Spin, Empty, Typography, Collapse, Tag } from 'antd'
import {
  getChildrenApi,
  getChildProgressApi,
  getChildSubjectProgressApi,
  type ChildInfo,
  type ChildProgress,
  type SubjectProgress,
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

export default function ParentDashboard() {
  const [loading, setLoading] = useState(true)
  const [children, setChildren] = useState<ChildInfo[]>([])
  const [selectedChild, setSelectedChild] = useState<ChildInfo | null>(null)
  const [childProgress, setChildProgress] = useState<ChildProgress | null>(null)
  const [childProgressLoading, setChildProgressLoading] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState<number | null>(null)
  const [subjectDetail, setSubjectDetail] = useState<{
    chapterTree: ChapterProgressNode[]
    subjectName: string
  } | null>(null)
  const [subjectDetailLoading, setSubjectDetailLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    getChildrenApi()
      .then((res) => setChildren(res.data))
      .finally(() => setLoading(false))
  }, [])

  const handleChildSelect = async (child: ChildInfo) => {
    if (selectedChild?.id === child.id) {
      setSelectedChild(null)
      setChildProgress(null)
      setSelectedSubject(null)
      setSubjectDetail(null)
      return
    }
    setSelectedChild(child)
    setSelectedSubject(null)
    setSubjectDetail(null)
    setChildProgressLoading(true)
    try {
      const res = await getChildProgressApi(child.id)
      setChildProgress(res.data)
    } finally {
      setChildProgressLoading(false)
    }
  }

  const handleSubjectClick = async (subject: SubjectProgress) => {
    if (!selectedChild) return
    if (selectedSubject === subject.subjectId) {
      setSelectedSubject(null)
      setSubjectDetail(null)
      return
    }
    setSelectedSubject(subject.subjectId)
    setSubjectDetailLoading(true)
    try {
      const res = await getChildSubjectProgressApi(selectedChild.id, subject.subjectId)
      setSubjectDetail({
        chapterTree: res.data.chapterTree,
        subjectName: res.data.subjectName,
      })
    } finally {
      setSubjectDetailLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: 'center' }}>
        <Spin />
      </div>
    )
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
          家长看板
        </div>
        <h2 style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 28,
          fontWeight: 600,
          color: 'var(--ink-primary)',
        }}>
          关注孩子的每一步成长
        </h2>
      </div>

      {children.length === 0 ? (
        <div style={{
          padding: 60,
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)',
        }}>
          <Empty description="暂无关联的孩子，请联系管理员添加" />
        </div>
      ) : (
        <>
          {/* Children list - editorial cards */}
          <div className="stagger-children" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: 16,
            marginBottom: 32,
          }}>
            {children.map((child) => (
              <div
                key={child.id}
                onClick={() => handleChildSelect(child)}
                style={{
                  padding: 20,
                  background: selectedChild?.id === child.id ? 'var(--accent-soft)' : 'var(--bg-surface)',
                  border: `1px solid ${selectedChild?.id === child.id ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-lg)',
                  cursor: 'pointer',
                  transition: 'all var(--duration-fast) var(--ease-out)',
                }}
              >
                {/* Avatar initial */}
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: 'var(--accent-soft)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--font-serif)',
                  fontSize: 16,
                  fontWeight: 600,
                  color: 'var(--accent)',
                  marginBottom: 12,
                }}>
                  {child.nickname[0]}
                </div>
                <Text style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: 16,
                  fontWeight: 500,
                  display: 'block',
                  marginBottom: 4,
                }}>
                  {child.nickname}
                </Text>
                <Text style={{
                  fontSize: 12,
                  color: 'var(--ink-tertiary)',
                  display: 'block',
                  marginBottom: 16,
                }}>
                  {child.username}
                </Text>
                <div style={{
                  display: 'flex',
                  gap: 16,
                  fontSize: 12,
                  color: 'var(--ink-secondary)',
                }}>
                  <span>{child.totalAnswered} 题</span>
                  <span style={{ color: 'var(--sage)' }}>
                    正确率 {child.correctRate}%
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Selected child progress */}
          {selectedChild && (
            <div style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: 24,
            }}>
              {childProgressLoading ? (
                <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
              ) : childProgress ? (
                <>
                  <div style={{
                    fontSize: 11,
                    color: 'var(--ink-tertiary)',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    marginBottom: 16,
                  }}>
                    {selectedChild.nickname} 的学习进度
                  </div>

                  {/* Subject progress list */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {childProgress.subjectProgress
                      .filter((s) => s.totalKnowledge > 0)
                      .map((s) => (
                        <div
                          key={s.subjectId}
                          onClick={() => handleSubjectClick(s)}
                          style={{
                            padding: '16px 20px',
                            background: selectedSubject === s.subjectId ? 'var(--accent-soft)' : 'transparent',
                            border: `1px solid ${selectedSubject === s.subjectId ? 'var(--accent)' : 'var(--border)'}`,
                            borderRadius: 'var(--radius-md)',
                            cursor: 'pointer',
                          }}
                        >
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 8,
                          }}>
                            <Text style={{
                              fontFamily: 'var(--font-serif)',
                              fontSize: 14,
                              fontWeight: 500,
                            }}>
                              {s.subjectName}
                            </Text>
                            <Text style={{
                              fontFamily: 'var(--font-serif)',
                              fontSize: 16,
                              fontWeight: 600,
                              color: s.progressRate >= 80 ? 'var(--sage)' : 'var(--accent)',
                            }}>
                              {s.progressRate}%
                            </Text>
                          </div>
                          <Progress
                            percent={s.progressRate}
                            showInfo={false}
                            strokeColor={s.progressRate >= 80 ? 'var(--sage)' : 'var(--accent)'}
                            size="small"
                          />
                          <div style={{
                            display: 'flex',
                            gap: 16,
                            marginTop: 8,
                            fontSize: 11,
                            color: 'var(--ink-tertiary)',
                          }}>
                            <span>知识点 {s.masteredKnowledge}/{s.totalKnowledge}</span>
                            <span>正确率 {s.correctRate}%</span>
                            <span>做题 {s.totalAnswered}</span>
                          </div>
                        </div>
                      ))}
                  </div>

                  {/* Subject detail */}
                  {selectedSubject && (
                    <div style={{
                      marginTop: 20,
                      padding: 20,
                      background: 'var(--bg-base)',
                      borderRadius: 'var(--radius-md)',
                    }}>
                      {subjectDetailLoading ? (
                        <div style={{ textAlign: 'center', padding: 30 }}><Spin /></div>
                      ) : subjectDetail ? (
                        <div>
                          <div style={{
                            fontSize: 11,
                            color: 'var(--ink-tertiary)',
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            marginBottom: 12,
                          }}>
                            {subjectDetail.subjectName} · 知识点详情
                          </div>
                          {subjectDetail.chapterTree.length > 0 ? (
                            <ChapterTree nodes={subjectDetail.chapterTree} />
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
              ) : null}
            </div>
          )}
        </>
      )}
    </div>
  )
}
