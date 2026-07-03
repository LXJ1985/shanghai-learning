package com.learning.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.learning.common.exception.BusinessException;
import com.learning.entity.*;
import com.learning.mapper.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ExamService 单元测试")
class ExamServiceTest {

    @Mock private ExamMapper examMapper;
    @Mock private ExamQuestionMapper examQuestionMapper;
    @Mock private ExamRecordMapper examRecordMapper;
    @Mock private AnswerDetailMapper answerDetailMapper;
    @Mock private QuestionMapper questionMapper;
    @InjectMocks private ExamService examService;

    private List<Question> mockQuestions;

    @BeforeEach
    void setUp() {
        mockQuestions = new ArrayList<>();
        for (int i = 1; i <= 15; i++) {
            Question q = new Question();
            q.setId((long) i);
            q.setSubjectId(2L);
            q.setChapterId(1L);
            q.setType(1);
            q.setDifficulty(2);
            q.setScore(5);
            q.setAnswer("A");
            q.setContent("题目" + i);
            mockQuestions.add(q);
        }
    }

    // ========== createExam ==========
    @Nested @DisplayName("智能组卷")
    class CreateExamTests {

        @Test @DisplayName("TC21: 组卷成功")
        void tc21() {
            when(questionMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(mockQuestions);
            when(examMapper.insert(any(Exam.class))).thenReturn(1);
            when(examQuestionMapper.insert(any(ExamQuestion.class))).thenReturn(1);
            Exam result = examService.createExam(1L, "数学测试", 2L, 1L, 10, 30, 2);
            assertNotNull(result);
            assertEquals("数学测试", result.getTitle());
            assertEquals(2L, result.getSubjectId());
            assertEquals(30, result.getDuration());
            verify(examMapper).insert(any(Exam.class));
            verify(examQuestionMapper, times(10)).insert(any(ExamQuestion.class));
        }

        @Test @DisplayName("TC22: 题目不足")
        void tc22() {
            when(questionMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(mockQuestions.subList(0, 3));
            BusinessException ex = assertThrows(BusinessException.class,
                () -> examService.createExam(1L, "测试", 2L, null, 10, 30, null));
            assertTrue(ex.getMessage().contains("题目不足"));
        }

        @Test @DisplayName("TC23: 不限章节组卷")
        void tc23() {
            when(questionMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(mockQuestions);
            when(examMapper.insert(any(Exam.class))).thenReturn(1);
            when(examQuestionMapper.insert(any(ExamQuestion.class))).thenReturn(1);
            Exam result = examService.createExam(1L, "综合测试", 2L, null, 5, 60, null);
            assertNotNull(result);
            assertNull(result.getGradeId());
        }

        @Test @DisplayName("TC21b: 总分正确计算")
        void tc21b() {
            when(questionMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(mockQuestions);
            when(examMapper.insert(any(Exam.class))).thenReturn(1);
            when(examQuestionMapper.insert(any(ExamQuestion.class))).thenReturn(1);
            Exam result = examService.createExam(1L, "测试", 2L, null, 5, 30, null);
            assertEquals(25, result.getTotalScore());
        }

        @Test @DisplayName("TC21c: 题目按排序插入")
        void tc21c() {
            when(questionMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(mockQuestions);
            when(examMapper.insert(any(Exam.class))).thenReturn(1);
            when(examQuestionMapper.insert(any(ExamQuestion.class))).thenReturn(1);
            examService.createExam(1L, "测试", 2L, null, 3, 30, null);
            verify(examQuestionMapper, times(3)).insert(any(ExamQuestion.class));
        }

        @Test @DisplayName("TC22b: 题目不足不插入试卷")
        void tc22b() {
            when(questionMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(mockQuestions.subList(0, 2));
            assertThrows(BusinessException.class,
                () -> examService.createExam(1L, "测试", 2L, null, 5, 30, null));
            verify(examMapper, never()).insert(any(Exam.class));
            verify(examQuestionMapper, never()).insert(any(ExamQuestion.class));
        }

        @Test @DisplayName("TC21d: createdBy正确设置")
        void tc21d() {
            when(questionMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(mockQuestions);
            when(examMapper.insert(any(Exam.class))).thenReturn(1);
            when(examQuestionMapper.insert(any(ExamQuestion.class))).thenReturn(1);
            Exam result = examService.createExam(42L, "测试", 2L, null, 3, 30, null);
            assertEquals(42L, result.getCreatedBy());
        }

        @Test @DisplayName("TC21e: examType默认1")
        void tc21e() {
            when(questionMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(mockQuestions);
            when(examMapper.insert(any(Exam.class))).thenReturn(1);
            when(examQuestionMapper.insert(any(ExamQuestion.class))).thenReturn(1);
            Exam result = examService.createExam(1L, "测试", 2L, null, 3, 30, null);
            assertEquals(1, result.getExamType());
        }

        @Test @DisplayName("TC21f: 刚好够题目数量")
        void tc21f() {
            List<Question> exact = mockQuestions.subList(0, 5);
            when(questionMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(exact);
            when(examMapper.insert(any(Exam.class))).thenReturn(1);
            when(examQuestionMapper.insert(any(ExamQuestion.class))).thenReturn(1);
            Exam result = examService.createExam(1L, "测试", 2L, null, 5, 30, null);
            assertNotNull(result);
            verify(examQuestionMapper, times(5)).insert(any(ExamQuestion.class));
        }

        @Test @DisplayName("TC21g: questionCount=1")
        void tc21g() {
            when(questionMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(mockQuestions);
            when(examMapper.insert(any(Exam.class))).thenReturn(1);
            when(examQuestionMapper.insert(any(ExamQuestion.class))).thenReturn(1);
            Exam result = examService.createExam(1L, "测试", 2L, null, 1, 10, null);
            assertNotNull(result);
            verify(examQuestionMapper, times(1)).insert(any(ExamQuestion.class));
        }

        @Test @DisplayName("TC21h: duration正确传递")
        void tc21h() {
            when(questionMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(mockQuestions);
            when(examMapper.insert(any(Exam.class))).thenReturn(1);
            when(examQuestionMapper.insert(any(ExamQuestion.class))).thenReturn(1);
            Exam result = examService.createExam(1L, "测试", 2L, null, 3, 120, null);
            assertEquals(120, result.getDuration());
        }

        @Test @DisplayName("TC21i: 有difficulty过滤")
        void tc21i() {
            when(questionMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(mockQuestions);
            when(examMapper.insert(any(Exam.class))).thenReturn(1);
            when(examQuestionMapper.insert(any(ExamQuestion.class))).thenReturn(1);
            Exam result = examService.createExam(1L, "测试", 2L, null, 3, 30, 3);
            assertNotNull(result);
            verify(questionMapper).selectList(any(LambdaQueryWrapper.class));
        }

        @Test @DisplayName("TC21j: title正确设置")
        void tc21j() {
            when(questionMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(mockQuestions);
            when(examMapper.insert(any(Exam.class))).thenReturn(1);
            when(examQuestionMapper.insert(any(ExamQuestion.class))).thenReturn(1);
            Exam result = examService.createExam(1L, "期末考", 2L, null, 3, 30, null);
            assertEquals("期末考", result.getTitle());
        }

        @Test @DisplayName("TC22c: 0题时抛异常")
        void tc22c() {
            when(questionMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of());
            BusinessException ex = assertThrows(BusinessException.class,
                () -> examService.createExam(1L, "测试", 2L, null, 5, 30, null));
            assertTrue(ex.getMessage().contains("题目不足"));
        }

        @Test @DisplayName("TC21k: selectList至少调用一次")
        void tc21k() {
            when(questionMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(mockQuestions);
            when(examMapper.insert(any(Exam.class))).thenReturn(1);
            when(examQuestionMapper.insert(any(ExamQuestion.class))).thenReturn(1);
            examService.createExam(1L, "测试", 2L, null, 3, 30, null);
            verify(questionMapper, atLeastOnce()).selectList(any(LambdaQueryWrapper.class));
        }
    }

    // ========== getExamDetail ==========
    @Nested @DisplayName("试卷详情")
    class GetExamDetailTests {

        @Test @DisplayName("TC21x: 获取试卷详情成功")
        void tc21x() {
            Exam exam = new Exam();
            exam.setId(1L);
            exam.setTitle("数学测试");

            ExamQuestion eq1 = new ExamQuestion();
            eq1.setId(10L); eq1.setQuestionId(1L); eq1.setSortOrder(1); eq1.setScore(5);
            ExamQuestion eq2 = new ExamQuestion();
            eq2.setId(11L); eq2.setQuestionId(2L); eq2.setSortOrder(2); eq2.setScore(3);

            Question q1 = new Question(); q1.setId(1L); q1.setContent("题1");
            Question q2 = new Question(); q2.setId(2L); q2.setContent("题2");

            when(examMapper.selectById(1L)).thenReturn(exam);
            when(examQuestionMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(eq1, eq2));
            when(questionMapper.selectBatchIds(anyList())).thenReturn(List.of(q1, q2));

            Map<String, Object> result = examService.getExamDetail(1L);
            assertNotNull(result);
            assertEquals(exam, result.get("exam"));
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> questions = (List<Map<String, Object>>) result.get("questions");
            assertEquals(2, questions.size());
        }

        @Test @DisplayName("TC21y: 详情含examQuestionId")
        void tc21y() {
            Exam exam = new Exam(); exam.setId(1L);
            ExamQuestion eq = new ExamQuestion();
            eq.setId(10L); eq.setQuestionId(1L); eq.setSortOrder(1); eq.setScore(5);
            Question q = new Question(); q.setId(1L); q.setContent("题1");

            when(examMapper.selectById(1L)).thenReturn(exam);
            when(examQuestionMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(eq));
            when(questionMapper.selectBatchIds(anyList())).thenReturn(List.of(q));

            Map<String, Object> result = examService.getExamDetail(1L);
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> questions = (List<Map<String, Object>>) result.get("questions");
            assertEquals(10L, questions.get(0).get("examQuestionId"));
        }

        @Test @DisplayName("TC21z: 详情含sortOrder")
        void tc21z() {
            Exam exam = new Exam(); exam.setId(1L);
            ExamQuestion eq = new ExamQuestion();
            eq.setId(10L); eq.setQuestionId(1L); eq.setSortOrder(3); eq.setScore(5);
            Question q = new Question(); q.setId(1L);

            when(examMapper.selectById(1L)).thenReturn(exam);
            when(examQuestionMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(eq));
            when(questionMapper.selectBatchIds(anyList())).thenReturn(List.of(q));

            Map<String, Object> result = examService.getExamDetail(1L);
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> questions = (List<Map<String, Object>>) result.get("questions");
            assertEquals(3, questions.get(0).get("sortOrder"));
        }

        @Test @DisplayName("TC21aa: 详情含score")
        void tc21aa() {
            Exam exam = new Exam(); exam.setId(1L);
            ExamQuestion eq = new ExamQuestion();
            eq.setId(10L); eq.setQuestionId(1L); eq.setSortOrder(1); eq.setScore(8);
            Question q = new Question(); q.setId(1L);

            when(examMapper.selectById(1L)).thenReturn(exam);
            when(examQuestionMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(eq));
            when(questionMapper.selectBatchIds(anyList())).thenReturn(List.of(q));

            Map<String, Object> result = examService.getExamDetail(1L);
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> questions = (List<Map<String, Object>>) result.get("questions");
            assertEquals(8, questions.get(0).get("score"));
        }

        @Test @DisplayName("TC21ab: 无题目时返回空列表")
        void tc21ab() {
            Exam exam = new Exam(); exam.setId(1L);
            when(examMapper.selectById(1L)).thenReturn(exam);
            when(examQuestionMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of());

            Map<String, Object> result = examService.getExamDetail(1L);
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> questions = (List<Map<String, Object>>) result.get("questions");
            assertEquals(0, questions.size());
        }

        @Test @DisplayName("TC21ac: result含2个key")
        void tc21ac() {
            Exam exam = new Exam(); exam.setId(1L);
            when(examMapper.selectById(1L)).thenReturn(exam);
            when(examQuestionMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of());

            Map<String, Object> result = examService.getExamDetail(1L);
            assertTrue(result.containsKey("exam"));
            assertTrue(result.containsKey("questions"));
        }

        @Test @DisplayName("TC21ad: selectById调用一次")
        void tc21ad() {
            Exam exam = new Exam(); exam.setId(1L);
            when(examMapper.selectById(1L)).thenReturn(exam);
            when(examQuestionMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of());

            examService.getExamDetail(1L);
            verify(examMapper, times(1)).selectById(1L);
        }

        @Test @DisplayName("TC21ae: 题目包含question对象")
        void tc21ae() {
            Exam exam = new Exam(); exam.setId(1L);
            ExamQuestion eq = new ExamQuestion();
            eq.setId(10L); eq.setQuestionId(1L); eq.setSortOrder(1); eq.setScore(5);
            Question q = new Question(); q.setId(1L); q.setContent("具体内容");

            when(examMapper.selectById(1L)).thenReturn(exam);
            when(examQuestionMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(eq));
            when(questionMapper.selectBatchIds(anyList())).thenReturn(List.of(q));

            Map<String, Object> result = examService.getExamDetail(1L);
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> questions = (List<Map<String, Object>>) result.get("questions");
            assertNotNull(questions.get(0).get("question"));
        }

        @Test @DisplayName("TC21af: 多题目详情")
        void tc21af() {
            Exam exam = new Exam(); exam.setId(1L);
            List<ExamQuestion> eqs = new ArrayList<>();
            List<Question> qs = new ArrayList<>();
            for (int i = 1; i <= 5; i++) {
                ExamQuestion eq = new ExamQuestion();
                eq.setId((long) i); eq.setQuestionId((long) i); eq.setSortOrder(i); eq.setScore(5);
                eqs.add(eq);
                Question q = new Question(); q.setId((long) i); q.setContent("题" + i);
                qs.add(q);
            }
            when(examMapper.selectById(1L)).thenReturn(exam);
            when(examQuestionMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(eqs);
            when(questionMapper.selectBatchIds(anyList())).thenReturn(qs);

            Map<String, Object> result = examService.getExamDetail(1L);
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> questions = (List<Map<String, Object>>) result.get("questions");
            assertEquals(5, questions.size());
        }
    }

    // ========== startExam ==========
    @Nested @DisplayName("开始考试")
    class StartExamTests {

        @Test @DisplayName("TC24: 开始考试-创建记录")
        void tc24() {
            when(examRecordMapper.insert(any(ExamRecord.class))).thenReturn(1);
            ExamRecord result = examService.startExam(1L, 1L);
            assertNotNull(result);
            assertEquals(1L, result.getExamId());
            assertEquals(1L, result.getUserId());
            assertEquals(0, result.getStatus());
        }

        @Test @DisplayName("TC24b: insert调用一次")
        void tc24b() {
            when(examRecordMapper.insert(any(ExamRecord.class))).thenReturn(1);
            examService.startExam(2L, 3L);
            verify(examRecordMapper, times(1)).insert(argThat(r ->
                r.getExamId().equals(2L) && r.getUserId().equals(3L) && r.getStatus() == 0
            ));
        }

        @Test @DisplayName("TC24c: 状态为进行中")
        void tc24c() {
            when(examRecordMapper.insert(any(ExamRecord.class))).thenReturn(1);
            ExamRecord result = examService.startExam(5L, 10L);
            assertEquals(0, result.getStatus());
            assertEquals(5L, result.getExamId());
            assertEquals(10L, result.getUserId());
        }

        @Test @DisplayName("TC24d: 返回对象即创建对象")
        void tc24d() {
            when(examRecordMapper.insert(any(ExamRecord.class))).thenReturn(1);
            ExamRecord result = examService.startExam(1L, 1L);
            assertNotNull(result);
            assertEquals(1L, result.getExamId());
        }

        @Test @DisplayName("TC24e: 不同examId和userId")
        void tc24e() {
            when(examRecordMapper.insert(any(ExamRecord.class))).thenReturn(1);
            ExamRecord result = examService.startExam(100L, 200L);
            assertEquals(100L, result.getExamId());
            assertEquals(200L, result.getUserId());
        }

        @Test @DisplayName("TC24f: insert只调用一次验证")
        void tc24f() {
            when(examRecordMapper.insert(any(ExamRecord.class))).thenReturn(1);
            examService.startExam(1L, 1L);
            verify(examRecordMapper, times(1)).insert(any(ExamRecord.class));
        }

        @Test @DisplayName("TC24g: 不调用selectById")
        void tc24g() {
            when(examRecordMapper.insert(any(ExamRecord.class))).thenReturn(1);
            examService.startExam(1L, 1L);
            verify(examRecordMapper, never()).selectById(anyLong());
        }

        @Test @DisplayName("TC24h: 不调用updateById")
        void tc24h() {
            when(examRecordMapper.insert(any(ExamRecord.class))).thenReturn(1);
            examService.startExam(1L, 1L);
            verify(examRecordMapper, never()).updateById(any());
        }

        @Test @DisplayName("TC24i: 不调用selectPage")
        void tc24i() {
            when(examRecordMapper.insert(any(ExamRecord.class))).thenReturn(1);
            examService.startExam(1L, 1L);
            verify(examRecordMapper, never()).selectPage(any(), any());
        }
    }

    // ========== submitExam ==========
    @Nested @DisplayName("提交试卷")
    class SubmitExamTests {

        @Test @DisplayName("TC25: 客观题自动评分")
        void tc25() {
            ExamRecord record = new ExamRecord();
            record.setId(1L); record.setExamId(1L); record.setStatus(0);
            ExamQuestion eq = new ExamQuestion();
            eq.setId(1L); eq.setQuestionId(1L); eq.setScore(5);
            Question q = new Question();
            q.setId(1L); q.setType(1); q.setAnswer("A");

            when(examRecordMapper.selectById(1L)).thenReturn(record);
            when(examQuestionMapper.selectById(1L)).thenReturn(eq);
            when(questionMapper.selectById(1L)).thenReturn(q);
            when(answerDetailMapper.insert(any(AnswerDetail.class))).thenReturn(1);

            List<Map<String, Object>> answers = List.of(Map.of("examQuestionId", 1L, "userAnswer", "A"));
            ExamRecord result = examService.submitExam(1L, answers);
            assertEquals(5, result.getTotalScore());
            assertEquals(1, result.getStatus());
            verify(answerDetailMapper).insert(argThat(detail -> {
                assertEquals(1, detail.getIsCorrect());
                assertEquals(5, detail.getScore());
                return true;
            }));
        }

        @Test @DisplayName("TC26: 已提交抛异常")
        void tc26() {
            ExamRecord record = new ExamRecord();
            record.setId(1L); record.setStatus(1);
            when(examRecordMapper.selectById(1L)).thenReturn(record);
            BusinessException ex = assertThrows(BusinessException.class,
                () -> examService.submitExam(1L, new ArrayList<>()));
            assertEquals("考试记录不存在或已提交", ex.getMessage());
        }

        @Test @DisplayName("TC27: 答错不得分")
        void tc27() {
            ExamRecord record = new ExamRecord();
            record.setId(2L); record.setStatus(0);
            ExamQuestion eq = new ExamQuestion();
            eq.setId(2L); eq.setQuestionId(2L); eq.setScore(5);
            Question q = new Question();
            q.setId(2L); q.setType(1); q.setAnswer("B");

            when(examRecordMapper.selectById(2L)).thenReturn(record);
            when(examQuestionMapper.selectById(2L)).thenReturn(eq);
            when(questionMapper.selectById(2L)).thenReturn(q);
            when(answerDetailMapper.insert(any(AnswerDetail.class))).thenReturn(1);

            List<Map<String, Object>> answers = List.of(Map.of("examQuestionId", 2L, "userAnswer", "A"));
            ExamRecord result = examService.submitExam(2L, answers);
            assertEquals(0, result.getTotalScore());
            verify(answerDetailMapper).insert(argThat(detail -> {
                assertEquals(0, detail.getIsCorrect());
                assertEquals(0, detail.getScore());
                return true;
            }));
        }

        @Test @DisplayName("TC25b: 状态更新为1")
        void tc25b() {
            ExamRecord record = new ExamRecord();
            record.setId(3L); record.setStatus(0);
            when(examRecordMapper.selectById(3L)).thenReturn(record);
            examService.submitExam(3L, new ArrayList<>());
            verify(examRecordMapper).updateById(argThat(r -> r.getStatus() == 1));
        }

        @Test @DisplayName("TC26b: 记录不存在抛异常")
        void tc26b() {
            when(examRecordMapper.selectById(999L)).thenReturn(null);
            BusinessException ex = assertThrows(BusinessException.class,
                () -> examService.submitExam(999L, new ArrayList<>()));
            assertEquals("考试记录不存在或已提交", ex.getMessage());
        }

        @Test @DisplayName("TC27b: 多题答对累计得分")
        void tc27b() {
            ExamRecord record = new ExamRecord();
            record.setId(4L); record.setStatus(0);
            ExamQuestion eq1 = new ExamQuestion();
            eq1.setId(1L); eq1.setQuestionId(1L); eq1.setScore(5);
            ExamQuestion eq2 = new ExamQuestion();
            eq2.setId(2L); eq2.setQuestionId(2L); eq2.setScore(3);
            Question q1 = new Question(); q1.setId(1L); q1.setType(1); q1.setAnswer("A");
            Question q2 = new Question(); q2.setId(2L); q2.setType(1); q2.setAnswer("B");

            when(examRecordMapper.selectById(4L)).thenReturn(record);
            when(examQuestionMapper.selectById(1L)).thenReturn(eq1);
            when(examQuestionMapper.selectById(2L)).thenReturn(eq2);
            when(questionMapper.selectById(1L)).thenReturn(q1);
            when(questionMapper.selectById(2L)).thenReturn(q2);
            when(answerDetailMapper.insert(any(AnswerDetail.class))).thenReturn(1);

            List<Map<String, Object>> answers = List.of(
                Map.of("examQuestionId", 1L, "userAnswer", "A"),
                Map.of("examQuestionId", 2L, "userAnswer", "B")
            );
            ExamRecord result = examService.submitExam(4L, answers);
            assertEquals(8, result.getTotalScore());
            verify(answerDetailMapper, times(2)).insert(any(AnswerDetail.class));
        }

        @Test @DisplayName("TC25c: 判断题type=4自动评分")
        void tc25c() {
            ExamRecord record = new ExamRecord();
            record.setId(5L); record.setStatus(0);
            ExamQuestion eq = new ExamQuestion();
            eq.setId(3L); eq.setQuestionId(3L); eq.setScore(3);
            Question q = new Question();
            q.setId(3L); q.setType(4); q.setAnswer("对");

            when(examRecordMapper.selectById(5L)).thenReturn(record);
            when(examQuestionMapper.selectById(3L)).thenReturn(eq);
            when(questionMapper.selectById(3L)).thenReturn(q);
            when(answerDetailMapper.insert(any(AnswerDetail.class))).thenReturn(1);

            List<Map<String, Object>> answers = List.of(Map.of("examQuestionId", 3L, "userAnswer", "对"));
            ExamRecord result = examService.submitExam(5L, answers);
            assertEquals(3, result.getTotalScore());
        }

        @Test @DisplayName("TC25d: 大小写不敏感")
        void tc25d() {
            ExamRecord record = new ExamRecord();
            record.setId(6L); record.setStatus(0);
            ExamQuestion eq = new ExamQuestion();
            eq.setId(4L); eq.setQuestionId(4L); eq.setScore(5);
            Question q = new Question();
            q.setId(4L); q.setType(1); q.setAnswer("a");

            when(examRecordMapper.selectById(6L)).thenReturn(record);
            when(examQuestionMapper.selectById(4L)).thenReturn(eq);
            when(questionMapper.selectById(4L)).thenReturn(q);
            when(answerDetailMapper.insert(any(AnswerDetail.class))).thenReturn(1);

            List<Map<String, Object>> answers = List.of(Map.of("examQuestionId", 4L, "userAnswer", "A"));
            ExamRecord result = examService.submitExam(6L, answers);
            assertEquals(5, result.getTotalScore());
        }

        @Test @DisplayName("TC25e: 空答案列表得0分")
        void tc25e() {
            ExamRecord record = new ExamRecord();
            record.setId(7L); record.setStatus(0);
            when(examRecordMapper.selectById(7L)).thenReturn(record);
            ExamRecord result = examService.submitExam(7L, new ArrayList<>());
            assertEquals(0, result.getTotalScore());
        }

        @Test @DisplayName("TC25f: 主观题暂给0分")
        void tc25f() {
            ExamRecord record = new ExamRecord();
            record.setId(8L); record.setStatus(0);
            ExamQuestion eq = new ExamQuestion();
            eq.setId(5L); eq.setQuestionId(5L); eq.setScore(10);
            Question q = new Question();
            q.setId(5L); q.setType(3); q.setAnswer("详解");

            when(examRecordMapper.selectById(8L)).thenReturn(record);
            when(examQuestionMapper.selectById(5L)).thenReturn(eq);
            when(questionMapper.selectById(5L)).thenReturn(q);
            when(answerDetailMapper.insert(any(AnswerDetail.class))).thenReturn(1);

            List<Map<String, Object>> answers = List.of(Map.of("examQuestionId", 5L, "userAnswer", "我的答案"));
            ExamRecord result = examService.submitExam(8L, answers);
            assertEquals(0, result.getTotalScore());
        }

        @Test @DisplayName("TC25g: answerDetail字段正确")
        void tc25g() {
            ExamRecord record = new ExamRecord();
            record.setId(9L); record.setStatus(0);
            ExamQuestion eq = new ExamQuestion();
            eq.setId(6L); eq.setQuestionId(6L); eq.setScore(5);
            Question q = new Question();
            q.setId(6L); q.setType(1); q.setAnswer("C");

            when(examRecordMapper.selectById(9L)).thenReturn(record);
            when(examQuestionMapper.selectById(6L)).thenReturn(eq);
            when(questionMapper.selectById(6L)).thenReturn(q);
            when(answerDetailMapper.insert(any(AnswerDetail.class))).thenReturn(1);

            List<Map<String, Object>> answers = List.of(Map.of("examQuestionId", 6L, "userAnswer", "C"));
            examService.submitExam(9L, answers);

            verify(answerDetailMapper).insert(argThat(d -> {
                assertEquals(9L, d.getExamRecordId());
                assertEquals(6L, d.getExamQuestionId());
                assertEquals("C", d.getUserAnswer());
                assertEquals(1, d.getIsCorrect());
                return true;
            }));
        }

        @Test @DisplayName("TC25h: updateById调用一次")
        void tc25h() {
            ExamRecord record = new ExamRecord();
            record.setId(10L); record.setStatus(0);
            when(examRecordMapper.selectById(10L)).thenReturn(record);
            examService.submitExam(10L, new ArrayList<>());
            verify(examRecordMapper, times(1)).updateById(any(ExamRecord.class));
        }

        @Test @DisplayName("TC27c: 一题对一题错")
        void tc27c() {
            ExamRecord record = new ExamRecord();
            record.setId(11L); record.setStatus(0);
            ExamQuestion eq1 = new ExamQuestion();
            eq1.setId(1L); eq1.setQuestionId(1L); eq1.setScore(5);
            ExamQuestion eq2 = new ExamQuestion();
            eq2.setId(2L); eq2.setQuestionId(2L); eq2.setScore(3);
            Question q1 = new Question(); q1.setId(1L); q1.setType(1); q1.setAnswer("A");
            Question q2 = new Question(); q2.setId(2L); q2.setType(1); q2.setAnswer("B");

            when(examRecordMapper.selectById(11L)).thenReturn(record);
            when(examQuestionMapper.selectById(1L)).thenReturn(eq1);
            when(examQuestionMapper.selectById(2L)).thenReturn(eq2);
            when(questionMapper.selectById(1L)).thenReturn(q1);
            when(questionMapper.selectById(2L)).thenReturn(q2);
            when(answerDetailMapper.insert(any(AnswerDetail.class))).thenReturn(1);

            List<Map<String, Object>> answers = List.of(
                Map.of("examQuestionId", 1L, "userAnswer", "A"),
                Map.of("examQuestionId", 2L, "userAnswer", "C")
            );
            ExamRecord result = examService.submitExam(11L, answers);
            assertEquals(5, result.getTotalScore());
        }

        @Test @DisplayName("TC26c: 记录不存在不插入detail")
        void tc26c() {
            when(examRecordMapper.selectById(888L)).thenReturn(null);
            assertThrows(BusinessException.class,
                () -> examService.submitExam(888L, List.of(Map.of("examQuestionId", 1L, "userAnswer", "A"))));
            verify(answerDetailMapper, never()).insert(any());
        }
    }

    // ========== examRecords ==========
    @Nested @DisplayName("考试记录查询")
    class ExamRecordTests {

        @Test @DisplayName("TC28: 获取考试记录列表")
        void tc28() {
            Page<ExamRecord> mockPage = new Page<>(1, 10);
            mockPage.setRecords(List.of());
            when(examRecordMapper.selectPage(any(Page.class), any(LambdaQueryWrapper.class))).thenReturn(mockPage);
            Page<ExamRecord> result = examService.getExamRecords(1L, 1, 10);
            assertNotNull(result);
        }

        @Test @DisplayName("TC29: 获取考试记录详情")
        void tc29() {
            ExamRecord record = new ExamRecord();
            record.setId(1L); record.setExamId(1L);
            Exam exam = new Exam();
            exam.setId(1L); exam.setTitle("数学测试");

            when(examRecordMapper.selectById(1L)).thenReturn(record);
            when(examMapper.selectById(1L)).thenReturn(exam);
            when(answerDetailMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(new ArrayList<>());

            Map<String, Object> result = examService.getExamRecordDetail(1L);
            assertNotNull(result);
            assertEquals(exam, result.get("exam"));
            assertEquals(record, result.get("record"));
        }

        @Test @DisplayName("TC28b: 分页参数正确")
        void tc28b() {
            Page<ExamRecord> mockPage = new Page<>(2, 5);
            mockPage.setRecords(List.of());
            when(examRecordMapper.selectPage(any(Page.class), any(LambdaQueryWrapper.class))).thenReturn(mockPage);
            examService.getExamRecords(1L, 2, 5);
            verify(examRecordMapper).selectPage(argThat(p ->
                p.getCurrent() == 2 && p.getSize() == 5
            ), any());
        }

        @Test @DisplayName("TC29b: 含答题明细")
        void tc29b() {
            ExamRecord record = new ExamRecord();
            record.setId(2L); record.setExamId(1L);
            Exam exam = new Exam(); exam.setId(1L);
            AnswerDetail detail = new AnswerDetail();
            detail.setId(1L); detail.setIsCorrect(1);

            when(examRecordMapper.selectById(2L)).thenReturn(record);
            when(examMapper.selectById(1L)).thenReturn(exam);
            when(answerDetailMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(detail));

            Map<String, Object> result = examService.getExamRecordDetail(2L);
            @SuppressWarnings("unchecked")
            List<AnswerDetail> details = (List<AnswerDetail>) result.get("answerDetails");
            assertEquals(1, details.size());
        }

        @Test @DisplayName("TC28c: 大分页参数")
        void tc28c() {
            Page<ExamRecord> mockPage = new Page<>(100, 50);
            mockPage.setRecords(List.of());
            when(examRecordMapper.selectPage(any(Page.class), any(LambdaQueryWrapper.class))).thenReturn(mockPage);
            Page<ExamRecord> result = examService.getExamRecords(1L, 100, 50);
            assertNotNull(result);
            verify(examRecordMapper).selectPage(argThat(p ->
                p.getCurrent() == 100 && p.getSize() == 50
            ), any());
        }

        @Test @DisplayName("TC28d: 空记录列表")
        void tc28d() {
            Page<ExamRecord> mockPage = new Page<>(1, 10);
            mockPage.setRecords(List.of());
            mockPage.setTotal(0);
            when(examRecordMapper.selectPage(any(Page.class), any(LambdaQueryWrapper.class))).thenReturn(mockPage);
            Page<ExamRecord> result = examService.getExamRecords(1L, 1, 10);
            assertEquals(0, result.getRecords().size());
        }

        @Test @DisplayName("TC29c: 详情含3个key")
        void tc29c() {
            ExamRecord record = new ExamRecord();
            record.setId(3L); record.setExamId(1L);
            Exam exam = new Exam(); exam.setId(1L);

            when(examRecordMapper.selectById(3L)).thenReturn(record);
            when(examMapper.selectById(1L)).thenReturn(exam);
            when(answerDetailMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of());

            Map<String, Object> result = examService.getExamRecordDetail(3L);
            assertTrue(result.containsKey("record"));
            assertTrue(result.containsKey("exam"));
            assertTrue(result.containsKey("answerDetails"));
        }

        @Test @DisplayName("TC29d: 多条答题明细")
        void tc29d() {
            ExamRecord record = new ExamRecord();
            record.setId(4L); record.setExamId(1L);
            Exam exam = new Exam(); exam.setId(1L);

            List<AnswerDetail> details = new ArrayList<>();
            for (int i = 1; i <= 5; i++) {
                AnswerDetail d = new AnswerDetail();
                d.setId((long) i); d.setIsCorrect(i % 2);
                details.add(d);
            }

            when(examRecordMapper.selectById(4L)).thenReturn(record);
            when(examMapper.selectById(1L)).thenReturn(exam);
            when(answerDetailMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(details);

            Map<String, Object> result = examService.getExamRecordDetail(4L);
            @SuppressWarnings("unchecked")
            List<AnswerDetail> d = (List<AnswerDetail>) result.get("answerDetails");
            assertEquals(5, d.size());
        }

        @Test @DisplayName("TC28e: selectPage调用一次")
        void tc28e() {
            Page<ExamRecord> mockPage = new Page<>(1, 10);
            mockPage.setRecords(List.of());
            when(examRecordMapper.selectPage(any(Page.class), any(LambdaQueryWrapper.class))).thenReturn(mockPage);
            examService.getExamRecords(1L, 1, 10);
            verify(examRecordMapper, times(1)).selectPage(any(Page.class), any(LambdaQueryWrapper.class));
        }

        @Test @DisplayName("TC28f: 返回记录含数据")
        void tc28f() {
            ExamRecord r = new ExamRecord(); r.setId(1L); r.setStatus(1);
            Page<ExamRecord> mockPage = new Page<>(1, 10);
            mockPage.setRecords(List.of(r));
            when(examRecordMapper.selectPage(any(Page.class), any(LambdaQueryWrapper.class))).thenReturn(mockPage);
            Page<ExamRecord> result = examService.getExamRecords(1L, 1, 10);
            assertEquals(1, result.getRecords().size());
            assertEquals(1, result.getRecords().get(0).getStatus());
        }

        @Test @DisplayName("TC29e: 详情record正确")
        void tc29e() {
            ExamRecord record = new ExamRecord();
            record.setId(5L); record.setExamId(2L);
            Exam exam = new Exam(); exam.setId(2L);
            when(examRecordMapper.selectById(5L)).thenReturn(record);
            when(examMapper.selectById(2L)).thenReturn(exam);
            when(answerDetailMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of());
            Map<String, Object> result = examService.getExamRecordDetail(5L);
            assertEquals(record, result.get("record"));
        }

        @Test @DisplayName("TC29f: 详情exam正确")
        void tc29f() {
            ExamRecord record = new ExamRecord();
            record.setId(6L); record.setExamId(3L);
            Exam exam = new Exam(); exam.setId(3L); exam.setTitle("语文");
            when(examRecordMapper.selectById(6L)).thenReturn(record);
            when(examMapper.selectById(3L)).thenReturn(exam);
            when(answerDetailMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of());
            Map<String, Object> result = examService.getExamRecordDetail(6L);
            assertEquals(exam, result.get("exam"));
        }

        @Test @DisplayName("TC29g: 空答题明细")
        void tc29g() {
            ExamRecord record = new ExamRecord();
            record.setId(7L); record.setExamId(1L);
            Exam exam = new Exam(); exam.setId(1L);
            when(examRecordMapper.selectById(7L)).thenReturn(record);
            when(examMapper.selectById(1L)).thenReturn(exam);
            when(answerDetailMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of());
            Map<String, Object> result = examService.getExamRecordDetail(7L);
            @SuppressWarnings("unchecked")
            List<AnswerDetail> details = (List<AnswerDetail>) result.get("answerDetails");
            assertEquals(0, details.size());
        }

        @Test @DisplayName("TC28g: 不同userId查询")
        void tc28g() {
            Page<ExamRecord> mockPage = new Page<>(1, 10);
            mockPage.setRecords(List.of());
            when(examRecordMapper.selectPage(any(Page.class), any(LambdaQueryWrapper.class))).thenReturn(mockPage);
            examService.getExamRecords(99L, 1, 10);
            verify(examRecordMapper).selectPage(any(Page.class), any(LambdaQueryWrapper.class));
        }

        @Test @DisplayName("TC28h: 返回非null")
        void tc28h() {
            Page<ExamRecord> mockPage = new Page<>(1, 10);
            mockPage.setRecords(List.of());
            when(examRecordMapper.selectPage(any(Page.class), any(LambdaQueryWrapper.class))).thenReturn(mockPage);
            assertNotNull(examService.getExamRecords(1L, 1, 10));
        }

        @Test @DisplayName("TC29h: selectById和selectList各调用一次")
        void tc29h() {
            ExamRecord record = new ExamRecord();
            record.setId(8L); record.setExamId(1L);
            Exam exam = new Exam(); exam.setId(1L);
            when(examRecordMapper.selectById(8L)).thenReturn(record);
            when(examMapper.selectById(1L)).thenReturn(exam);
            when(answerDetailMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of());
            examService.getExamRecordDetail(8L);
            verify(examRecordMapper, times(1)).selectById(8L);
            verify(examMapper, times(1)).selectById(1L);
            verify(answerDetailMapper, times(1)).selectList(any());
        }
    }
}
