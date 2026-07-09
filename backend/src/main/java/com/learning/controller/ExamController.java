package com.learning.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.learning.common.result.Result;
import com.learning.common.util.SecurityContextUtil;
import com.learning.entity.Exam;
import com.learning.entity.ExamRecord;
import com.learning.service.ExamService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/exams")
@RequiredArgsConstructor
public class ExamController {

    private final ExamService examService;

    @PostMapping("/create")
    public Result<Exam> createExam(@RequestBody Map<String, Object> body) {
        Long userId = SecurityContextUtil.getCurrentUserId();
        Exam exam = examService.createExam(
            userId,
            (String) body.get("title"),
            Long.valueOf(body.get("subjectId").toString()),
            Long.valueOf(body.get("gradeId").toString()),
            body.get("chapterId") != null ? Long.valueOf(body.get("chapterId").toString()) : null,
            Integer.parseInt(body.get("questionCount").toString()),
            Integer.parseInt(body.get("timeLimit").toString()),
            body.get("difficulty") != null ? Integer.parseInt(body.get("difficulty").toString()) : null
        );
        return Result.success(exam);
    }

    @GetMapping("/{id}")
    public Result<Map<String, Object>> getExamDetail(@PathVariable Long id) {
        return Result.success(examService.getExamDetail(id));
    }

    @PostMapping("/{examId}/start")
    public Result<ExamRecord> startExam(@PathVariable Long examId) {
        Long userId = SecurityContextUtil.getCurrentUserId();
        return Result.success(examService.startExam(examId, userId));
    }

    @PostMapping("/records/{recordId}/submit")
    public Result<ExamRecord> submitExam(
            @PathVariable Long recordId,
            @RequestBody Map<String, List<Map<String, Object>>> body) {
        return Result.success(examService.submitExam(recordId, body.get("answers")));
    }

    @GetMapping("/records")
    public Result<Page<ExamRecord>> getExamRecords(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        Long userId = SecurityContextUtil.getCurrentUserId();
        return Result.success(examService.getExamRecords(userId, page, size));
    }

    @GetMapping("/records/{recordId}")
    public Result<Map<String, Object>> getExamRecordDetail(@PathVariable Long recordId) {
        return Result.success(examService.getExamRecordDetail(recordId));
    }
}
