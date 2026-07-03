// 用户相关类型
export interface UserInfo {
  id: number
  username: string
  nickname: string
  role: number // 1-学生 2-家长/管理员
  parentId?: number
  status: number
}

export interface LoginParams {
  username: string
  password: string
}

export interface RegisterParams {
  username: string
  password: string
  nickname: string
  role: number
}

export interface LoginResult {
  token: string
  userInfo: UserInfo
}

// 学科相关
export interface SubjectInfo {
  id: number
  name: string
  sortOrder: number
}

export interface GradeInfo {
  id: number
  name: string
  sortOrder: number
}

export interface ChapterInfo {
  id: number
  subjectId: number
  gradeId: number
  parentId: number
  name: string
  sortOrder: number
  children?: ChapterInfo[]
}

export interface KnowledgeInfo {
  id: number
  chapterId: number
  name: string
  summary: string
  keyPoints: string
  formulas?: string
  examples?: string
  sortOrder: number
}

// 题目相关
export type QuestionType = 1 | 2 | 3 | 4 | 5 | 6 | 7
// 1-选择题 2-填空题 3-解答题 4-判断题 5-简答题 6-作文题 7-综合题

export interface QuestionInfo {
  id: number
  subjectId: number
  chapterId: number
  knowledgeId: number
  type: QuestionType
  content: string
  options?: string // JSON: ["A.xxx", "B.xxx", ...]
  answer: string
  analysis?: string
  difficulty: number // 1-5
  score: number
}

// 做题相关
export interface PracticeRecord {
  id: number
  userId: number
  questionId: number
  userAnswer: string
  isCorrect: number // 0-错误 1-正确
  score: number
  timeSpent: number // 秒
  createdAt: string
}

// 考试/组卷相关
export interface ExamInfo {
  id: number
  userId: number
  title: string
  subjectId: number
  chapterId?: number
  totalScore: number
  timeLimit: number // 分钟
  questions: ExamQuestionInfo[]
  createdAt: string
}

export interface ExamQuestionInfo {
  id: number
  examId: number
  questionId: number
  sortOrder: number
  score: number
  question?: QuestionInfo
}

export interface ExamRecord {
  id: number
  examId: number
  userId: number
  totalScore: number
  timeSpent: number
  status: number // 0-进行中 1-已完成
  createdAt: string
}

export interface AnswerDetail {
  id: number
  examRecordId: number
  examQuestionId: number
  userAnswer: string
  score: number
  isCorrect: number
  aiComment?: string
}

// 错题本
export interface WrongQuestion {
  id: number
  userId: number
  questionId: number
  wrongAnswer: string
  correctAnswer: string
  wrongCount: number
  question?: QuestionInfo
}

// 通用
export interface PageResult<T> {
  records: T[]
  total: number
  size: number
  current: number
  pages: number
}

export interface Result<T> {
  code: number
  message: string
  data: T
}
