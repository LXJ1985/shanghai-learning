package com.learning.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("t_practice_record")
public class PracticeRecord {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long userId;
    private Long knowledgeId;
    private Long questionId;
    private String userAnswer;
    private Integer isCorrect; // 0-错误 1-正确
    private java.math.BigDecimal aiScore;
    private String aiReason;
    private Integer timeSpent; // 秒
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
