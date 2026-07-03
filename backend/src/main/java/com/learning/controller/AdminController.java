package com.learning.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.learning.common.annotation.OpLog;
import com.learning.common.result.Result;
import com.learning.entity.Question;
import com.learning.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import java.nio.charset.StandardCharsets;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/questions")
    public Result<Page<Question>> getQuestions(
            @RequestParam(required = false) Long subjectId,
            @RequestParam(required = false) Long chapterId,
            @RequestParam(required = false) Integer type,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        return Result.success(adminService.getQuestions(subjectId, chapterId, type, keyword, page, size));
    }

    @PostMapping("/questions")
    @OpLog(module = "题目管理", operation = "新增题目")
    public Result<Question> createQuestion(@RequestBody Question question) {
        return Result.success(adminService.createQuestion(question));
    }

    @PutMapping("/questions/{id}")
    @OpLog(module = "题目管理", operation = "修改题目")
    public Result<Question> updateQuestion(@PathVariable Long id, @RequestBody Question question) {
        return Result.success(adminService.updateQuestion(id, question));
    }

    @DeleteMapping("/questions/{id}")
    @OpLog(module = "题目管理", operation = "删除题目")
    public Result<Void> deleteQuestion(@PathVariable Long id) {
        adminService.deleteQuestion(id);
        return Result.success();
    }

    @PostMapping("/questions/import")
    @OpLog(module = "题目管理", operation = "导入题目")
    public Result<Map<String, Object>> importQuestions(
            @RequestParam("file") MultipartFile file,
            @RequestParam(required = false, defaultValue = "0") Long subjectId) {
        return Result.success(adminService.importQuestions(file, subjectId));
    }

    @GetMapping("/questions/template")
    public ResponseEntity<byte[]> downloadTemplate(
            @RequestParam(defaultValue = "txt") String format) throws Exception {
        switch (format.toLowerCase()) {
            case "csv": {
                String content = adminService.generateCsvTemplate();
                byte[] bytes = content.getBytes(StandardCharsets.UTF_8);
                return ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=question-import-template.csv")
                        .contentType(MediaType.parseMediaType("text/csv;charset=UTF-8"))
                        .body(bytes);
            }
            case "xlsx": {
                byte[] bytes = adminService.generateExcelTemplate();
                return ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=question-import-template.xlsx")
                        .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                        .body(bytes);
            }
            default: {
                String content = adminService.generateTxtTemplate();
                byte[] bytes = content.getBytes(StandardCharsets.UTF_8);
                return ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=question-import-template.txt")
                        .contentType(MediaType.TEXT_PLAIN)
                        .body(bytes);
            }
        }
    }

    @PostMapping("/chapters/import")
    @OpLog(module = "章节管理", operation = "导入章节")
    public Result<Map<String, Object>> importChapters(
            @RequestParam("file") MultipartFile file,
            @RequestParam(required = false, defaultValue = "0") Long subjectId,
            @RequestParam(required = false, defaultValue = "0") Long gradeId) {
        return Result.success(adminService.importChapters(file, subjectId, gradeId));
    }

    @GetMapping("/chapters/template")
    public ResponseEntity<byte[]> downloadChapterTemplate(
            @RequestParam(defaultValue = "txt") String format) throws Exception {
        switch (format.toLowerCase()) {
            case "csv": {
                String content = adminService.generateChapterCsvTemplate();
                byte[] bytes = content.getBytes(StandardCharsets.UTF_8);
                return ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=chapter-import-template.csv")
                        .contentType(MediaType.parseMediaType("text/csv;charset=UTF-8"))
                        .body(bytes);
            }
            case "xlsx": {
                byte[] bytes = adminService.generateChapterExcelTemplate();
                return ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=chapter-import-template.xlsx")
                        .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                        .body(bytes);
            }
            default: {
                String content = adminService.generateChapterTxtTemplate();
                byte[] bytes = content.getBytes(StandardCharsets.UTF_8);
                return ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=chapter-import-template.txt")
                        .contentType(MediaType.TEXT_PLAIN)
                        .body(bytes);
            }
        }
    }

    /**
     * 修复章节学科ID映射
     * 请求体示例: {"1": 2, "2": 1, "4": 9} 表示: 学科1->2, 学科2->1, 学科4->9
     */
    @PostMapping("/chapters/fix-subject")
    @OpLog(module = "章节管理", operation = "修复章节学科ID")
    public Result<Map<String, Object>> fixChapterSubjectIds(@RequestBody Map<Long, Long> mapping) {
        return Result.success(adminService.fixChapterSubjectIds(mapping));
    }

    /**
     * 清理旧章节数据（ID小于指定阈值的章节）
     */
    @DeleteMapping("/chapters/cleanup")
    @OpLog(module = "章节管理", operation = "清理旧章节数据")
    public Result<Integer> cleanupOldChapters(
            @RequestParam Long subjectId,
            @RequestParam Long maxId) {
        return Result.success(adminService.deleteChaptersBySubjectAndMaxId(subjectId, maxId));
    }

    /**
     * 修复章节年级ID映射
     * 请求体示例: {"6": 1, "7": 2, "8": 3, "9": 4} 表示: 年级6->1, 年级7->2, 年级8->3, 年级9->4
     */
    @PostMapping("/chapters/fix-grade")
    @OpLog(module = "章节管理", operation = "修复章节年级ID")
    public Result<Map<String, Object>> fixChapterGradeIds(@RequestBody Map<Long, Long> mapping) {
        return Result.success(adminService.fixChapterGradeIds(mapping));
    }

    @PostMapping("/knowledges/import")
    @OpLog(module = "知识点管理", operation = "导入知识点")
    public Result<Map<String, Object>> importKnowledges(
            @RequestParam("file") MultipartFile file,
            @RequestParam(required = false, defaultValue = "0") Long chapterId) {
        return Result.success(adminService.importKnowledges(file, chapterId));
    }

    @GetMapping("/knowledges/template")
    public ResponseEntity<byte[]> downloadKnowledgeTemplate(
            @RequestParam(defaultValue = "txt") String format,
            @RequestParam(required = false) Long subjectId,
            @RequestParam(required = false) Long gradeId,
            @RequestParam(required = false) Long chapterId) throws Exception {
        switch (format.toLowerCase()) {
            case "csv": {
                String content = adminService.generateKnowledgeCsvTemplate(chapterId, subjectId, gradeId);
                byte[] bytes = content.getBytes(StandardCharsets.UTF_8);
                return ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=knowledge-import-template.csv")
                        .contentType(MediaType.parseMediaType("text/csv;charset=UTF-8"))
                        .body(bytes);
            }
            case "xlsx": {
                byte[] bytes = adminService.generateKnowledgeExcelTemplate(chapterId, subjectId, gradeId);
                return ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=knowledge-import-template.xlsx")
                        .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                        .body(bytes);
            }
            default: {
                String content = adminService.generateKnowledgeTxtTemplate(chapterId, subjectId, gradeId);
                byte[] bytes = content.getBytes(StandardCharsets.UTF_8);
                return ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=knowledge-import-template.txt")
                        .contentType(MediaType.TEXT_PLAIN)
                        .body(bytes);
            }
        }
    }
}
