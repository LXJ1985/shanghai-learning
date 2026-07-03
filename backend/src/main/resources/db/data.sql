-- 初始化数据（MERGE INTO 幂等，重启不产生重复数据）

-- 管理员用户（家长角色，role=2）
-- 用户名: admin  密码: admin123
MERGE INTO t_user (id, username, password, nickname, role, status) KEY(id) VALUES
(1, 'admin', '$2a$10$ZYvlorDer3k0lR5p3/zOhezePCYmEY.iw8x.0QHRHPBv0htXXCi7i', '管理员', 2, 1);

-- 学科数据
MERGE INTO t_subject (id, name, sort_order) KEY(id) VALUES
(1, '语文', 1), (2, '数学', 2), (3, '英语', 3), (4, '历史', 4), (5, '地理', 5),
(6, '生物', 6), (7, '物理', 7), (8, '化学', 8), (9, '科学', 9), (10, '思想政治', 10);

-- 年级数据
MERGE INTO t_grade (id, name, sort_order) KEY(id) VALUES
(1, '六年级', 1), (2, '七年级', 2), (3, '八年级', 3), (4, '九年级', 4);

-- 示例章节数据（数学八年级）
MERGE INTO t_chapter (id, subject_id, grade_id, parent_id, name, sort_order) KEY(id) VALUES
(1, 2, 3, 0, '第14章 二次根式', 1),
(2, 2, 3, 1, '14.1 二次根式的概念', 1),
(3, 2, 3, 1, '14.2 二次根式的运算', 2),
(4, 2, 3, 0, '第15章 一元二次方程', 2),
(5, 2, 3, 4, '15.1 一元二次方程的概念', 1),
(6, 2, 3, 4, '15.2 一元二次方程的解法', 2),
(7, 2, 3, 4, '15.3 一元二次方程的根的判别式', 3),
(8, 2, 3, 0, '第16章 正比例函数和反比例函数', 3),
(9, 2, 3, 8, '16.1 函数的概念', 1),
(10, 2, 3, 8, '16.2 正比例函数', 2),
(11, 2, 3, 8, '16.3 反比例函数', 3);

-- 示例知识点数据
MERGE INTO t_knowledge (id, chapter_id, name, summary, key_points, formulas, sort_order) KEY(id) VALUES
(1, 2, '二次根式的概念', '二次根式是形如√a（a≥0）的代数式。', '["1. 被开方数必须非负","2. 二次根式是非负数","3. 最简二次根式的判断标准"]', '["\\\\sqrt{a} \\\\geq 0 \\\\quad (a \\\\geq 0)"]', 1),
(2, 3, '二次根式的乘除法', '二次根式的乘除运算法则。', '["1. 乘法法则：√a·√b=√(ab)","2. 除法法则：√a/√b=√(a/b)","3. 化简步骤"]', '["\\\\sqrt{a} \\\\cdot \\\\sqrt{b} = \\\\sqrt{ab}", "\\\\frac{\\\\sqrt{a}}{\\\\sqrt{b}} = \\\\sqrt{\\\\frac{a}{b}}"]', 1),
(3, 5, '一元二次方程的概念', '含有一个未知数且未知数的最高次数为2的整式方程。', '["1. 一般形式：ax²+bx+c=0(a≠0)","2. 二次项、一次项、常数项","3. 判断标准"]', '["ax^2 + bx + c = 0 \\\\quad (a \\\\neq 0)"]', 1);

-- 示例题目数据
MERGE INTO t_question (id, subject_id, grade_id, chapter_id, question_type, difficulty, content, options, answer, analysis, score, status) KEY(id) VALUES
(1, 2, 3, 2, 1, 1, '下列各式中，是二次根式的是（）', '[{"label":"A","content":"√(-3)"},{"label":"B","content":"√(x²+1)"},{"label":"C","content":"∛2"},{"label":"D","content":"1/x"}]', 'B', 'A选项被开方数为负，不是二次根式；B选项x²+1≥0恒成立，是二次根式；C选项是立方根；D选项不是根式。', 3, 1),
(2, 2, 3, 2, 1, 2, '若√(x-2)有意义，则x的取值范围是（）', '[{"label":"A","content":"x>2"},{"label":"B","content":"x≥2"},{"label":"C","content":"x>0"},{"label":"D","content":"x≥0"}]', 'B', '二次根式有意义的条件是被开方数≥0，即x-2≥0，解得x≥2。', 3, 1),
(3, 2, 3, 3, 4, 1, '计算：√2 × √8 = ____', NULL, '4', '√2 × √8 = √(2×8) = √16 = 4', 3, 1);

-- 关联题目和知识点
MERGE INTO t_question_knowledge (id, question_id, knowledge_id) KEY(id) VALUES
(1, 1, 1), (2, 2, 1), (3, 3, 2);
