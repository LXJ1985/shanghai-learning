import request from './request'
import type { Result } from '../types'

/** 学科进度汇总 */
export interface SubjectProgress {
  subjectId: number
  subjectName: string
  totalKnowledge: number
  practicedKnowledge: number
  masteredKnowledge: number
  progressRate: number
  totalAnswered: number
  totalCorrect: number
  correctRate: number
}

/** 知识点进度 */
export interface KnowledgeProgress {
  knowledgeId: number
  knowledgeName: string
  answered: number
  correct: number
  correctRate: number
  status: 'NOT_STARTED' | 'PRACTICING' | 'MASTERED'
}

/** 章节节点（含知识点进度） */
export interface ChapterProgressNode {
  id: number
  name: string
  knowledges?: KnowledgeProgress[]
  children?: ChapterProgressNode[]
}

/** 学科详细进度 */
export interface SubjectDetailProgress {
  subjectId: number
  subjectName: string
  chapterTree: ChapterProgressNode[]
}

/** 孩子信息 */
export interface ChildInfo {
  id: number
  nickname: string
  username: string
  totalAnswered: number
  totalCorrect: number
  correctRate: number
}

/** 孩子学习进度 */
export interface ChildProgress {
  childId: number
  childName: string
  subjectProgress: SubjectProgress[]
}

/** 获取学生学习进度（按学科汇总） */
export const getProgressApi = () =>
  request.get<unknown, Result<SubjectProgress[]>>('/records/progress')

/** 获取学科详细进度 */
export const getSubjectProgressApi = (subjectId: number) =>
  request.get<unknown, Result<SubjectDetailProgress>>(`/records/progress/${subjectId}`)

/** 获取孩子列表 */
export const getChildrenApi = () =>
  request.get<unknown, Result<ChildInfo[]>>('/records/children')

/** 获取孩子学习进度 */
export const getChildProgressApi = (childId: number) =>
  request.get<unknown, Result<ChildProgress>>(`/records/children/${childId}/progress`)

/** 获取孩子学科详细进度 */
export const getChildSubjectProgressApi = (childId: number, subjectId: number) =>
  request.get<unknown, Result<SubjectDetailProgress & { childId: number; childName: string }>>(
    `/records/children/${childId}/progress/${subjectId}`
  )
