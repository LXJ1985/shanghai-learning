import request from './request'
import type { QuestionInfo, Result, PageResult } from '../types'

/** 题目CRUD */
export const getQuestionsApi = (params: {
  subjectId?: number
  chapterId?: number
  type?: number
  keyword?: string
  page?: number
  size?: number
}) => request.get<unknown, Result<PageResult<QuestionInfo>>>('/admin/questions', { params })

export const createQuestionApi = (data: Partial<QuestionInfo>) =>
  request.post<unknown, Result<QuestionInfo>>('/admin/questions', data)

export const updateQuestionApi = (id: number, data: Partial<QuestionInfo>) =>
  request.put<unknown, Result<QuestionInfo>>(`/admin/questions/${id}`, data)

export const deleteQuestionApi = (id: number) =>
  request.delete<unknown, Result<void>>(`/admin/questions/${id}`)

/** 批量导入题目(文件上传) */
export const importQuestionsApi = (file: File, subjectId?: number) => {
  const formData = new FormData()
  formData.append('file', file)
  if (subjectId) formData.append('subjectId', String(subjectId))
  return request.post<unknown, Result<{ success: number; fail: number; errors: string[] }>>(
    '/admin/questions/import',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  )
}

/** 下载导入模板 */
export const downloadTemplateApi = (format: 'txt' | 'csv' | 'xlsx' = 'txt') =>
  request.get('/admin/questions/template', { params: { format }, responseType: 'blob' })

/** 批量导入章节(文件上传) */
export const importChaptersApi = (file: File, subjectId?: number, gradeId?: number) => {
  const formData = new FormData()
  formData.append('file', file)
  if (subjectId) formData.append('subjectId', String(subjectId))
  if (gradeId) formData.append('gradeId', String(gradeId))
  return request.post<unknown, Result<{ success: number; fail: number; errors: string[] }>>(
    '/admin/chapters/import',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  )
}

/** 下载章节导入模板 */
export const downloadChapterTemplateApi = (format: 'txt' | 'csv' | 'xlsx' = 'txt') =>
  request.get('/admin/chapters/template', { params: { format }, responseType: 'blob' })

/** 批量导入知识点(文件上传) */
export const importKnowledgesApi = (file: File, chapterId?: number) => {
  const formData = new FormData()
  formData.append('file', file)
  if (chapterId) formData.append('chapterId', String(chapterId))
  return request.post<unknown, Result<{ success: number; fail: number; errors: string[] }>>(
    '/admin/knowledges/import',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  )
}

/** 下载知识点导入模板 */
export const downloadKnowledgeTemplateApi = (
  format: 'txt' | 'csv' | 'xlsx' = 'txt',
  params?: { subjectId?: number; gradeId?: number; chapterId?: number }
) =>
  request.get('/admin/knowledges/template', {
    params: { format, ...params },
    responseType: 'blob',
  })

/** 获取学习统计(管理员) */
export const getLearningStatsApi = (params?: { userId?: number; subjectId?: number }) =>
  request.get<unknown, Result<Record<string, unknown>>>('/admin/stats', { params })

/** 获取学生列表(管理员) */
export const getStudentsApi = (parentId?: number) =>
  request.get<unknown, Result<Record<string, unknown>[]>>('/admin/students', { params: { parentId } })
