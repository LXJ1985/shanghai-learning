package com.learning.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.learning.common.result.Result;
import com.learning.common.util.SecurityContextUtil;
import com.learning.entity.PracticeRecord;
import com.learning.entity.Question;
import com.learning.service.PracticeService;
import com.learning.service.ProgressService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class PracticeController {

    private final PracticeService practiceService;
    private final ProgressService progressService;

    @GetMapping("/knowledges/{knowledgeId}/questions")
    public Result<Page<Question>> getQuestionsByKnowledge(
            @PathVariable Long knowledgeId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        return Result.success(practiceService.getQuestionsByKnowledge(knowledgeId, page, size));
    }

    @PostMapping("/practice/submit")
    public Result<PracticeRecord> submitAnswer(@RequestBody Map<String, Object> body) {
        Long userId = SecurityContextUtil.getCurrentUserId();
        Long questionId = Long.valueOf(body.get("questionId").toString());
        String userAnswer = (String) body.get("userAnswer");
        int timeSpent = Integer.parseInt(body.getOrDefault("timeSpent", 0).toString());
        return Result.success(practiceService.submitAnswer(userId, questionId, userAnswer, timeSpent));
    }

    @GetMapping("/practice/records")
    public Result<List<PracticeRecord>> getPracticeRecords() {
        Long userId = SecurityContextUtil.getCurrentUserId();
        return Result.success(practiceService.getPracticeRecords(userId, null, null));
    }

    // ========== F18: 学习进度 ==========

    /**
     * 学生学习进度（按学科汇总）
     */
    @GetMapping("/records/progress")
    public Result<List<Map<String, Object>>> getProgress() {
        Long userId = SecurityContextUtil.getCurrentUserId();
        return Result.success(progressService.getStudentProgress(userId));
    }

    /**
     * 学生某学科详细进度（按章节/知识点）
     */
    @GetMapping("/records/progress/{subjectId}")
    public Result<Map<String, Object>> getSubjectProgress(@PathVariable Long subjectId) {
        Long userId = SecurityContextUtil.getCurrentUserId();
        return Result.success(progressService.getSubjectDetailProgress(userId, subjectId));
    }

    // ========== F19: 家长查看孩子进度 ==========

    /**
     * 家长获取孩子列表（含进度摘要）
     */
    @GetMapping("/records/children")
    public Result<List<Map<String, Object>>> getChildren() {
        Long parentId = SecurityContextUtil.getCurrentUserId();
        return Result.success(progressService.getChildren(parentId));
    }

    /**
     * 家长查看指定孩子的学习进度
     */
    @GetMapping("/records/children/{childId}/progress")
    public Result<Map<String, Object>> getChildProgress(@PathVariable Long childId) {
        Long parentId = SecurityContextUtil.getCurrentUserId();
        return Result.success(progressService.getChildProgress(parentId, childId));
    }

    /**
     * 家长查看指定孩子的学科详细进度
     */
    @GetMapping("/records/children/{childId}/progress/{subjectId}")
    public Result<Map<String, Object>> getChildSubjectDetail(
            @PathVariable Long childId, @PathVariable Long subjectId) {
        Long parentId = SecurityContextUtil.getCurrentUserId();
        return Result.success(progressService.getChildSubjectDetail(parentId, childId, subjectId));
    }
}
