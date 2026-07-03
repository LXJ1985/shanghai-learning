package com.learning.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.learning.common.result.Result;
import com.learning.entity.OperationLog;
import com.learning.service.OperationLogService;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

/**
 * 操作日志控制器（仅管理员可访问）
 */
@RestController
@RequestMapping("/api/admin/logs")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class OperationLogController {

    private final OperationLogService operationLogService;

    /**
     * 分页查询操作日志
     */
    @GetMapping
    public Result<Page<OperationLog>> getLogs(
            @RequestParam(required = false) String module,
            @RequestParam(required = false) String username,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss") LocalDateTime startTime,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss") LocalDateTime endTime,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        return Result.success(operationLogService.getLogs(module, username, startTime, endTime, page, size));
    }

    /**
     * 获取所有模块列表
     */
    @GetMapping("/modules")
    public Result<List<String>> getModules() {
        return Result.success(operationLogService.getModules());
    }

    /**
     * 导出操作日志为 Excel
     */
    @GetMapping("/export")
    public void exportLogs(
            @RequestParam(required = false) String module,
            @RequestParam(required = false) String username,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss") LocalDateTime startTime,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss") LocalDateTime endTime,
            HttpServletResponse response) throws IOException {

        // 查询数据（最多导出 5000 条）
        Page<OperationLog> page = operationLogService.getLogs(module, username, startTime, endTime, 1, 5000);

        // 生成 Excel
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("操作日志");

            // 表头样式
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setFontHeightInPoints((short) 11);
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setBorderBottom(BorderStyle.THIN);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);

            // 表头
            String[] headers = {"ID", "操作人", "模块", "操作", "请求方法", "URL", "HTTP方法",
                    "IP", "耗时(ms)", "状态", "错误信息", "操作时间"};
            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // 数据行
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
            int rowIdx = 1;
            for (OperationLog log : page.getRecords()) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(log.getId());
                row.createCell(1).setCellValue(log.getUsername() != null ? log.getUsername() : "");
                row.createCell(2).setCellValue(log.getModule() != null ? log.getModule() : "");
                row.createCell(3).setCellValue(log.getOperation() != null ? log.getOperation() : "");
                row.createCell(4).setCellValue(log.getMethod() != null ? log.getMethod() : "");
                row.createCell(5).setCellValue(log.getRequestUrl() != null ? log.getRequestUrl() : "");
                row.createCell(6).setCellValue(log.getRequestMethod() != null ? log.getRequestMethod() : "");
                row.createCell(7).setCellValue(log.getIp() != null ? log.getIp() : "");
                row.createCell(8).setCellValue(log.getDuration() != null ? log.getDuration() : 0);
                row.createCell(9).setCellValue(log.getStatus() != null && log.getStatus() == 1 ? "成功" : "失败");
                row.createCell(10).setCellValue(log.getErrorMsg() != null ? log.getErrorMsg() : "");
                row.createCell(11).setCellValue(log.getCreatedAt() != null ? log.getCreatedAt().format(fmt) : "");
            }

            // 自动列宽
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
                // 限制最大宽度
                if (sheet.getColumnWidth(i) > 15000) {
                    sheet.setColumnWidth(i, 15000);
                }
            }

            // 写入响应
            String fileName = URLEncoder.encode("操作日志_" + LocalDateTime.now().format(fmt) + ".xlsx",
                    StandardCharsets.UTF_8);
            response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            response.setHeader("Content-Disposition", "attachment; filename=" + fileName);
            workbook.write(response.getOutputStream());
        }
    }
}
