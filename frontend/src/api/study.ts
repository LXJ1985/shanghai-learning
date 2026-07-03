import request from './request'
import type { SubjectInfo, GradeInfo, ChapterInfo, KnowledgeInfo, Result } from '../types'

/** 获取学科列表 */
export const getSubjectsApi = () =>
  request.get<unknown, Result<SubjectInfo[]>>('/subjects')

/** 获取年级列表 */
export const getGradesApi = () =>
  request.get<unknown, Result<GradeInfo[]>>('/grades')

/** 获取章节树 */
export const getChapterTreeApi = (subjectId: number, gradeId?: number) => {
  if (gradeId) {
    return request.get<unknown, Result<ChapterInfo[]>>(`/subjects/${subjectId}/grades/${gradeId}/chapters`)
  }
  return request.get<unknown, Result<ChapterInfo[]>>(`/subjects/${subjectId}/chapters`)
}

/** 获取知识点列表 */
export const getKnowledgeListApi = (chapterId: number) =>
  request.get<unknown, Result<KnowledgeInfo[]>>(`/chapters/${chapterId}/knowledges`)

/** 获取知识点详情 */
export const getKnowledgeDetailApi = (id: number) =>
  request.get<unknown, Result<KnowledgeInfo>>(`/knowledges/${id}`)
