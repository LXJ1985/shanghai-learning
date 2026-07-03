import request from './request'
import type { QuestionInfo, PracticeRecord, Result, PageResult } from '../types'

/** 获取题目列表(按知识点) */
export const getQuestionsByKnowledgeApi = (knowledgeId: number, page = 1, size = 10) =>
  request.get<unknown, Result<PageResult<QuestionInfo>>>(`/knowledges/${knowledgeId}/questions`, {
    params: { page, size },
  })

/** 获取题目详情 */
export const getQuestionDetailApi = (id: number) =>
  request.get<unknown, Result<QuestionInfo>>(`/questions/${id}`)

/** 提交练习答案 */
export const submitPracticeApi = (data: { questionId: number; userAnswer: string; timeSpent: number }) =>
  request.post<unknown, Result<PracticeRecord>>('/practice/submit', data)

/** 获取练习记录 */
export const getPracticeRecordsApi = (params?: { subjectId?: number; chapterId?: number }) =>
  request.get<unknown, Result<PracticeRecord[]>>('/practice/records', { params })
