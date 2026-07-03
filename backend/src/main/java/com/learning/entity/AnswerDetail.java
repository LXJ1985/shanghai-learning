package com.learning.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

/**
 * 答题明细实体类，对应数据库表 t_answer_detail。
 * 记录用户在考试中每道题的作答情况，包括用户答案、得分、是否正确以及 AI 批改理由。
 *
 * @property id            主键，自增策略生成
 * @property examRecordId  关联的考试记录ID
 * @property examQuestionId 关联的试卷题目ID（映射数据库字段 question_id）
 * @property userAnswer    用户提交的答案
 * @property score         该题得分
 * @property isCorrect     是否正确：0-错误，1-正确
 * @property aiReason      AI 批改理由，用于主观题的智能评分说明
 */
@Data
@TableName("t_answer_detail")
public class AnswerDetail {

    /** 主键，数据库自增 */
    @TableId(type = IdType.AUTO)
    private Long id;

    /** 关联的考试记录ID */
    private Long examRecordId;

    /**
     * 关联的试卷题目ID。
     * 数据库字段名为 question_id，通过 @TableField 显式映射。
     */
    @TableField("question_id")
    private Long examQuestionId;

    /** 用户提交的答案 */
    private String userAnswer;

    /** 该题得分 */
    private Integer score;

    /** 是否正确：0-错误，1-正确 */
    private Integer isCorrect; // 0-错误 1-正确

    /** AI 批改理由，用于主观题智能评分说明 */
    private String aiReason;
}
