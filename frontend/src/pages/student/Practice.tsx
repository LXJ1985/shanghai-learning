import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Radio, Input, Button, message, Spin, Typography } from 'antd'
import { getQuestionsByKnowledgeApi, submitPracticeApi } from '../../api/question'
import type { QuestionInfo } from '../../types'

const { Text, Paragraph } = Typography
const { TextArea } = Input

export default function Practice() {
  const [searchParams] = useSearchParams()
  const knowledgeId = searchParams.get('knowledgeId')
  const [questions, setQuestions] = useState<QuestionInfo[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [showResult, setShowResult] = useState(false)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (knowledgeId) {
      setLoading(true)
      getQuestionsByKnowledgeApi(Number(knowledgeId), 1, 50)
        .then((res) => setQuestions(res.data.records))
        .finally(() => setLoading(false))
    }
  }, [knowledgeId])

  const question = questions[currentIndex]

  const handleSubmit = async () => {
    if (!question || !answer.trim()) {
      message.warning('请先输入答案')
      return
    }
    setSubmitting(true)
    try {
      await submitPracticeApi({
        questionId: question.id,
        userAnswer: answer,
        timeSpent: 0,
      })
      setShowResult(true)
    } finally {
      setSubmitting(false)
    }
  }

  const handleNext = () => {
    setAnswer('')
    setShowResult(false)
    setCurrentIndex((i) => Math.min(i + 1, questions.length - 1))
  }

  const getOptions = (q: QuestionInfo): string[] => {
    if (q.options) {
      try {
        return JSON.parse(q.options)
      } catch {
        return []
      }
    }
    return []
  }

  if (loading) return (
    <div style={{ padding: 60, textAlign: 'center' }}>
      <Spin />
    </div>
  )
  if (!question) return (
    <div style={{ padding: 60, textAlign: 'center' }}>
      <Text style={{ color: 'var(--ink-tertiary)', fontStyle: 'italic' }}>
        暂无题目
      </Text>
    </div>
  )

  const isObjective = [1, 4].includes(question.type)

  return (
    <div style={{ maxWidth: 680 }}>
      {/* Progress indicator */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 32,
      }}>
        <div>
          <div style={{
            fontSize: 11,
            color: 'var(--ink-tertiary)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: 4,
          }}>
            做题练习
          </div>
          <Text style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 13,
            color: 'var(--ink-secondary)',
          }}>
            第 {currentIndex + 1} 题 / 共 {questions.length} 题
          </Text>
        </div>
        <div style={{
          display: 'flex',
          gap: 3,
          alignItems: 'center',
        }}>
          {questions.map((_, idx) => (
            <div
              key={idx}
              style={{
                width: idx === currentIndex ? 16 : 6,
                height: 6,
                borderRadius: 3,
                background: idx === currentIndex
                  ? 'var(--accent)'
                  : idx < currentIndex
                    ? 'var(--sage)'
                    : 'var(--border)',
                transition: 'all var(--duration-fast) var(--ease-out)',
              }}
            />
          ))}
        </div>
      </div>

      {/* Question card */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: 32,
        marginBottom: 24,
      }}>
        {/* Difficulty */}
        <div style={{
          fontSize: 11,
          color: 'var(--ink-tertiary)',
          marginBottom: 16,
          letterSpacing: '0.05em',
        }}>
          {'●'.repeat(question.difficulty)}{'○'.repeat(5 - question.difficulty)} 难度
        </div>

        {/* Question content */}
        <Paragraph style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 16,
          lineHeight: 1.8,
          color: 'var(--ink-primary)',
          marginBottom: 24,
        }}>
          {question.content}
        </Paragraph>

        {/* Answer area */}
        {question.type === 1 && (
          <Radio.Group
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            disabled={showResult}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {getOptions(question).map((opt, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '10px 16px',
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${answer === String.fromCharCode(65 + idx) ? 'var(--accent)' : 'var(--border)'}`,
                    background: answer === String.fromCharCode(65 + idx) ? 'var(--accent-soft)' : 'transparent',
                    transition: 'all var(--duration-fast) var(--ease-out)',
                  }}
                >
                  <Radio value={String.fromCharCode(65 + idx)}>
                    <Text style={{ fontSize: 14 }}>{opt}</Text>
                  </Radio>
                </div>
              ))}
            </div>
          </Radio.Group>
        )}

        {question.type === 4 && (
          <Radio.Group
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            disabled={showResult}
          >
            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{
                padding: '10px 24px',
                borderRadius: 'var(--radius-md)',
                border: `1px solid ${answer === '对' ? 'var(--sage)' : 'var(--border)'}`,
                background: answer === '对' ? 'var(--sage-soft)' : 'transparent',
              }}>
                <Radio value="对">对</Radio>
              </div>
              <div style={{
                padding: '10px 24px',
                borderRadius: 'var(--radius-md)',
                border: `1px solid ${answer === '错' ? 'var(--accent)' : 'var(--border)'}`,
                background: answer === '错' ? 'var(--accent-soft)' : 'transparent',
              }}>
                <Radio value="错">错</Radio>
              </div>
            </div>
          </Radio.Group>
        )}

        {[2, 3, 5, 6, 7].includes(question.type) && (
          <TextArea
            rows={4}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="写下你的答案..."
            disabled={showResult}
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 14,
              lineHeight: 1.7,
            }}
          />
        )}

        {/* Result */}
        {showResult && (
          <div style={{
            marginTop: 24,
            padding: 20,
            background: 'var(--sage-soft)',
            borderRadius: 'var(--radius-md)',
            borderLeft: '3px solid var(--sage)',
          }}>
            <div style={{
              fontSize: 11,
              color: 'var(--sage)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: 8,
              fontWeight: 500,
            }}>
              答案与解析
            </div>
            <Text strong style={{ fontSize: 14 }}>
              正确答案：
            </Text>
            <Paragraph style={{ fontSize: 14, marginTop: 4, marginBottom: 12 }}>
              {question.answer}
            </Paragraph>
            {question.analysis && (
              <>
                <Text strong style={{ fontSize: 14 }}>
                  解析：
                </Text>
                <Paragraph style={{ fontSize: 14, marginTop: 4, color: 'var(--ink-secondary)' }}>
                  {question.analysis}
                </Paragraph>
              </>
            )}
          </div>
        )}

        {/* Action */}
        <div style={{ marginTop: 24 }}>
          {!showResult ? (
            <Button type="primary" onClick={handleSubmit} loading={submitting}>
              提交答案
            </Button>
          ) : (
            <Button type="primary" onClick={handleNext}>
              下一题
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
