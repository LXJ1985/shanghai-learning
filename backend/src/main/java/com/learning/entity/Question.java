package com.learning.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("t_question")
public class Question {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long subjectId;
    private Long gradeId;
    private Long chapterId;
    private Long knowledgeId;
    @TableField("question_type")
    private Integer type; // 1-选择 2-填空 3-解答 4-判断 5-简答 6-作文 7-综合
    private String content;
    private String options; // JSON数组
    private String answer;
    private String analysis;
    private Integer difficulty; // 1-5
    private Integer score;
    private String source;
    private Integer status;
    private Long createdBy;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
    @TableLogic
    private Integer deleted;
}
