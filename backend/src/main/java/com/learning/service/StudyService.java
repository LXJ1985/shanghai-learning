package com.learning.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.learning.entity.*;
import com.learning.mapper.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StudyService {

    private final SubjectMapper subjectMapper;
    private final GradeMapper gradeMapper;
    private final ChapterMapper chapterMapper;
    private final KnowledgeMapper knowledgeMapper;

    public List<Subject> getSubjects() {
        return subjectMapper.selectList(
            new LambdaQueryWrapper<Subject>().orderByAsc(Subject::getSortOrder)
        );
    }

    public List<Grade> getGrades() {
        return gradeMapper.selectList(
            new LambdaQueryWrapper<Grade>().orderByAsc(Grade::getSortOrder)
        );
    }

    /**
     * 获取章节树
     */
    public List<Map<String, Object>> getChapterTree(Long subjectId, Long gradeId) {
        LambdaQueryWrapper<Chapter> wrapper = new LambdaQueryWrapper<Chapter>()
                .eq(Chapter::getSubjectId, subjectId);
        if (gradeId != null && gradeId > 0) {
            wrapper.eq(Chapter::getGradeId, gradeId);
        }
        List<Chapter> chapters = chapterMapper.selectList(
                wrapper.orderByAsc(Chapter::getSortOrder)
        );

        return buildTree(chapters, 0L);
    }

    private List<Map<String, Object>> buildTree(List<Chapter> chapters, Long parentId) {
        return chapters.stream()
            .filter(ch -> ch.getParentId().equals(parentId))
            .map(ch -> {
                Map<String, Object> node = new LinkedHashMap<>();
                node.put("id", ch.getId());
                node.put("name", ch.getName());
                node.put("sortOrder", ch.getSortOrder());
                List<Map<String, Object>> children = buildTree(chapters, ch.getId());
                if (!children.isEmpty()) {
                    node.put("children", children);
                }
                return node;
            })
            .collect(Collectors.toList());
    }

    public List<Knowledge> getKnowledgeList(Long chapterId) {
        return knowledgeMapper.selectList(
            new LambdaQueryWrapper<Knowledge>()
                .eq(Knowledge::getChapterId, chapterId)
                .orderByAsc(Knowledge::getSortOrder)
        );
    }

    public Knowledge getKnowledgeDetail(Long id) {
        return knowledgeMapper.selectById(id);
    }
}
