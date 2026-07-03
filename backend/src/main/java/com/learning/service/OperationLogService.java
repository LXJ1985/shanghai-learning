package com.learning.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.learning.entity.OperationLog;
import com.learning.mapper.OperationLogMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;

/**
 * 操作日志服务
 */
@Service
@RequiredArgsConstructor
public class OperationLogService {

    private final OperationLogMapper operationLogMapper;

    /**
     * 分页查询操作日志
     *
     * @param module    模块名称
     * @param username  操作人
     * @param startTime 开始时间
     * @param endTime   结束时间
     * @param page      页码
     * @param size      每页数量
     * @return 分页结果
     */
    public Page<OperationLog> getLogs(String module, String username,
                                      LocalDateTime startTime, LocalDateTime endTime,
                                      int page, int size) {
        LambdaQueryWrapper<OperationLog> wrapper = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(module)) {
            wrapper.eq(OperationLog::getModule, module);
        }
        if (StringUtils.hasText(username)) {
            wrapper.like(OperationLog::getUsername, username);
        }
        if (startTime != null) {
            wrapper.ge(OperationLog::getCreatedAt, startTime);
        }
        if (endTime != null) {
            wrapper.le(OperationLog::getCreatedAt, endTime);
        }
        wrapper.orderByDesc(OperationLog::getCreatedAt);
        return operationLogMapper.selectPage(new Page<>(page, size), wrapper);
    }

    /**
     * 查询所有模块名称（去重）
     *
     * @return 模块列表
     */
    public java.util.List<String> getModules() {
        LambdaQueryWrapper<OperationLog> wrapper = new LambdaQueryWrapper<>();
        wrapper.select(OperationLog::getModule).groupBy(OperationLog::getModule);
        return operationLogMapper.selectList(wrapper)
                .stream()
                .map(OperationLog::getModule)
                .distinct()
                .sorted()
                .toList();
    }
}
