package com.learning.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

/**
 * 章节实体类，对应数据库表 t_chapter。
 * 支持树形层级结构，通过 parentId 关联父级章节，用于组织课程内容的章节体系。
 *
 * @property id        章节主键，自增策略生成
 * @property subjectId 所属科目ID
 * @property gradeId   所属年级ID
 * @property parentId  父级章节ID，顶层章节为 null
 * @property name      章节名称
 * @property sortOrder 排序序号，数值越小越靠前
 */
@Data
@TableName("t_chapter")
public class Chapter {

    /** 章节主键，数据库自增 */
    @TableId(type = IdType.AUTO)
    private Long id;

    /** 所属科目ID */
    private Long subjectId;

    /** 所属年级ID */
    private Long gradeId;

    /** 父级章节ID，用于构建章节树形层级关系 */
    private Long parentId;

    /** 章节名称 */
    private String name;

    /** 排序序号，控制同级章节的展示顺序 */
    private Integer sortOrder;
}
