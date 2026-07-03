import request from './request'
import type { Result, PageResult } from '../types'

export interface OperationLogInfo {
  id: number
  userId: number
  username: string
  module: string
  operation: string
  method: string
  requestUrl: string
  requestMethod: string
  requestParams: string
  responseCode: number
  ip: string
  duration: number
  status: number
  errorMsg: string
  createdAt: string
}

/** 分页查询操作日志 */
export const getOperationLogsApi = (params: {
  module?: string
  username?: string
  startTime?: string
  endTime?: string
  page?: number
  size?: number
}) => request.get<unknown, Result<PageResult<OperationLogInfo>>>('/admin/logs', { params })

/** 获取模块列表 */
export const getLogModulesApi = () =>
  request.get<unknown, Result<string[]>>('/admin/logs/modules')

/** 导出操作日志 */
export const exportLogsApi = (params: {
  module?: string
  username?: string
  startTime?: string
  endTime?: string
}) => request.get('/admin/logs/export', { params, responseType: 'blob' })
