import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button, Spin, Typography } from 'antd'
import { getKnowledgeListApi, getKnowledgeDetailApi } from '../../api/study'
import type { KnowledgeInfo } from '../../types'

const { Text, Paragraph } = Typography

export default function KnowledgeDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [knowledges, setKnowledges] = useState<KnowledgeInfo[]>([])
  const [selected, setSelected] = useState<KnowledgeInfo | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (id) {
      setLoading(true)
      getKnowledgeListApi(Number(id))
        .then((res) => setKnowledges(res.data))
        .finally(() => setLoading(false))
    }
  }, [id])

  const handleSelect = async (k: KnowledgeInfo) => {
    const res = await getKnowledgeDetailApi(k.id)
    setSelected(res.data)
  }

  if (loading) return (
    <div style={{ padding: 60, textAlign: 'center' }}>
      <Spin />
    </div>
  )

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
          知识点
        </div>
        <h2 style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 28,
          fontWeight: 600,
          color: 'var(--ink-primary)',
        }}>
          深入每一个知识点
        </h2>
      </div>

      {/* Two column layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: selected ? '280px 1fr' : '1fr',
        gap: 32,
        alignItems: 'start',
      }}>
        {/* Knowledge list */}
        <div>
          {knowledges.length === 0 ? (
            <Text style={{ color: 'var(--ink-tertiary)', fontStyle: 'italic' }}>
              暂无知识点
            </Text>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {knowledges.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  style={{
                    padding: '12px 16px',
                    cursor: 'pointer',
                    borderRadius: 'var(--radius-md)',
                    background: selected?.id === item.id ? 'var(--accent-soft)' : 'transparent',
                    borderLeft: selected?.id === item.id ? '2px solid var(--accent)' : '2px solid transparent',
                    transition: 'all var(--duration-fast) var(--ease-out)',
                  }}
                >
                  <Text style={{
                    fontSize: 14,
                    fontWeight: selected?.id === item.id ? 500 : 400,
                    color: selected?.id === item.id ? 'var(--accent)' : 'var(--ink-primary)',
                  }}>
                    {item.name}
                  </Text>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: 32,
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: 24,
            }}>
              <h3 style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 20,
                fontWeight: 600,
                margin: 0,
              }}>
                {selected.name}
              </h3>
              <Button
                type="text"
                size="small"
                onClick={() => setSelected(null)}
                style={{ color: 'var(--ink-tertiary)' }}
              >
                关闭
              </Button>
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={{
                fontSize: 11,
                color: 'var(--ink-tertiary)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginBottom: 8,
              }}>
                内容
              </div>
              <Paragraph style={{
                fontSize: 14,
                lineHeight: 1.8,
                color: 'var(--ink-secondary)',
              }}>
                {selected.summary}
              </Paragraph>
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={{
                fontSize: 11,
                color: 'var(--ink-tertiary)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginBottom: 8,
              }}>
                重点难点
              </div>
              <Paragraph style={{
                fontSize: 14,
                lineHeight: 1.8,
                color: 'var(--ink-secondary)',
              }}>
                {selected.keyPoints}
              </Paragraph>
            </div>

            <div style={{
              paddingTop: 20,
              borderTop: '1px solid var(--border)',
            }}>
              <Button
                type="primary"
                onClick={() => navigate(`/practice?knowledgeId=${selected.id}`)}
              >
                去做题
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
