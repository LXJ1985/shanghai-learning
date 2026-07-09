import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button, Radio, Input, message, Typography, Modal, Tag } from 'antd'
import { getExamDetailApi, startExamApi, submitExamApi } from '../../api/exam'

const { Text, Title } = Typography
const { TextArea } = Input

interface ExamQuestion {
  examQuestionId: number
  sortOrder: number
  score: number
  question: {
    id: number
    type: number
    content: string
    options?: string
    answer: string
    analysis?: string
    difficulty: number
    score: number
  }
}

interface ExamData {
  id: number
  title: string
  totalScore: number
  duration: number
  questions: ExamQuestion[]
}

const TYPE_LABELS: Record<number, string> = {
  1: '选择题', 2: '填空题', 3: '解答题', 4: '判断题',
  5: '简答题', 6: '作文题', 7: '综合题',
}

const TYPE_COLORS: Record<number, string> = {
  1: '#C45D3E', 2: '#4A7C59', 3: '#D4A853', 4: '#5B8FA8',
  5: '#8B6CC1', 6: '#C47A5A', 7: '#6B8E7B',
}

export default function ExamTaking() {
  const { examId } = useParams<{ examId: string }>()
  const navigate = useNavigate()

  const [exam, setExam] = useState<ExamData | null>(null)
  const [recordId, setRecordId] = useState<number | null>(null)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [remaining, setRemaining] = useState(0) // 秒
  const [submitting, setSubmitting] = useState(false)
  const [started, setStarted] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval>>()

  // 加载试卷
  useEffect(() => {
    if (!examId) return
    getExamDetailApi(Number(examId)).then((res) => {
      const data = res.data as any
      const examData: ExamData = {
        id: data.exam?.id ?? data.id,
        title: data.exam?.title ?? data.title,
        totalScore: data.exam?.totalScore ?? data.totalScore,
        duration: data.exam?.duration ?? data.timeLimit ?? 30,
        questions: (data.questions || []).map((q: any) => ({
          examQuestionId: q.examQuestionId,
          sortOrder: q.sortOrder,
          score: q.score,
          question: q.question,
        })),
      }
      setExam(examData)
      setRemaining(examData.duration * 60)
    }).catch(() => {
      message.error('加载试卷失败')
      navigate('/exam')
    })
  }, [examId, navigate])

  // 倒计时
  useEffect(() => {
    if (!started || remaining <= 0) return
    timerRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          handleSubmit(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [started])

  const handleStart = useCallback(async () => {
    if (!exam) return
    try {
      const res = await startExamApi(exam.id)
      setRecordId(res.data.id)
      setStarted(true)
    } catch {
      message.error('开始考试失败')
    }
  }, [exam])

  const setAnswer = (examQuestionId: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [examQuestionId]: value }))
  }

  const handleSubmit = async (auto = false) => {
    if (!recordId || !exam) return
    if (auto) {
      Modal.warning({ title: '时间到', content: '考试已结束，系统自动提交试卷。' })
    }
    setSubmitting(true)
    try {
      const answerList = exam.questions.map((q) => ({
        examQuestionId: q.examQuestionId,
        userAnswer: answers[q.examQuestionId] || '',
      }))
      const res = await submitExamApi(recordId, { answers: answerList as any })
      message.success(auto ? '试卷已自动提交' : '提交成功')
      navigate(`/exam/result/${recordId}`)
    } catch {
      message.error('提交失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
  }

  const answeredCount = Object.values(answers).filter((v) => v && v.trim()).length
  const totalCount = exam?.questions.length ?? 0

  if (!exam) return null

  // 未开始 - 显示考试信息
  if (!started) {
    return (
      <div style={{ maxWidth: 600, margin: '40px auto', padding: '0 16px' }}>
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: 40,
          textAlign: 'center',
        }}>
          <Title level={3} style={{ marginBottom: 8, fontFamily: 'var(--font-serif)' }}>
            {exam.title}
          </Title>
          <div style={{ color: 'var(--ink-tertiary)', marginBottom: 32, fontSize: 14 }}>
            共 {totalCount} 题 · 总分 {exam.totalScore} 分 · 限时 {exam.duration} 分钟
          </div>
          <div style={{
            background: '#FFF8F0',
            border: '1px solid #F0DCC8',
            borderRadius: 'var(--radius)',
            padding: '16px 24px',
            marginBottom: 32,
            textAlign: 'left',
            fontSize: 13,
            color: 'var(--ink-secondary)',
            lineHeight: 1.8,
          }}>
            <div>· 选择题请直接选择答案</div>
            <div>· 填空题和解答题请输入文字作答</div>
            <div>· 倒计时结束后系统将自动提交试卷</div>
            <div>· 提交后可查看正确答案和解析</div>
          </div>
          <Button type="primary" size="large" onClick={handleStart} style={{ minWidth: 160 }}>
            开始答题
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 780, margin: '0 auto', padding: '0 16px 80px' }}>
      {/* 顶部信息栏 */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '12px 24px',
        marginBottom: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backdropFilter: 'blur(8px)',
      }}>
        <div>
          <Text strong style={{ fontSize: 15 }}>{exam.title}</Text>
          <Text style={{ marginLeft: 16, fontSize: 12, color: 'var(--ink-tertiary)' }}>
            已答 {answeredCount}/{totalCount}
          </Text>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            fontSize: 20,
            fontWeight: 600,
            fontFamily: 'var(--font-mono, monospace)',
            color: remaining < 60 ? '#C44D3E' : remaining < 300 ? '#D4A853' : 'var(--ink-primary)',
          }}>
            {formatTime(remaining)}
          </div>
          <Button
            type="primary"
            danger
            loading={submitting}
            onClick={() => {
              Modal.confirm({
                title: '确认交卷',
                content: `还有 ${totalCount - answeredCount} 题未作答，确认提交吗？`,
                onOk: () => handleSubmit(false),
              })
            }}
          >
            交卷
          </Button>
        </div>
      </div>

      {/* 题目列表 */}
      {exam.questions.map((eq, idx) => {
        const q = eq.question
        const qType = q.type
        const isChoice = qType === 1
        const isJudge = qType === 4
        const userAnswer = answers[eq.examQuestionId] || ''

        let options: string[] = []
        if ((isChoice || isJudge) && q.options) {
          try {
            const parsed = JSON.parse(q.options)
            options = parsed.map((item: any) => {
              if (typeof item === 'string') return item
              // 对象格式: {label: "A", content: "..."} 或 {label: "A. xxx"}
              if (item.content) return `${item.label}. ${item.content}`
              return String(item.label || item)
            })
          } catch { /* ignore */ }
        }

        return (
          <div key={eq.examQuestionId} style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
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
                background: userAnswer ? '#4A7C59' : '#EDE7E0',
                color: userAnswer ? '#fff' : 'var(--ink-tertiary)',
                fontSize: 13,
                fontWeight: 600,
                flexShrink: 0,
              }}>
                {idx + 1}
              </span>
              <Tag color={TYPE_COLORS[qType] || '#6B6560'} style={{ margin: 0 }}>
                {TYPE_LABELS[qType] || '其他'}
              </Tag>
              <Text style={{ fontSize: 12, color: 'var(--ink-tertiary)' }}>
                {eq.score} 分
              </Text>
              <div style={{ marginLeft: 'auto', fontSize: 12 }}>
                {'★'.repeat(q.difficulty)}{'☆'.repeat(5 - q.difficulty)}
              </div>
            </div>

            {/* 题目内容 */}
            <div style={{ fontSize: 14, lineHeight: 1.8, marginBottom: 16, color: 'var(--ink-primary)' }}>
              {q.content}
            </div>

            {/* 答题区 */}
            {isChoice ? (
              <Radio.Group
                value={userAnswer || undefined}
                onChange={(e) => setAnswer(eq.examQuestionId, e.target.value)}
                style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
              >
                {options.map((opt, i) => (
                  <Radio key={i} value={String.fromCharCode(65 + i)} style={{ marginLeft: 0 }}>
                    {opt}
                  </Radio>
                ))}
              </Radio.Group>
            ) : isJudge ? (
              <Radio.Group
                value={userAnswer || undefined}
                onChange={(e) => setAnswer(eq.examQuestionId, e.target.value)}
              >
                {options.length > 0
                  ? options.map((opt, i) => (
                    <Radio key={i} value={String.fromCharCode(65 + i)}>{opt}</Radio>
                  ))
                  : <>
                    <Radio value="正确">正确</Radio>
                    <Radio value="错误">错误</Radio>
                  </>
                }
              </Radio.Group>
            ) : (
              <TextArea
                value={userAnswer}
                onChange={(e) => setAnswer(eq.examQuestionId, e.target.value)}
                placeholder={qType === 2 ? '请输入答案' : '请输入解答过程'}
                autoSize={{ minRows: 2, maxRows: 8 }}
                style={{ fontSize: 14 }}
              />
            )}
          </div>
        )
      })}

      {/* 底部交卷按钮 */}
      <div style={{ textAlign: 'center', paddingTop: 16 }}>
        <Button
          type="primary"
          size="large"
          loading={submitting}
          style={{ minWidth: 200 }}
          onClick={() => {
            Modal.confirm({
              title: '确认交卷',
              content: `已答 ${answeredCount}/${totalCount} 题，确认提交吗？`,
              onOk: () => handleSubmit(false),
            })
          }}
        >
          交卷
        </Button>
      </div>
    </div>
  )
}
