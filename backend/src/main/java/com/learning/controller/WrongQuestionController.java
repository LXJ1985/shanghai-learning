package com.learning.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.learning.common.result.Result;
import com.learning.common.util.SecurityContextUtil;
import com.learning.entity.WrongQuestion;
import com.learning.service.WrongQuestionService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/wrong-questions")
@RequiredArgsConstructor
public class WrongQuestionController {

    private final WrongQuestionService wrongQuestionService;

    @GetMapping
    public Result<Page<WrongQuestion>> getWrongQuestions(
            @RequestParam(required = false) Long subjectId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        Long userId = SecurityContextUtil.getCurrentUserId();
        return Result.success(wrongQuestionService.getWrongQuestions(userId, subjectId, page, size));
    }

    @DeleteMapping("/{id}")
    public Result<Void> removeWrongQuestion(@PathVariable Long id) {
        Long userId = SecurityContextUtil.getCurrentUserId();
        wrongQuestionService.removeWrongQuestion(id, userId);
        return Result.success();
    }

    @DeleteMapping
    public Result<Void> clearWrongQuestions(@RequestParam(required = false) Long subjectId) {
        Long userId = SecurityContextUtil.getCurrentUserId();
        wrongQuestionService.clearWrongQuestions(userId, subjectId);
        return Result.success();
    }
}
