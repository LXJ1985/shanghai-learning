-- 上海学生学习系统 - 数据库建表脚本
-- 数据库: shanghai_learning

CREATE DATABASE IF NOT EXISTS shanghai_learning DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE shanghai_learning;

-- 1. 用户表
CREATE TABLE t_user (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
    password VARCHAR(200) NOT NULL COMMENT '密码(BCrypt)',
    nickname VARCHAR(50) COMMENT '昵称',
    role TINYINT NOT NULL DEFAULT 1 COMMENT '角色:1-学生 2-家长/管理员',
    parent_id BIGINT COMMENT '关联家长ID(学生用)',
    status TINYINT NOT NULL DEFAULT 1 COMMENT '状态:0-禁用 1-正常',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_parent_id (parent_id)
) ENGINE=InnoDB COMMENT='用户表';

-- 2. 学科表
CREATE TABLE t_subject (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL COMMENT '学科名称',
    sort_order INT NOT NULL DEFAULT 0 COMMENT '排序',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB COMMENT='学科表';

-- 3. 年级表
CREATE TABLE t_grade (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(20) NOT NULL COMMENT '年级名称',
    sort_order INT NOT NULL DEFAULT 0 COMMENT '排序',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB COMMENT='年级表';

-- 4. 章节表
CREATE TABLE t_chapter (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    subject_id BIGINT NOT NULL COMMENT '学科ID',
    grade_id BIGINT NOT NULL COMMENT '年级ID',
    parent_id BIGINT DEFAULT 0 COMMENT '父章节ID(0为顶级)',
    name VARCHAR(100) NOT NULL COMMENT '章节名称',
    sort_order INT NOT NULL DEFAULT 0 COMMENT '排序',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_subject_grade (subject_id, grade_id),
    INDEX idx_parent (parent_id)
) ENGINE=InnoDB COMMENT='章节表';

-- 5. 知识点表
CREATE TABLE t_knowledge (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    chapter_id BIGINT NOT NULL COMMENT '章节ID',
    name VARCHAR(200) NOT NULL COMMENT '知识点名称',
    summary TEXT COMMENT '知识点归纳总结(富文本)',
    key_points TEXT COMMENT '要点(JSON数组)',
    formulas TEXT COMMENT '公式(LaTeX格式)',
    examples TEXT COMMENT '示例(JSON数组)',
    sort_order INT NOT NULL DEFAULT 0 COMMENT '排序',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_chapter (chapter_id)
) ENGINE=InnoDB COMMENT='知识点表';

-- 6. 题目表
CREATE TABLE t_question (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    subject_id BIGINT NOT NULL COMMENT '学科ID',
    grade_id BIGINT NOT NULL COMMENT '年级ID',
    chapter_id BIGINT NOT NULL COMMENT '章节ID',
    knowledge_id BIGINT COMMENT '知识点ID',
    question_type TINYINT NOT NULL COMMENT '题型:1-单选 2-多选 3-判断 4-填空 5-解答 6-简答 7-作文',
    difficulty TINYINT NOT NULL DEFAULT 2 COMMENT '难度:1-易 2-中 3-难',
    content TEXT NOT NULL COMMENT '题干(富文本)',
    options TEXT COMMENT '选项(JSON)',
    answer TEXT NOT NULL COMMENT '正确答案',
    analysis TEXT COMMENT '解析(富文本)',
    score DECIMAL(5,1) NOT NULL DEFAULT 5.0 COMMENT '分值',
    source VARCHAR(200) COMMENT '来源',
    status TINYINT NOT NULL DEFAULT 0 COMMENT '状态:0-待审核 1-已入库 2-已禁用',
    created_by BIGINT COMMENT '创建人',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_subject_grade_chapter (subject_id, grade_id, chapter_id),
    INDEX idx_type_difficulty (question_type, difficulty),
    INDEX idx_status (status)
) ENGINE=InnoDB COMMENT='题目表';

-- 7. 题目-知识点关联表
CREATE TABLE t_question_knowledge (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    question_id BIGINT NOT NULL COMMENT '题目ID',
    knowledge_id BIGINT NOT NULL COMMENT '知识点ID',
    UNIQUE INDEX uk_question_knowledge (question_id, knowledge_id),
    INDEX idx_knowledge (knowledge_id)
) ENGINE=InnoDB COMMENT='题目-知识点关联表';

-- 8. 做题记录表
CREATE TABLE t_practice_record (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL COMMENT '学生ID',
    knowledge_id BIGINT COMMENT '知识点ID(可为空)',
    question_id BIGINT NOT NULL COMMENT '题目ID',
    user_answer TEXT COMMENT '学生答案',
    is_correct TINYINT DEFAULT 0 COMMENT '是否正确:0-错 1-对 2-待评分',
    ai_score DECIMAL(5,1) COMMENT 'AI评分(主观题)',
    ai_reason TEXT COMMENT 'AI评分理由',
    time_spent INT DEFAULT 0 COMMENT '耗时(秒)',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_knowledge (user_id, knowledge_id),
    INDEX idx_question (question_id)
) ENGINE=InnoDB COMMENT='做题记录表';

-- 9. 试卷表
CREATE TABLE t_exam (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL COMMENT '试卷标题',
    subject_id BIGINT NOT NULL COMMENT '学科ID',
    grade_id BIGINT NOT NULL COMMENT '年级ID',
    exam_type TINYINT NOT NULL COMMENT '类型:1-单元测试 2-期中考试 3-期末考试',
    total_score DECIMAL(5,1) NOT NULL DEFAULT 100 COMMENT '总分',
    duration INT NOT NULL DEFAULT 60 COMMENT '时长(分钟)',
    status TINYINT NOT NULL DEFAULT 0 COMMENT '状态:0-草稿 1-已发布',
    created_by BIGINT COMMENT '创建人',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_subject_grade (subject_id, grade_id)
) ENGINE=InnoDB COMMENT='试卷表';

-- 10. 试卷-题目关联表
CREATE TABLE t_exam_question (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    exam_id BIGINT NOT NULL COMMENT '试卷ID',
    question_id BIGINT NOT NULL COMMENT '题目ID',
    sort_order INT NOT NULL DEFAULT 0 COMMENT '题目顺序',
    INDEX idx_exam (exam_id)
) ENGINE=InnoDB COMMENT='试卷-题目关联表';

-- 11. 试卷作答记录表
CREATE TABLE t_exam_record (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL COMMENT '学生ID',
    exam_id BIGINT NOT NULL COMMENT '试卷ID',
    total_score DECIMAL(5,1) COMMENT '得分',
    time_spent INT DEFAULT 0 COMMENT '实际耗时(秒)',
    status TINYINT NOT NULL DEFAULT 0 COMMENT '状态:0-进行中 1-已提交 2-已评分',
    submitted_at DATETIME COMMENT '提交时间',
    UNIQUE INDEX uk_user_exam (user_id, exam_id)
) ENGINE=InnoDB COMMENT='试卷作答记录表';

-- 12. 答题详情表
CREATE TABLE t_answer_detail (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    exam_record_id BIGINT NOT NULL COMMENT '试卷记录ID',
    question_id BIGINT NOT NULL COMMENT '题目ID',
    user_answer TEXT COMMENT '学生答案',
    is_correct TINYINT DEFAULT 0 COMMENT '是否正确',
    score DECIMAL(5,1) DEFAULT 0 COMMENT '得分',
    ai_reason TEXT COMMENT 'AI评分理由',
    INDEX idx_record (exam_record_id)
) ENGINE=InnoDB COMMENT='答题详情表';

-- 13. 错题本表
CREATE TABLE t_wrong_question (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL COMMENT '学生ID',
    question_id BIGINT NOT NULL COMMENT '题目ID',
    wrong_count INT NOT NULL DEFAULT 1 COMMENT '做错次数',
    last_wrong_at DATETIME NOT NULL COMMENT '最近做错时间',
    status TINYINT NOT NULL DEFAULT 0 COMMENT '状态:0-未掌握 1-已掌握',
    UNIQUE INDEX uk_user_question (user_id, question_id)
) ENGINE=InnoDB COMMENT='错题本表';

-- 14. 操作日志表
CREATE TABLE t_operation_log (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT COMMENT '操作人ID',
    username VARCHAR(50) COMMENT '操作人用户名',
    module VARCHAR(50) NOT NULL COMMENT '模块名称',
    operation VARCHAR(100) NOT NULL COMMENT '操作描述',
    method VARCHAR(200) COMMENT '请求方法',
    request_url VARCHAR(500) COMMENT '请求URL',
    request_method VARCHAR(10) COMMENT 'HTTP方法(GET/POST/PUT/DELETE)',
    request_params TEXT COMMENT '请求参数',
    response_code INT COMMENT '响应状态码',
    ip VARCHAR(50) COMMENT '操作IP',
    duration BIGINT COMMENT '耗时(毫秒)',
    status TINYINT NOT NULL DEFAULT 1 COMMENT '状态:0-失败 1-成功',
    error_msg TEXT COMMENT '错误信息',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    INDEX idx_module (module),
    INDEX idx_created (created_at)
) ENGINE=InnoDB COMMENT='操作日志表';
