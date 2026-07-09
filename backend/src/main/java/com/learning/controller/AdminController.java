package com.learning.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.learning.common.annotation.OpLog;
import com.learning.common.result.Result;
import com.learning.entity.Question;
import com.learning.service.AdminService;
import com.learning.service.AiCourseService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;
    private final AiCourseService aiCourseService;

    @GetMapping("/questions")
    public Result<Page<Question>> getQuestions(
            @RequestParam(required = false) Long subjectId,
            @RequestParam(required = false) Long gradeId,
            @RequestParam(required = false) String semester,
            @RequestParam(required = false) Long chapterId,
            @RequestParam(required = false) Integer type,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        return Result.success(adminService.getQuestions(subjectId, gradeId, semester, chapterId, type, keyword, page, size));
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
     * AI 智能获取课程信息 - 预览（不入库，返回原始数据供确认）
     */
    @PostMapping("/chapters/ai-fetch/preview")
    @OpLog(module = "章节管理", operation = "AI智能获取预览")
    public Result<Map<String, Object>> previewCourseByAi(
            @RequestParam Long gradeId,
            @RequestParam Long subjectId,
            @RequestParam String semester) {
        return Result.success(aiCourseService.previewCourseData(gradeId, subjectId, semester));
    }

    /**
     * AI 智能获取课程信息 - 确认保存
     */
    @PostMapping("/chapters/ai-fetch/confirm")
    @OpLog(module = "章节管理", operation = "AI智能获取确认保存")
    public Result<Map<String, Object>> confirmCourseByAi(
            @RequestParam Long gradeId,
            @RequestParam Long subjectId,
            @RequestBody List<Map<String, Object>> chapters) {
        return Result.success(aiCourseService.confirmCourseData(gradeId, subjectId, chapters));
    }

    /**
     * AI 智能搜题 - 预览
     */
    @PostMapping("/questions/ai-search/preview")
    @OpLog(module = "题库管理", operation = "AI智能搜题预览")
    public Result<Map<String, Object>> previewAiQuestions(
            @RequestParam Long gradeId,
            @RequestParam Long subjectId,
            @RequestParam String semester) {
        return Result.success(aiCourseService.previewAiQuestions(gradeId, subjectId, semester));
    }

    /**
     * AI 智能搜题 - 确认保存
     */
    @PostMapping("/questions/ai-search/confirm")
    @OpLog(module = "题库管理", operation = "AI智能搜题确认保存")
    public Result<Map<String, Object>> confirmAiQuestions(
            @RequestParam Long gradeId,
            @RequestParam Long subjectId,
            @RequestBody List<Map<String, Object>> questions) {
        return Result.success(aiCourseService.confirmAiQuestions(gradeId, subjectId, questions));
    }

    /**
     * AI 知识点导入 - 预览
     */
    @PostMapping("/knowledges/ai-import/preview")
    @OpLog(module = "知识点管理", operation = "AI知识点导入预览")
    public Result<Map<String, Object>> previewAiKnowledges(
            @RequestParam Long subjectId,
            @RequestParam Long gradeId,
            @RequestParam(required = false) Long chapterId,
            @RequestParam String semester) {
        return Result.success(aiCourseService.previewAiKnowledges(subjectId, gradeId, chapterId, semester));
    }

    /**
     * AI 知识点导入 - 确认保存
     */
    @PostMapping("/knowledges/ai-import/confirm")
    @OpLog(module = "知识点管理", operation = "AI知识点导入确认保存")
    public Result<Map<String, Object>> confirmAiKnowledges(
            @RequestBody List<Map<String, Object>> knowledges) {
        return Result.success(aiCourseService.confirmAiKnowledges(knowledges));
    }

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
