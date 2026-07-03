package com.learning.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

@Data
@TableName("t_knowledge")
public class Knowledge {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long chapterId;
    private String name;
    private String summary;
    private String keyPoints;
    private String formulas;
    private String examples;
    private Integer sortOrder;
}
