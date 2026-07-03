import request from './request'
import type { LoginParams, RegisterParams, LoginResult, UserInfo, Result } from '../types'

/** 登录 */
export const loginApi = (data: LoginParams) =>
  request.post<unknown, Result<LoginResult>>('/auth/login', data)

/** 注册 */
export const registerApi = (data: RegisterParams) =>
  request.post<unknown, Result<void>>('/auth/register', data)

/** 获取当前用户信息 */
export const getCurrentUserApi = () =>
  request.get<unknown, Result<UserInfo>>('/auth/current-user')

/** 修改密码 */
export const changePasswordApi = (data: { oldPassword: string; newPassword: string }) =>
  request.put<unknown, Result<void>>('/auth/password', data)
