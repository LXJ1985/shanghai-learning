package com.learning.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("t_exam_record")
public class ExamRecord {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long examId;
    private Long userId;
    private Integer totalScore;
    private Integer timeSpent; // 秒
    private Integer status; // 0-进行中 1-已完成
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime submittedAt;
}
