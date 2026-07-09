import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button, Tag, Typography, Card, Descriptions, Divider } from 'antd'
import { getExamRecordDetailApi, getExamDetailApi } from '../../api/exam'

const { Text, Title } = Typography

const TYPE_LABELS: Record<number, string> = {
  1: '选择题', 2: '填空题', 3: '解答题', 4: '判断题',
  5: '简答题', 6: '作文题', 7: '综合题',
}

const TYPE_COLORS: Record<number, string> = {
  1: '#C45D3E', 2: '#4A7C59', 3: '#D4A853', 4: '#5B8FA8',
  5: '#8B6CC1', 6: '#C47A5A', 7: '#6B8E7B',
}

interface QuestionData {
  id: number
  type: number
  content: string
  options?: string
  answer: string
  analysis?: string
  difficulty: number
  score: number
}

interface ExamQuestionItem {
  examQuestionId: number
  sortOrder: number
  score: number
  question: QuestionData
}

interface AnswerItem {
  examQuestionId: number
  userAnswer: string
  score: number
  isCorrect: number
}

export default function ExamResult() {
  const { recordId } = useParams<{ recordId: string }>()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [record, setRecord] = useState<any>(null)
  const [exam, setExam] = useState<any>(null)
  const [questions, setQuestions] = useState<ExamQuestionItem[]>([])
  const [answerMap, setAnswerMap] = useState<Record<number, AnswerItem>>({})

  useEffect(() => {
    if (!recordId) return
    Promise.all([
      getExamRecordDetailApi(Number(recordId)),
    ]).then(([recordRes]) => {
      const data = recordRes.data as any
      const rec = data.record || data
      setRecord(rec)

      const examData = data.exam || {}
      setExam(examData)

      const details: AnswerItem[] = data.answerDetails || []
      const map: Record<number, AnswerItem> = {}
      for (const d of details) {
        map[d.examQuestionId] = d
      }
      setAnswerMap(map)

      // 获取试卷详情（含题目和正确答案）
      return getExamDetailApi(examData.id)
    }).then((examRes) => {
      if (!examRes) return
      const data = examRes.data as any
      const qs: ExamQuestionItem[] = (data.questions || []).map((q: any) => ({
        examQuestionId: q.examQuestionId,
        sortOrder: q.sortOrder,
        score: q.score,
        question: q.question,
      }))
      setQuestions(qs)
    }).catch(() => {
      // fallback
    }).finally(() => setLoading(false))
  }, [recordId])

  if (loading) return null
  if (!record || !exam) {
    return (
      <div style={{ textAlign: 'center', padding: 60 }}>
        <Text type="secondary">加载失败</Text>
        <br /><br />
        <Button onClick={() => navigate('/exam')}>返回</Button>
      </div>
    )
  }

  const totalQuestions = questions.length
  const correctCount = Object.values(answerMap).filter((a) => a.isCorrect === 1).length
  const scorePercent = exam.totalScore > 0 ? Math.round((record.totalScore / exam.totalScore) * 100) : 0
  const formatTimeSpent = (s: number) => {
    if (!s) return '-'
    const m = Math.floor(s / 60)
    const sec = s % 60
    return m > 0 ? `${m}分${sec}秒` : `${sec}秒`
  }

  return (
    <div style={{ maxWidth: 780, margin: '0 auto', padding: '0 16px 80px' }}>
      {/* 成绩概览 */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: 32,
        marginBottom: 20,
        textAlign: 'center',
      }}>
        <Title level={3} style={{ marginBottom: 24, fontFamily: 'var(--font-serif)' }}>
          {exam.title}
        </Title>

        <div style={{
          display: 'inline-flex',
          alignItems: 'baseline',
          gap: 4,
          marginBottom: 24,
        }}>
          <span style={{
            fontSize: 56,
            fontWeight: 700,
            fontFamily: 'var(--font-mono, monospace)',
            color: scorePercent >= 80 ? '#4A7C59' : scorePercent >= 60 ? '#D4A853' : '#C44D3E',
          }}>
            {record.totalScore}
          </span>
          <span style={{ fontSize: 18, color: 'var(--ink-tertiary)' }}>
            / {exam.totalScore}
          </span>
        </div>

        <Descriptions column={3} size="small" style={{ maxWidth: 400, margin: '0 auto' }}>
          <Descriptions.Item label="正确率">
            {totalQuestions > 0 ? `${correctCount}/${totalQuestions}` : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="得分率">{scorePercent}%</Descriptions.Item>
          <Descriptions.Item label="用时">{formatTimeSpent(record.timeSpent)}</Descriptions.Item>
        </Descriptions>
      </div>

      {/* 答题详情 */}
      {questions.map((eq, idx) => {
        const q = eq.question
        const answer = answerMap[eq.examQuestionId]
        const userAnswer = answer?.userAnswer || ''
        const isCorrect = answer?.isCorrect === 1
        const gotScore = answer?.score ?? 0

        let options: string[] = []
        if ((q.type === 1 || q.type === 4) && q.options) {
          try {
            const parsed = JSON.parse(q.options)
            options = parsed.map((item: any) => {
              if (typeof item === 'string') return item
              if (item.content) return `${item.label}. ${item.content}`
              return String(item.label || item)
            })
          } catch { /* ignore */ }
        }

        return (
          <div key={eq.examQuestionId} style={{
            background: 'var(--bg-surface)',
            border: `1px solid ${isCorrect ? '#C8E6C9' : userAnswer ? '#FFCDD2' : 'var(--border)'}`,
            borderRadius: 'var(--radius-lg)',
            padding: 24,
            marginBottom: 16,
          }}>
            {/* 题头 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: isCorrect ? '#4A7C59' : userAnswer ? '#C44D3E' : '#EDE7E0',
                color: '#fff',
                fontSize: 13,
                fontWeight: 600,
              }}>
                {idx + 1}
              </span>
              <Tag color={TYPE_COLORS[q.type] || '#6B6560'} style={{ margin: 0 }}>
                {TYPE_LABELS[q.type] || '其他'}
              </Tag>
              <Text style={{ fontSize: 12, color: 'var(--ink-tertiary)' }}>
                {eq.score} 分
              </Text>
              <div style={{ marginLeft: 'auto' }}>
                {isCorrect ? (
                  <Tag color="#4A7C59">正确 +{gotScore}</Tag>
                ) : userAnswer ? (
                  <Tag color="#C44D3E">错误 +{gotScore}</Tag>
                ) : (
                  <Tag color="#999">未作答 +0</Tag>
                )}
              </div>
            </div>

            {/* 题目内容 */}
            <div style={{ fontSize: 14, lineHeight: 1.8, marginBottom: 16 }}>
              {q.content}
            </div>

            {/* 选项（选择题/判断题） */}
            {(q.type === 1 || q.type === 4) && options.length > 0 && (
              <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {options.map((opt, i) => {
                  const letter = String.fromCharCode(65 + i)
                  const isUserPick = userAnswer === letter
                  const isCorrectAnswer = q.answer.trim() === letter
                  let bg = 'transparent'
                  let border = '1px solid var(--border-light, var(--border))'
                  if (isCorrectAnswer) { bg = '#E8F5E9'; border = '1px solid #A5D6A7' }
                  else if (isUserPick) { bg = '#FFEBEE'; border = '1px solid #EF9A9A' }
                  return (
                    <div key={i} style={{
                      padding: '8px 12px',
                      borderRadius: 'var(--radius)',
                      background: bg,
                      border,
                      fontSize: 13,
                    }}>
                      {letter}. {opt}
                      {isCorrectAnswer && <span style={{ color: '#4A7C59', marginLeft: 8, fontWeight: 600 }}>✓ 正确答案</span>}
                      {isUserPick && !isCorrectAnswer && <span style={{ color: '#C44D3E', marginLeft: 8 }}>✗ 你的选择</span>}
                    </div>
                  )
                })}
              </div>
            )}

            {/* 用户答案（非选择/判断题） */}
            {q.type !== 1 && q.type !== 4 && (
              <div style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 12, color: 'var(--ink-tertiary)' }}>你的答案：</Text>
                <div style={{
                  padding: '8px 12px',
                  background: userAnswer ? '#FFF8F0' : '#F5F5F5',
                  borderRadius: 'var(--radius)',
                  fontSize: 13,
                  marginTop: 4,
                  color: userAnswer ? 'var(--ink-primary)' : 'var(--ink-tertiary)',
                }}>
                  {userAnswer || '未作答'}
                </div>
              </div>
            )}

            <Divider style={{ margin: '12px 0' }} />

            {/* 正确答案 */}
            <div style={{ marginBottom: 8 }}>
              <Text style={{ fontSize: 12, color: '#4A7C59', fontWeight: 500 }}>正确答案：</Text>
              <Text style={{ fontSize: 13 }}>{q.answer}</Text>
            </div>

            {/* 解析 */}
            {q.analysis && (
              <div style={{
                padding: '10px 14px',
                background: '#F0F7FF',
                borderRadius: 'var(--radius)',
                fontSize: 13,
                color: 'var(--ink-secondary)',
                lineHeight: 1.7,
              }}>
                <Text style={{ fontSize: 12, color: '#5B8FA8', fontWeight: 500 }}>解析：</Text>
                <div style={{ marginTop: 4 }}>{q.analysis}</div>
              </div>
            )}
          </div>
        )
      })}

      {/* 底部操作 */}
      <div style={{ textAlign: 'center', paddingTop: 16, display: 'flex', gap: 12, justifyContent: 'center' }}>
        <Button onClick={() => navigate('/exam')}>返回组卷</Button>
        <Button type="primary" onClick={() => navigate('/subjects')}>继续学习</Button>
      </div>
    </div>
  )
}
