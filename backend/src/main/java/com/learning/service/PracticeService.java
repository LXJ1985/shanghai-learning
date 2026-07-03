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

@Service
@RequiredArgsConstructor
public class PracticeService {

    private final QuestionMapper questionMapper;
    private final PracticeRecordMapper practiceRecordMapper;
    private final WrongQuestionMapper wrongQuestionMapper;

    /**
     * 获取知识点下的题目(分页)
     */
    public Page<Question> getQuestionsByKnowledge(Long knowledgeId, int page, int size) {
        return questionMapper.selectPage(
            new Page<>(page, size),
            new LambdaQueryWrapper<Question>()
                .eq(Question::getKnowledgeId, knowledgeId)
                .orderByAsc(Question::getDifficulty)
        );
    }

    /**
     * 提交练习答案(客观题自动评分)
     */
    @Transactional
    public PracticeRecord submitAnswer(Long userId, Long questionId, String userAnswer, int timeSpent) {
        Question question = questionMapper.selectById(questionId);
        if (question == null) {
            throw BusinessException.of("题目不存在");
        }

        // 客观题自动评分
        boolean isCorrect = false;
        int score = 0;
        if (isObjective(question.getType())) {
            isCorrect = question.getAnswer().trim().equalsIgnoreCase(userAnswer.trim());
            score = isCorrect ? question.getScore() : 0;
        }

        // 保存练习记录
        PracticeRecord record = new PracticeRecord();
        record.setUserId(userId);
        record.setQuestionId(questionId);
        record.setUserAnswer(userAnswer);
        record.setIsCorrect(isCorrect ? 1 : 0);
        record.setAiScore(java.math.BigDecimal.valueOf(score));
        record.setTimeSpent(timeSpent);
        practiceRecordMapper.insert(record);

        // 答错则加入错题本
        if (!isCorrect) {
            addToWrongQuestion(userId, questionId, userAnswer, question.getAnswer());
        }

        return record;
    }

    /**
     * 获取练习记录
     */
    public List<PracticeRecord> getPracticeRecords(Long userId, Long subjectId, Long chapterId) {
        LambdaQueryWrapper<PracticeRecord> wrapper = new LambdaQueryWrapper<PracticeRecord>()
            .eq(PracticeRecord::getUserId, userId)
            .orderByDesc(PracticeRecord::getCreatedAt);
        return practiceRecordMapper.selectList(wrapper);
    }

    private boolean isObjective(int type) {
        return type == 1 || type == 4; // 选择题、判断题
    }

    private void addToWrongQuestion(Long userId, Long questionId, String wrongAnswer, String correctAnswer) {
        WrongQuestion existing = wrongQuestionMapper.selectOne(
            new LambdaQueryWrapper<WrongQuestion>()
                .eq(WrongQuestion::getUserId, userId)
                .eq(WrongQuestion::getQuestionId, questionId)
        );
        if (existing != null) {
            existing.setWrongAnswer(wrongAnswer);
            existing.setWrongCount(existing.getWrongCount() + 1);
            existing.setUpdatedAt(LocalDateTime.now());
            wrongQuestionMapper.updateById(existing);
        } else {
            WrongQuestion wq = new WrongQuestion();
            wq.setUserId(userId);
            wq.setQuestionId(questionId);
            wq.setWrongAnswer(wrongAnswer);
            wq.setCorrectAnswer(correctAnswer);
            wq.setWrongCount(1);
            wrongQuestionMapper.insert(wq);
        }
    }
}
