package com.learning.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 操作日志实体
 */
@Data
@TableName("t_operation_log")
public class OperationLog {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 操作人ID */
    private Long userId;

    /** 操作人用户名 */
    private String username;

    /** 模块名称 */
    private String module;

    /** 操作描述 */
    private String operation;

    /** 请求方法(类名.方法名) */
    private String method;

    /** 请求URL */
    private String requestUrl;

    /** HTTP方法 */
    private String requestMethod;

    /** 请求参数(JSON) */
    private String requestParams;

    /** 响应状态码 */
    private Integer responseCode;

    /** 操作IP */
    private String ip;

    /** 耗时(毫秒) */
    private Long duration;

    /** 状态: 0-失败 1-成功 */
    private Integer status;

    /** 错误信息 */
    private String errorMsg;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
