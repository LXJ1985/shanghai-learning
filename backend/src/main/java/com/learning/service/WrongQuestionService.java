package com.learning.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.learning.entity.WrongQuestion;
import com.learning.mapper.WrongQuestionMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class WrongQuestionService {

    private final WrongQuestionMapper wrongQuestionMapper;

    public Page<WrongQuestion> getWrongQuestions(Long userId, Long subjectId, int page, int size) {
        LambdaQueryWrapper<WrongQuestion> wrapper = new LambdaQueryWrapper<WrongQuestion>()
            .eq(WrongQuestion::getUserId, userId)
            .orderByDesc(WrongQuestion::getWrongCount);
        return wrongQuestionMapper.selectPage(new Page<>(page, size), wrapper);
    }

    public void removeWrongQuestion(Long id, Long userId) {
        wrongQuestionMapper.delete(
            new LambdaQueryWrapper<WrongQuestion>()
                .eq(WrongQuestion::getId, id)
                .eq(WrongQuestion::getUserId, userId)
        );
    }

    public void clearWrongQuestions(Long userId, Long subjectId) {
        LambdaQueryWrapper<WrongQuestion> wrapper = new LambdaQueryWrapper<WrongQuestion>()
            .eq(WrongQuestion::getUserId, userId);
        wrongQuestionMapper.delete(wrapper);
    }
}
