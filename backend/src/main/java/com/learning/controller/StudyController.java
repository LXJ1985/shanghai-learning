package com.learning.controller;

import com.learning.common.result.Result;
import com.learning.entity.*;
import com.learning.service.StudyService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class StudyController {

    private final StudyService studyService;

    @GetMapping("/subjects")
    public Result<List<Subject>> getSubjects() {
        return Result.success(studyService.getSubjects());
    }

    @GetMapping("/grades")
    public Result<List<Grade>> getGrades() {
        return Result.success(studyService.getGrades());
    }

    @GetMapping("/subjects/{subjectId}/grades/{gradeId}/chapters")
    public Result<List<Map<String, Object>>> getChapterTree(
            @PathVariable Long subjectId, @PathVariable Long gradeId) {
        return Result.success(studyService.getChapterTree(subjectId, gradeId));
    }

    @GetMapping("/subjects/{subjectId}/chapters")
    public Result<List<Map<String, Object>>> getChapterTreeBySubject(
            @PathVariable Long subjectId,
            @RequestParam(required = false) Long gradeId) {
        return Result.success(studyService.getChapterTree(subjectId, gradeId));
    }

    @GetMapping("/chapters/{chapterId}/knowledges")
    public Result<List<Knowledge>> getKnowledgeList(@PathVariable Long chapterId) {
        return Result.success(studyService.getKnowledgeList(chapterId));
    }

    @GetMapping("/knowledges/{id}")
    public Result<Knowledge> getKnowledgeDetail(@PathVariable Long id) {
        return Result.success(studyService.getKnowledgeDetail(id));
    }
}
