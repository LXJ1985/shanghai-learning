package com.learning.common.aspect;

import cn.hutool.json.JSONUtil;
import com.learning.common.annotation.OpLog;
import com.learning.common.util.SecurityContextUtil;
import com.learning.entity.OperationLog;
import com.learning.mapper.OperationLogMapper;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;

/**
 * 操作日志 AOP 切面，拦截 @OpLog 注解自动记录日志
 */
@Aspect
@Component
@Slf4j
@RequiredArgsConstructor
public class OperationLogAspect {

    private final OperationLogMapper operationLogMapper;

    /** 请求参数最大长度，超过则截断 */
    private static final int MAX_PARAMS_LENGTH = 2000;

    @Around("@annotation(opLog)")
    public Object around(ProceedingJoinPoint point, OpLog opLog) throws Throwable {
        long startTime = System.currentTimeMillis();
        OperationLog logEntry = buildLogEntry(point, opLog);

        Object result;
        try {
            result = point.proceed();
            logEntry.setStatus(1);
            logEntry.setResponseCode(200);
        } catch (Throwable ex) {
            logEntry.setStatus(0);
            logEntry.setResponseCode(500);
            String msg = ex.getMessage();
            if (msg != null && msg.length() > 500) {
                msg = msg.substring(0, 500);
            }
            logEntry.setErrorMsg(msg);
            throw ex;
        } finally {
            logEntry.setDuration(System.currentTimeMillis() - startTime);
            // 异步保存日志，避免阻塞业务
            saveLog(logEntry);
        }
        return result;
    }

    /**
     * 构建日志条目
     */
    private OperationLog buildLogEntry(ProceedingJoinPoint point, OpLog opLog) {
        OperationLog entry = new OperationLog();
        entry.setModule(opLog.module());
        entry.setOperation(opLog.operation());
        entry.setCreatedAt(LocalDateTime.now());

        // 获取当前用户
        try {
            entry.setUserId(SecurityContextUtil.getCurrentUserId());
            entry.setUsername(SecurityContextUtil.getCurrentUsername());
        } catch (Exception e) {
            entry.setUsername("anonymous");
        }

        // 获取请求信息
        ServletRequestAttributes attrs =
                (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attrs != null) {
            HttpServletRequest request = attrs.getRequest();
            entry.setRequestUrl(request.getRequestURI());
            entry.setRequestMethod(request.getMethod());
            entry.setIp(getClientIp(request));
        }

        // 获取方法信息
        MethodSignature sig = (MethodSignature) point.getSignature();
        entry.setMethod(sig.getDeclaringTypeName() + "." + sig.getName());

        // 获取请求参数（过滤文件上传）
        try {
            Object[] args = point.getArgs();
            String[] paramNames = sig.getParameterNames();
            if (paramNames != null && args != null) {
                StringBuilder sb = new StringBuilder();
                for (int i = 0; i < paramNames.length; i++) {
                    if (args[i] instanceof MultipartFile) {
                        sb.append(paramNames[i]).append("=[文件]");
                    } else if (args[i] instanceof HttpServletRequest) {
                        // 跳过 request 对象
                        continue;
                    } else {
                        String json = JSONUtil.toJsonStr(args[i]);
                        if (json.length() > 200) {
                            json = json.substring(0, 200) + "...";
                        }
                        sb.append(paramNames[i]).append("=").append(json);
                    }
                    if (i < paramNames.length - 1) {
                        sb.append(", ");
                    }
                }
                String params = sb.toString();
                if (params.length() > MAX_PARAMS_LENGTH) {
                    params = params.substring(0, MAX_PARAMS_LENGTH) + "...";
                }
                entry.setRequestParams(params);
            }
        } catch (Exception e) {
            log.warn("解析请求参数失败", e);
        }

        return entry;
    }

    /**
     * 保存日志（异步）
     */
    private void saveLog(OperationLog logEntry) {
        try {
            operationLogMapper.insert(logEntry);
        } catch (Exception e) {
            log.error("保存操作日志失败", e);
        }
    }

    /**
     * 获取客户端真实 IP
     */
    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("X-Real-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        // 多个代理时取第一个
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        return ip;
    }
}
