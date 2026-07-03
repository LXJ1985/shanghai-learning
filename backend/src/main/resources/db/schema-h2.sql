-- H2 兼容模式建表脚本（本地开发用）

-- 1. 用户表
CREATE TABLE IF NOT EXISTS t_user (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(200) NOT NULL,
    nickname VARCHAR(50),
    role TINYINT NOT NULL DEFAULT 1,
    parent_id BIGINT,
    status TINYINT NOT NULL DEFAULT 1,
    deleted TINYINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. 学科表
CREATE TABLE IF NOT EXISTS t_subject (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. 年级表
CREATE TABLE IF NOT EXISTS t_grade (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(20) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. 章节表
CREATE TABLE IF NOT EXISTS t_chapter (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    subject_id BIGINT NOT NULL,
    grade_id BIGINT NOT NULL,
    parent_id BIGINT DEFAULT 0,
    name VARCHAR(100) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. 知识点表
CREATE TABLE IF NOT EXISTS t_knowledge (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    chapter_id BIGINT NOT NULL,
    name VARCHAR(200) NOT NULL,
    summary TEXT,
    key_points TEXT,
    formulas TEXT,
    examples TEXT,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6. 题目表
CREATE TABLE IF NOT EXISTS t_question (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    subject_id BIGINT NOT NULL,
    grade_id BIGINT,
    chapter_id BIGINT,
    knowledge_id BIGINT,
    question_type TINYINT NOT NULL,
    difficulty TINYINT NOT NULL DEFAULT 2,
    content TEXT NOT NULL,
    options TEXT,
    answer TEXT NOT NULL,
    analysis TEXT,
    score DECIMAL(5,1) NOT NULL DEFAULT 5.0,
    source VARCHAR(200),
    status TINYINT NOT NULL DEFAULT 0,
    created_by BIGINT,
    deleted TINYINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. 题目-知识点关联表
CREATE TABLE IF NOT EXISTS t_question_knowledge (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    question_id BIGINT NOT NULL,
    knowledge_id BIGINT NOT NULL
);

-- 8. 做题记录表
CREATE TABLE IF NOT EXISTS t_practice_record (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    knowledge_id BIGINT,
    question_id BIGINT NOT NULL,
    user_answer TEXT,
    is_correct TINYINT DEFAULT 0,
    ai_score DECIMAL(5,1),
    ai_reason TEXT,
    time_spent INT DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 9. 试卷表
CREATE TABLE IF NOT EXISTS t_exam (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    subject_id BIGINT NOT NULL,
    grade_id BIGINT NOT NULL,
    exam_type TINYINT NOT NULL,
    total_score DECIMAL(5,1) NOT NULL DEFAULT 100,
    duration INT NOT NULL DEFAULT 60,
    status TINYINT NOT NULL DEFAULT 0,
    created_by BIGINT,
    deleted TINYINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 10. 试卷-题目关联表
CREATE TABLE IF NOT EXISTS t_exam_question (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    exam_id BIGINT NOT NULL,
    question_id BIGINT NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    score INT NOT NULL DEFAULT 0
);

-- 11. 试卷作答记录表
CREATE TABLE IF NOT EXISTS t_exam_record (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    exam_id BIGINT NOT NULL,
    total_score DECIMAL(5,1),
    time_spent INT DEFAULT 0,
    status TINYINT NOT NULL DEFAULT 0,
    submitted_at TIMESTAMP
);

-- 12. 答题详情表
CREATE TABLE IF NOT EXISTS t_answer_detail (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    exam_record_id BIGINT NOT NULL,
    question_id BIGINT NOT NULL,
    user_answer TEXT,
    is_correct TINYINT DEFAULT 0,
    score DECIMAL(5,1) DEFAULT 0,
    ai_reason TEXT
);

-- 13. 错题本表
CREATE TABLE IF NOT EXISTS t_wrong_question (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    question_id BIGINT NOT NULL,
    wrong_answer TEXT,
    correct_answer TEXT,
    wrong_count INT NOT NULL DEFAULT 1,
    last_wrong_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status TINYINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 14. 操作日志表
CREATE TABLE IF NOT EXISTS t_operation_log (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT,
    username VARCHAR(50),
    module VARCHAR(50) NOT NULL,
    operation VARCHAR(100) NOT NULL,
    method VARCHAR(200),
    request_url VARCHAR(500),
    request_method VARCHAR(10),
    request_params TEXT,
    response_code INT,
    ip VARCHAR(50),
    duration BIGINT,
    status TINYINT NOT NULL DEFAULT 1,
    error_msg TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 增量迁移: 为已有表补充缺失列（IF NOT EXISTS 保证幂等）
ALTER TABLE t_question ADD COLUMN IF NOT EXISTS knowledge_id BIGINT;
