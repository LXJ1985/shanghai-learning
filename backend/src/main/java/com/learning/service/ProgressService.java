package com.learning.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.learning.common.exception.BusinessException;
import com.learning.entity.*;
import com.learning.mapper.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * 学习进度统计服务
 */
@Service
@RequiredArgsConstructor
public class ProgressService {

    private final PracticeRecordMapper practiceRecordMapper;
    private final QuestionMapper questionMapper;
    private final KnowledgeMapper knowledgeMapper;
    private final ChapterMapper chapterMapper;
    private final SubjectMapper subjectMapper;
    private final UserMapper userMapper;

    /**
     * 获取学生学习进度（按学科汇总）
     */
    public List<Map<String, Object>> getStudentProgress(Long userId) {
        // 获取所有学科
        List<Subject> subjects = subjectMapper.selectList(
            new LambdaQueryWrapper<Subject>().orderByAsc(Subject::getSortOrder)
        );

        // 获取学生所有做题记录
        List<PracticeRecord> records = practiceRecordMapper.selectList(
            new LambdaQueryWrapper<PracticeRecord>()
                .eq(PracticeRecord::getUserId, userId)
        );

        // 获取所有涉及的题目
        Set<Long> questionIds = records.stream()
            .map(PracticeRecord::getQuestionId)
            .collect(Collectors.toSet());

        Map<Long, Question> questionMap = new HashMap<>();
        if (!questionIds.isEmpty()) {
            List<Question> questions = questionMapper.selectBatchIds(questionIds);
            questionMap.putAll(questions.stream()
                .collect(Collectors.toMap(Question::getId, q -> q)));
        }
        final Map<Long, Question> qMap = questionMap;

        // 按学科统计进度
        List<Map<String, Object>> result = new ArrayList<>();
        for (Subject subject : subjects) {
            Map<String, Object> subjectProgress = new LinkedHashMap<>();
            subjectProgress.put("subjectId", subject.getId());
            subjectProgress.put("subjectName", subject.getName());

            // 该学科的做题记录
            List<PracticeRecord> subjectRecords = records.stream()
                .filter(r -> {
                    Question q = qMap.get(r.getQuestionId());
                    return q != null && subject.getId().equals(q.getSubjectId());
                })
                .toList();

            // 该学科涉及的知识点
            List<Question> subjectQuestions = qMap.values().stream()
                .filter(q -> subject.getId().equals(q.getSubjectId()))
                .toList();

            Set<Long> knowledgeIds = subjectQuestions.stream()
                .map(Question::getKnowledgeId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

            // 已练习的知识点
            Set<Long> practicedKnowledgeIds = subjectRecords.stream()
                .map(r -> qMap.get(r.getQuestionId()))
                .filter(Objects::nonNull)
                .map(Question::getKnowledgeId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

            // 掌握的知识点（正确率 >= 60%）
            Set<Long> masteredKnowledgeIds = new HashSet<>();
            Map<Long, List<PracticeRecord>> byKnowledge = subjectRecords.stream()
                .filter(r -> qMap.get(r.getQuestionId()) != null)
                .filter(r -> qMap.get(r.getQuestionId()).getKnowledgeId() != null)
                .collect(Collectors.groupingBy(
                    r -> qMap.get(r.getQuestionId()).getKnowledgeId()
                ));
            for (Map.Entry<Long, List<PracticeRecord>> entry : byKnowledge.entrySet()) {
                long correct = entry.getValue().stream()
                    .filter(r -> r.getIsCorrect() != null && r.getIsCorrect() == 1)
                    .count();
                double rate = (double) correct / entry.getValue().size();
                if (rate >= 0.6) {
                    masteredKnowledgeIds.add(entry.getKey());
                }
            }

            int totalKnowledge = knowledgeIds.size();
            int practicedKnowledge = practicedKnowledgeIds.size();
            int masteredKnowledge = masteredKnowledgeIds.size();
            double progressRate = totalKnowledge > 0
                ? (double) masteredKnowledge / totalKnowledge * 100 : 0;

            // 做题统计
            int totalAnswered = subjectRecords.size();
            long totalCorrect = subjectRecords.stream()
                .filter(r -> r.getIsCorrect() != null && r.getIsCorrect() == 1)
                .count();
            double correctRate = totalAnswered > 0
                ? (double) totalCorrect / totalAnswered * 100 : 0;

            subjectProgress.put("totalKnowledge", totalKnowledge);
            subjectProgress.put("practicedKnowledge", practicedKnowledge);
            subjectProgress.put("masteredKnowledge", masteredKnowledge);
            subjectProgress.put("progressRate", Math.round(progressRate * 10) / 10.0);
            subjectProgress.put("totalAnswered", totalAnswered);
            subjectProgress.put("totalCorrect", totalCorrect);
            subjectProgress.put("correctRate", Math.round(correctRate * 10) / 10.0);

            result.add(subjectProgress);
        }

        return result;
    }

    /**
     * 获取学生某学科的详细进度（按章节/知识点）
     */
    public Map<String, Object> getSubjectDetailProgress(Long userId, Long subjectId) {
        Map<String, Object> result = new LinkedHashMap<>();

        Subject subject = subjectMapper.selectById(subjectId);
        if (subject == null) {
            throw BusinessException.of("学科不存在");
        }

        result.put("subjectId", subject.getId());
        result.put("subjectName", subject.getName());

        // 获取做题记录
        List<PracticeRecord> records = practiceRecordMapper.selectList(
            new LambdaQueryWrapper<PracticeRecord>()
                .eq(PracticeRecord::getUserId, userId)
        );

        Set<Long> questionIds = records.stream()
            .map(PracticeRecord::getQuestionId)
            .collect(Collectors.toSet());

        Map<Long, Question> questionMap = new HashMap<>();
        if (!questionIds.isEmpty()) {
            questionMapper.selectBatchIds(questionIds).stream()
                .filter(q -> subjectId.equals(q.getSubjectId()))
                .forEach(q -> questionMap.put(q.getId(), q));
        }
        final Map<Long, Question> qMap = questionMap;

        // 获取该学科所有知识点
        List<Knowledge> allKnowledges = knowledgeMapper.selectList(
            new LambdaQueryWrapper<Knowledge>().orderByAsc(Knowledge::getSortOrder)
        );

        // 获取该学科所有题目，筛选出属于该学科的知识点
        List<Question> subjectAllQuestions = questionMapper.selectList(
            new LambdaQueryWrapper<Question>()
                .eq(Question::getSubjectId, subjectId)
        );
        Set<Long> subjectKnowledgeIds = subjectAllQuestions.stream()
            .map(Question::getKnowledgeId)
            .filter(Objects::nonNull)
            .collect(Collectors.toSet());

        // 按知识点统计做题情况
        Map<Long, Map<String, Object>> knowledgeStats = new LinkedHashMap<>();
        List<PracticeRecord> subjectRecords = records.stream()
            .filter(r -> qMap.containsKey(r.getQuestionId()))
            .toList();

        Map<Long, List<PracticeRecord>> byKnowledge = subjectRecords.stream()
            .filter(r -> qMap.get(r.getQuestionId()) != null)
            .filter(r -> qMap.get(r.getQuestionId()).getKnowledgeId() != null)
            .collect(Collectors.groupingBy(
                r -> qMap.get(r.getQuestionId()).getKnowledgeId()
            ));

        for (Long kid : subjectKnowledgeIds) {
            Map<String, Object> kStat = new LinkedHashMap<>();
            kStat.put("knowledgeId", kid);
            List<PracticeRecord> kRecords = byKnowledge.getOrDefault(kid, List.of());
            int answered = kRecords.size();
            long correct = kRecords.stream()
                .filter(r -> r.getIsCorrect() != null && r.getIsCorrect() == 1)
                .count();
            double rate = answered > 0 ? (double) correct / answered * 100 : 0;

            String status = "NOT_STARTED";
            if (answered > 0 && rate >= 60) {
                status = "MASTERED";
            } else if (answered > 0) {
                status = "PRACTICING";
            }

            kStat.put("answered", answered);
            kStat.put("correct", correct);
            kStat.put("correctRate", Math.round(rate * 10) / 10.0);
            kStat.put("status", status);
            knowledgeStats.put(kid, kStat);
        }

        // 获取章节树，挂载知识点统计
        List<Chapter> chapters = chapterMapper.selectList(
            new LambdaQueryWrapper<Chapter>()
                .eq(Chapter::getSubjectId, subjectId)
                .orderByAsc(Chapter::getSortOrder)
        );

        result.put("chapterTree", buildChapterTreeWithProgress(chapters, 0L, knowledgeStats, allKnowledges));
        return result;
    }

    private List<Map<String, Object>> buildChapterTreeWithProgress(
            List<Chapter> chapters, Long parentId,
            Map<Long, Map<String, Object>> knowledgeStats,
            List<Knowledge> allKnowledges) {

        return chapters.stream()
            .filter(ch -> ch.getParentId().equals(parentId))
            .map(ch -> {
                Map<String, Object> node = new LinkedHashMap<>();
                node.put("id", ch.getId());
                node.put("name", ch.getName());

                // 该章节下的知识点
                List<Knowledge> chapterKnowledges = allKnowledges.stream()
                    .filter(k -> ch.getId().equals(k.getChapterId()))
                    .toList();

                if (!chapterKnowledges.isEmpty()) {
                    List<Map<String, Object>> kList = chapterKnowledges.stream()
                        .map(k -> {
                            Map<String, Object> kNode = new LinkedHashMap<>();
                            kNode.put("knowledgeId", k.getId());
                            kNode.put("knowledgeName", k.getName());
                            Map<String, Object> stats = knowledgeStats.get(k.getId());
                            if (stats != null) {
                                kNode.putAll(stats);
                            } else {
                                kNode.put("answered", 0);
                                kNode.put("correct", 0);
                                kNode.put("correctRate", 0.0);
                                kNode.put("status", "NOT_STARTED");
                            }
                            return kNode;
                        })
                        .toList();
                    node.put("knowledges", kList);
                }

                List<Map<String, Object>> children = buildChapterTreeWithProgress(
                    chapters, ch.getId(), knowledgeStats, allKnowledges);
                if (!children.isEmpty()) {
                    node.put("children", children);
                }
                return node;
            })
            .collect(Collectors.toList());
    }

    /**
     * 家长获取孩子列表
     */
    public List<Map<String, Object>> getChildren(Long parentId) {
        List<User> children = userMapper.selectList(
            new LambdaQueryWrapper<User>()
                .eq(User::getParentId, parentId)
                .eq(User::getStatus, 1)
        );

        return children.stream()
            .map(child -> {
                Map<String, Object> info = new LinkedHashMap<>();
                info.put("id", child.getId());
                info.put("nickname", child.getNickname());
                info.put("username", child.getUsername());

                // 获取孩子的总体进度摘要
                List<PracticeRecord> records = practiceRecordMapper.selectList(
                    new LambdaQueryWrapper<PracticeRecord>()
                        .eq(PracticeRecord::getUserId, child.getId())
                );
                int totalAnswered = records.size();
                long totalCorrect = records.stream()
                    .filter(r -> r.getIsCorrect() != null && r.getIsCorrect() == 1)
                    .count();
                double correctRate = totalAnswered > 0
                    ? (double) totalCorrect / totalAnswered * 100 : 0;

                info.put("totalAnswered", totalAnswered);
                info.put("totalCorrect", totalCorrect);
                info.put("correctRate", Math.round(correctRate * 10) / 10.0);

                return info;
            })
            .toList();
    }

    /**
     * 家长查看指定孩子的学习进度
     */
    public Map<String, Object> getChildProgress(Long parentId, Long childId) {
        // 验证亲子关系
        User child = userMapper.selectById(childId);
        if (child == null) {
            throw BusinessException.of("孩子不存在");
        }
        if (!parentId.equals(child.getParentId())) {
            throw BusinessException.of("无权查看该学生的学习进度");
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("childId", child.getId());
        result.put("childName", child.getNickname());

        // 获取孩子的学科进度
        result.put("subjectProgress", getStudentProgress(childId));

        return result;
    }

    /**
     * 家长查看指定孩子的学科详细进度
     */
    public Map<String, Object> getChildSubjectDetail(Long parentId, Long childId, Long subjectId) {
        // 验证亲子关系
        User child = userMapper.selectById(childId);
        if (child == null) {
            throw BusinessException.of("孩子不存在");
        }
        if (!parentId.equals(child.getParentId())) {
            throw BusinessException.of("无权查看该学生的学习进度");
        }

        Map<String, Object> result = getSubjectDetailProgress(childId, subjectId);
        result.put("childId", child.getId());
        result.put("childName", child.getNickname());
        return result;
    }
}
