package com.learning.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

@Data
@TableName("t_question_knowledge")
public class QuestionKnowledge {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long questionId;
    private Long knowledgeId;
}
