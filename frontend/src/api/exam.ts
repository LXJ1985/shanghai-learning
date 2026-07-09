import request from './request'
import type { ExamInfo, ExamRecord, AnswerDetail, Result, PageResult } from '../types'

/** 智能组卷 */
export const createExamApi = (data: {
  title: string
  subjectId: number
  gradeId: number
  chapterId?: number
  questionCount: number
  timeLimit: number
  difficulty?: number
}) => request.post<unknown, Result<ExamInfo>>('/exams/create', data)

/** 获取试卷详情 */
export const getExamDetailApi = (id: number) =>
  request.get<unknown, Result<ExamInfo>>(`/exams/${id}`)

/** 开始考试 */
export const startExamApi = (examId: number) =>
  request.post<unknown, Result<ExamRecord>>(`/exams/${examId}/start`)

/** 提交试卷 */
export const submitExamApi = (recordId: number, data: { answers: AnswerDetail[] }) =>
  request.post<unknown, Result<ExamRecord>>(`/exams/records/${recordId}/submit`, data)

/** 获取考试记录列表 */
export const getExamRecordsApi = (params?: { subjectId?: number; page?: number; size?: number }) =>
  request.get<unknown, Result<PageResult<ExamRecord>>>('/exams/records', { params })

/** 获取考试记录详情 */
export const getExamRecordDetailApi = (recordId: number) =>
  request.get<unknown, Result<ExamRecord & { answerDetails: AnswerDetail[] }>>(`/exams/records/${recordId}`)
