package com.learning.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * 试卷实体类，对应数据库表 t_exam。
 * 记录考试的基本信息，包括所属科目、年级、考试时长、总分及创建者等，
 * 是智能组卷和考试管理的核心数据模型。
 *
 * @property id         试卷主键，自增策略生成
 * @property title      试卷标题
 * @property subjectId  所属科目ID
 * @property gradeId    所属年级ID
 * @property examType   考试类型
 * @property totalScore 试卷总分
 * @property duration   考试时长（分钟）
 * @property createdBy  创建者用户ID
 * @property createdAt  创建时间，插入时自动填充
 * @property deleted    逻辑删除标记，由 @TableLogic 管理
 */
@Data
@TableName("t_exam")
public class Exam {

    /** 试卷主键，数据库自增 */
    @TableId(type = IdType.AUTO)
    private Long id;

    /** 试卷标题 */
    private String title;

    /** 所属科目ID */
    private Long subjectId;

    /** 所属年级ID */
    private Long gradeId;

    /** 考试类型 */
    private Integer examType;

    /** 试卷总分 */
    private Integer totalScore;

    /** 考试时长（分钟） */
    private Integer duration; // 分钟

    /** 创建者用户ID */
    private Long createdBy;

    /** 创建时间，插入记录时由 MyBatis-Plus 自动填充 */
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    /** 逻辑删除标记，非物理删除 */
    @TableLogic
    private Integer deleted;
}
