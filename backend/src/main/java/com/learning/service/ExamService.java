package com.learning.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.learning.common.exception.BusinessException;
import com.learning.entity.*;
import com.learning.mapper.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExamService {

    private final ExamMapper examMapper;
    private final ExamQuestionMapper examQuestionMapper;
    private final ExamRecordMapper examRecordMapper;
    private final AnswerDetailMapper answerDetailMapper;
    private final QuestionMapper questionMapper;

    /**
     * 智能组卷 - 从题库中随机选题
     */
    @Transactional
    public Exam createExam(Long userId, String title, Long subjectId, Long gradeId, Long chapterId,
                           int questionCount, int timeLimit, Integer difficulty) {
        // 查询符合条件的题目
        LambdaQueryWrapper<Question> wrapper = new LambdaQueryWrapper<Question>()
            .eq(Question::getSubjectId, subjectId)
            .eq(Question::getGradeId, gradeId);
        if (chapterId != null) {
            wrapper.eq(Question::getChapterId, chapterId);
        }
        if (difficulty != null) {
            // 难度范围: difficulty-1 到 difficulty+1
            int minDiff = Math.max(1, difficulty - 1);
            int maxDiff = Math.min(5, difficulty + 1);
            wrapper.between(Question::getDifficulty, minDiff, maxDiff);
        }
        wrapper.orderByAsc(Question::getDifficulty);

        List<Question> candidates = questionMapper.selectList(wrapper);
        if (candidates.size() < questionCount) {
            throw BusinessException.of("符合条件的题目不足，当前只有 " + candidates.size() + " 题");
        }

        // 随机选题
        Collections.shuffle(candidates);
        List<Question> selected = candidates.subList(0, questionCount);

        // 创建试卷
        Exam exam = new Exam();
        exam.setCreatedBy(userId);
        exam.setTitle(title);
        exam.setSubjectId(subjectId);
        exam.setGradeId(gradeId);
        exam.setExamType(1); // 默认类型
        exam.setDuration(timeLimit);
        int totalScore = selected.stream().mapToInt(Question::getScore).sum();
        exam.setTotalScore(totalScore);
        examMapper.insert(exam);

        // 添加试卷题目
        for (int i = 0; i < selected.size(); i++) {
            ExamQuestion eq = new ExamQuestion();
            eq.setExamId(exam.getId());
            eq.setQuestionId(selected.get(i).getId());
            eq.setSortOrder(i + 1);
            eq.setScore(selected.get(i).getScore());
            examQuestionMapper.insert(eq);
        }

        return exam;
    }

    /**
     * 获取试卷详情(含题目)
     */
    public Map<String, Object> getExamDetail(Long examId) {
        Exam exam = examMapper.selectById(examId);
        List<ExamQuestion> examQuestions = examQuestionMapper.selectList(
            new LambdaQueryWrapper<ExamQuestion>()
                .eq(ExamQuestion::getExamId, examId)
                .orderByAsc(ExamQuestion::getSortOrder)
        );

        // 批量查询题目，避免 N+1
        List<Long> questionIds = examQuestions.stream().map(ExamQuestion::getQuestionId).collect(Collectors.toList());
        Map<Long, Question> questionMap = new HashMap<>();
        if (!questionIds.isEmpty()) {
            questionMapper.selectBatchIds(questionIds).forEach(q -> questionMap.put(q.getId(), q));
        }

        List<Map<String, Object>> questions = examQuestions.stream().map(eq -> {
            Question q = questionMap.get(eq.getQuestionId());
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("examQuestionId", eq.getId());
            map.put("sortOrder", eq.getSortOrder());
            map.put("score", eq.getScore());
            map.put("question", q);
            return map;
        }).collect(Collectors.toList());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("exam", exam);
        result.put("questions", questions);
        return result;
    }

    /**
     * 开始考试
     */
    public ExamRecord startExam(Long examId, Long userId) {
        ExamRecord record = new ExamRecord();
        record.setExamId(examId);
        record.setUserId(userId);
        record.setStatus(0); // 进行中
        examRecordMapper.insert(record);
        return record;
    }

    /**
     * 提交试卷(含客观题自动评分)
     */
    @Transactional
    public ExamRecord submitExam(Long recordId, List<Map<String, Object>> answers) {
        ExamRecord record = examRecordMapper.selectById(recordId);
        if (record == null || record.getStatus() == 1) {
            throw BusinessException.of("考试记录不存在或已提交");
        }

        int totalScore = 0;
        for (Map<String, Object> answer : answers) {
            Long examQuestionId = Long.valueOf(answer.get("examQuestionId").toString());
            String userAnswer = (String) answer.get("userAnswer");

            ExamQuestion eq = examQuestionMapper.selectById(examQuestionId);
            Question q = questionMapper.selectById(eq.getQuestionId());

            // 客观题自动评分
            boolean isCorrect = false;
            int score = 0;
            if (q.getType() == 1 || q.getType() == 4) {
                // 选择题、判断题：选项字母匹配
                isCorrect = q.getAnswer().trim().equalsIgnoreCase(userAnswer.trim());
                score = isCorrect ? eq.getScore() : 0;
            } else if (q.getType() == 2) {
                // 填空题：答案文本匹配（去除空格后比较）
                String correctAnswer = q.getAnswer().trim();
                String userAns = userAnswer != null ? userAnswer.trim() : "";
                isCorrect = correctAnswer.equals(userAns);
                score = isCorrect ? eq.getScore() : 0;
            }
            // 其他主观题暂给0分，后续AI评分

            totalScore += score;

            AnswerDetail detail = new AnswerDetail();
            detail.setExamRecordId(recordId);
            detail.setExamQuestionId(examQuestionId);
            detail.setUserAnswer(userAnswer);
            detail.setIsCorrect(isCorrect ? 1 : 0);
            detail.setScore(score);
            answerDetailMapper.insert(detail);
        }

        record.setTotalScore(totalScore);
        record.setStatus(1); // 已完成
        // 计算用时
        if (record.getSubmittedAt() != null) {
            long seconds = java.time.Duration.between(record.getSubmittedAt(), LocalDateTime.now()).getSeconds();
            record.setTimeSpent((int) Math.max(seconds, 0));
        }
        examRecordMapper.updateById(record);

        return record;
    }

    /**
     * 获取考试记录列表
     */
    public Page<ExamRecord> getExamRecords(Long userId, int page, int size) {
        return examRecordMapper.selectPage(
            new Page<>(page, size),
            new LambdaQueryWrapper<ExamRecord>()
                .eq(ExamRecord::getUserId, userId)
                .orderByDesc(ExamRecord::getSubmittedAt)
        );
    }

    /**
     * 获取考试记录详情
     */
    public Map<String, Object> getExamRecordDetail(Long recordId) {
        ExamRecord record = examRecordMapper.selectById(recordId);
        Exam exam = examMapper.selectById(record.getExamId());
        List<AnswerDetail> details = answerDetailMapper.selectList(
            new LambdaQueryWrapper<AnswerDetail>()
                .eq(AnswerDetail::getExamRecordId, recordId)
        );

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("record", record);
        result.put("exam", exam);
        result.put("answerDetails", details);
        return result;
    }
}
