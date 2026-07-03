import request from './request'
import type { WrongQuestion, Result, PageResult } from '../types'

/** 获取错题列表 */
export const getWrongQuestionsApi = (params?: { subjectId?: number; page?: number; size?: number }) =>
  request.get<unknown, Result<PageResult<WrongQuestion>>>('/wrong-questions', { params })

/** 删除错题 */
export const removeWrongQuestionApi = (id: number) =>
  request.delete<unknown, Result<void>>(`/wrong-questions/${id}`)

/** 清空错题 */
export const clearWrongQuestionsApi = (subjectId?: number) =>
  request.delete<unknown, Result<void>>('/wrong-questions', { params: { subjectId } })
