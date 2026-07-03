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
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("PracticeService 单元测试")
class PracticeServiceTest {

    @Mock private QuestionMapper questionMapper;
    @Mock private PracticeRecordMapper practiceRecordMapper;
    @Mock private WrongQuestionMapper wrongQuestionMapper;
    @InjectMocks private PracticeService practiceService;

    private Question choiceQuestion;
    private Question subjectiveQuestion;

    @BeforeEach
    void setUp() {
        choiceQuestion = new Question();
        choiceQuestion.setId(1L);
        choiceQuestion.setType(1);
        choiceQuestion.setAnswer("A");
        choiceQuestion.setScore(5);
        choiceQuestion.setDifficulty(2);
        choiceQuestion.setContent("下列哪个是二次根式？");

        subjectiveQuestion = new Question();
        subjectiveQuestion.setId(2L);
        subjectiveQuestion.setType(3);
        subjectiveQuestion.setAnswer("详细解答过程...");
        subjectiveQuestion.setScore(10);
        subjectiveQuestion.setDifficulty(3);
    }

    // ========== getQuestionsByKnowledge ==========
    @Nested @DisplayName("获取知识点题目")
    class GetQuestionsTests {

        @Test @DisplayName("TC13: 按知识点获取题目(分页)")
        void tc13() {
            Page<Question> mockPage = new Page<>(1, 10);
            mockPage.setRecords(List.of(choiceQuestion));
            mockPage.setTotal(1);
            when(questionMapper.selectPage(any(Page.class), any(LambdaQueryWrapper.class))).thenReturn(mockPage);
            Page<Question> result = practiceService.getQuestionsByKnowledge(1L, 1, 10);
            assertNotNull(result);
            assertEquals(1, result.getRecords().size());
            assertEquals("下列哪个是二次根式？", result.getRecords().get(0).getContent());
        }

        @Test @DisplayName("TC13b: 空结果")
        void tc13b() {
            Page<Question> mockPage = new Page<>(1, 10);
            mockPage.setRecords(List.of());
            mockPage.setTotal(0);
            when(questionMapper.selectPage(any(Page.class), any(LambdaQueryWrapper.class))).thenReturn(mockPage);
            Page<Question> result = practiceService.getQuestionsByKnowledge(999L, 1, 10);
            assertNotNull(result);
            assertEquals(0, result.getRecords().size());
        }

        @Test @DisplayName("TC13c: 分页参数正确")
        void tc13c() {
            Page<Question> mockPage = new Page<>(3, 5);
            mockPage.setRecords(List.of());
            when(questionMapper.selectPage(any(Page.class), any(LambdaQueryWrapper.class))).thenReturn(mockPage);
            practiceService.getQuestionsByKnowledge(1L, 3, 5);
            verify(questionMapper).selectPage(argThat(p ->
                p.getCurrent() == 3 && p.getSize() == 5
            ), any());
        }

        @Test @DisplayName("TC13d: 返回结果非null")
        void tc13d() {
            Page<Question> mockPage = new Page<>(1, 10);
            mockPage.setRecords(List.of());
            when(questionMapper.selectPage(any(Page.class), any(LambdaQueryWrapper.class))).thenReturn(mockPage);
            Page<Question> result = practiceService.getQuestionsByKnowledge(1L, 1, 10);
            assertNotNull(result);
        }

        @Test @DisplayName("TC13e: total正确")
        void tc13e() {
            Page<Question> mockPage = new Page<>(1, 10);
            mockPage.setRecords(List.of(choiceQuestion));
            mockPage.setTotal(100);
            when(questionMapper.selectPage(any(Page.class), any(LambdaQueryWrapper.class))).thenReturn(mockPage);
            Page<Question> result = practiceService.getQuestionsByKnowledge(1L, 1, 10);
            assertEquals(100, result.getTotal());
        }

        @Test @DisplayName("TC13f: selectPage调用一次")
        void tc13f() {
            Page<Question> mockPage = new Page<>(1, 10);
            mockPage.setRecords(List.of());
            when(questionMapper.selectPage(any(Page.class), any(LambdaQueryWrapper.class))).thenReturn(mockPage);
            practiceService.getQuestionsByKnowledge(1L, 1, 10);
            verify(questionMapper, times(1)).selectPage(any(Page.class), any(LambdaQueryWrapper.class));
        }
    }

    // ========== submitAnswer ==========
    @Nested @DisplayName("提交练习答案")
    class SubmitAnswerTests {

        @Test @DisplayName("TC14: 客观题答对自动评分")
        void tc14() {
            when(questionMapper.selectById(1L)).thenReturn(choiceQuestion);
            when(practiceRecordMapper.insert(any(PracticeRecord.class))).thenReturn(1);
            PracticeRecord result = practiceService.submitAnswer(1L, 1L, "A", 30);
            assertNotNull(result);
            assertEquals(1, result.getIsCorrect());
            assertEquals(java.math.BigDecimal.valueOf(5), result.getAiScore());
            assertEquals("A", result.getUserAnswer());
            verify(wrongQuestionMapper, never()).selectOne(any());
        }

        @Test @DisplayName("TC15: 答错自动评分+加入错题本")
        void tc15() {
            when(questionMapper.selectById(1L)).thenReturn(choiceQuestion);
            when(practiceRecordMapper.insert(any(PracticeRecord.class))).thenReturn(1);
            when(wrongQuestionMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(null);
            when(wrongQuestionMapper.insert(any(WrongQuestion.class))).thenReturn(1);
            PracticeRecord result = practiceService.submitAnswer(1L, 1L, "B", 30);
            assertNotNull(result);
            assertEquals(0, result.getIsCorrect());
            assertEquals(java.math.BigDecimal.ZERO, result.getAiScore());
            verify(wrongQuestionMapper).insert(any(WrongQuestion.class));
        }

        @Test @DisplayName("TC16: 主观题暂不自动评分")
        void tc16() {
            when(questionMapper.selectById(2L)).thenReturn(subjectiveQuestion);
            when(practiceRecordMapper.insert(any(PracticeRecord.class))).thenReturn(1);
            when(wrongQuestionMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(null);
            when(wrongQuestionMapper.insert(any(WrongQuestion.class))).thenReturn(1);
            PracticeRecord result = practiceService.submitAnswer(1L, 2L, "我的答案", 120);
            assertNotNull(result);
            assertEquals(java.math.BigDecimal.ZERO, result.getAiScore());
            assertEquals(0, result.getIsCorrect());
        }

        @Test @DisplayName("TC17: 题目不存在")
        void tc17() {
            when(questionMapper.selectById(999L)).thenReturn(null);
            BusinessException ex = assertThrows(BusinessException.class,
                () -> practiceService.submitAnswer(1L, 999L, "A", 30));
            assertEquals("题目不存在", ex.getMessage());
        }

        @Test @DisplayName("TC18: 错题重做次数累加")
        void tc18() {
            when(questionMapper.selectById(1L)).thenReturn(choiceQuestion);
            when(practiceRecordMapper.insert(any(PracticeRecord.class))).thenReturn(1);
            WrongQuestion existing = new WrongQuestion();
            existing.setId(1L); existing.setWrongCount(2);
            when(wrongQuestionMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(existing);
            practiceService.submitAnswer(1L, 1L, "C", 30);
            verify(wrongQuestionMapper).updateById(argThat(wq -> {
                assertEquals(3, wq.getWrongCount());
                return true;
            }));
        }

        @Test @DisplayName("TC14b: 练习记录字段正确")
        void tc14b() {
            when(questionMapper.selectById(1L)).thenReturn(choiceQuestion);
            when(practiceRecordMapper.insert(any(PracticeRecord.class))).thenReturn(1);
            practiceService.submitAnswer(5L, 1L, "A", 45);
            verify(practiceRecordMapper).insert(argThat(r -> {
                assertEquals(5L, r.getUserId());
                assertEquals(1L, r.getQuestionId());
                assertEquals("A", r.getUserAnswer());
                assertEquals(1, r.getIsCorrect());
                assertEquals(45, r.getTimeSpent());
                return true;
            }));
        }

        @Test @DisplayName("TC15b: 新增错题count=1")
        void tc15b() {
            when(questionMapper.selectById(1L)).thenReturn(choiceQuestion);
            when(practiceRecordMapper.insert(any(PracticeRecord.class))).thenReturn(1);
            when(wrongQuestionMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(null);
            when(wrongQuestionMapper.insert(any(WrongQuestion.class))).thenReturn(1);
            practiceService.submitAnswer(3L, 1L, "C", 20);
            verify(wrongQuestionMapper).insert(argThat(wq -> {
                assertEquals(3L, wq.getUserId());
                assertEquals(1L, wq.getQuestionId());
                assertEquals("C", wq.getWrongAnswer());
                assertEquals("A", wq.getCorrectAnswer());
                assertEquals(1, wq.getWrongCount());
                return true;
            }));
        }

        @Test @DisplayName("TC17b: 题目不存在不插入记录")
        void tc17b() {
            when(questionMapper.selectById(888L)).thenReturn(null);
            assertThrows(BusinessException.class,
                () -> practiceService.submitAnswer(1L, 888L, "A", 30));
            verify(practiceRecordMapper, never()).insert(any());
        }

        @Test @DisplayName("TC14c: 答对不调用错题本")
        void tc14c() {
            when(questionMapper.selectById(1L)).thenReturn(choiceQuestion);
            when(practiceRecordMapper.insert(any(PracticeRecord.class))).thenReturn(1);
            practiceService.submitAnswer(1L, 1L, "A", 30);
            verify(wrongQuestionMapper, never()).selectOne(any());
            verify(wrongQuestionMapper, never()).insert(any());
            verify(wrongQuestionMapper, never()).updateById(any());
        }

        @Test @DisplayName("TC14d: timeSpent正确保存")
        void tc14d() {
            when(questionMapper.selectById(1L)).thenReturn(choiceQuestion);
            when(practiceRecordMapper.insert(any(PracticeRecord.class))).thenReturn(1);
            practiceService.submitAnswer(1L, 1L, "A", 0);
            verify(practiceRecordMapper).insert(argThat(r -> r.getTimeSpent() == 0));
        }

        @Test @DisplayName("TC14e: timeSpent大值")
        void tc14e() {
            when(questionMapper.selectById(1L)).thenReturn(choiceQuestion);
            when(practiceRecordMapper.insert(any(PracticeRecord.class))).thenReturn(1);
            practiceService.submitAnswer(1L, 1L, "A", 99999);
            verify(practiceRecordMapper).insert(argThat(r -> r.getTimeSpent() == 99999));
        }

        @Test @DisplayName("TC15c: 答错已有错题不新增")
        void tc15c() {
            when(questionMapper.selectById(1L)).thenReturn(choiceQuestion);
            when(practiceRecordMapper.insert(any(PracticeRecord.class))).thenReturn(1);
            WrongQuestion existing = new WrongQuestion();
            existing.setId(1L); existing.setWrongCount(5);
            when(wrongQuestionMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(existing);
            practiceService.submitAnswer(1L, 1L, "D", 30);
            verify(wrongQuestionMapper, never()).insert(any(WrongQuestion.class));
            verify(wrongQuestionMapper).updateById(any(WrongQuestion.class));
        }

        @Test @DisplayName("TC14f: 答对分数等于题目分数")
        void tc14f() {
            Question q = new Question();
            q.setId(10L); q.setType(1); q.setAnswer("B"); q.setScore(20);
            when(questionMapper.selectById(10L)).thenReturn(q);
            when(practiceRecordMapper.insert(any(PracticeRecord.class))).thenReturn(1);
            PracticeRecord result = practiceService.submitAnswer(1L, 10L, "B", 30);
            assertEquals(java.math.BigDecimal.valueOf(20), result.getAiScore());
        }

        @Test @DisplayName("TC15d: 答错分数为0")
        void tc15d() {
            when(questionMapper.selectById(1L)).thenReturn(choiceQuestion);
            when(practiceRecordMapper.insert(any(PracticeRecord.class))).thenReturn(1);
            when(wrongQuestionMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(null);
            when(wrongQuestionMapper.insert(any(WrongQuestion.class))).thenReturn(1);
            PracticeRecord result = practiceService.submitAnswer(1L, 1L, "X", 30);
            assertEquals(java.math.BigDecimal.ZERO, result.getAiScore());
        }

        @Test @DisplayName("TC14g: insert调用一次")
        void tc14g() {
            when(questionMapper.selectById(1L)).thenReturn(choiceQuestion);
            when(practiceRecordMapper.insert(any(PracticeRecord.class))).thenReturn(1);
            practiceService.submitAnswer(1L, 1L, "A", 30);
            verify(practiceRecordMapper, times(1)).insert(any(PracticeRecord.class));
        }

        @Test @DisplayName("TC14h: userAnswer正确保存")
        void tc14h() {
            when(questionMapper.selectById(1L)).thenReturn(choiceQuestion);
            when(practiceRecordMapper.insert(any(PracticeRecord.class))).thenReturn(1);
            practiceService.submitAnswer(1L, 1L, "A", 30);
            verify(practiceRecordMapper).insert(argThat(r -> "A".equals(r.getUserAnswer())));
        }

        @Test @DisplayName("TC15e: 答错错题的wrongAnswer正确")
        void tc15e() {
            when(questionMapper.selectById(1L)).thenReturn(choiceQuestion);
            when(practiceRecordMapper.insert(any(PracticeRecord.class))).thenReturn(1);
            when(wrongQuestionMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(null);
            when(wrongQuestionMapper.insert(any(WrongQuestion.class))).thenReturn(1);
            practiceService.submitAnswer(1L, 1L, "D", 30);
            verify(wrongQuestionMapper).insert(argThat(wq -> "D".equals(wq.getWrongAnswer())));
        }

        @Test @DisplayName("TC16g: 主观题答错也加入错题本")
        void tc16g() {
            when(questionMapper.selectById(2L)).thenReturn(subjectiveQuestion);
            when(practiceRecordMapper.insert(any(PracticeRecord.class))).thenReturn(1);
            when(wrongQuestionMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(null);
            when(wrongQuestionMapper.insert(any(WrongQuestion.class))).thenReturn(1);
            practiceService.submitAnswer(1L, 2L, "我的答案", 120);
            verify(wrongQuestionMapper).insert(any(WrongQuestion.class));
        }

        @Test @DisplayName("TC14i: 不同userId提交")
        void tc14i() {
            when(questionMapper.selectById(1L)).thenReturn(choiceQuestion);
            when(practiceRecordMapper.insert(any(PracticeRecord.class))).thenReturn(1);
            practiceService.submitAnswer(99L, 1L, "A", 30);
            verify(practiceRecordMapper).insert(argThat(r -> r.getUserId().equals(99L)));
        }

        @Test @DisplayName("TC14j: selectById调用一次")
        void tc14j() {
            when(questionMapper.selectById(1L)).thenReturn(choiceQuestion);
            when(practiceRecordMapper.insert(any(PracticeRecord.class))).thenReturn(1);
            practiceService.submitAnswer(1L, 1L, "A", 30);
            verify(questionMapper, times(1)).selectById(1L);
        }

        @Test @DisplayName("TC15f: 答错correctAnswer保存正确答案")
        void tc15f() {
            when(questionMapper.selectById(1L)).thenReturn(choiceQuestion);
            when(practiceRecordMapper.insert(any(PracticeRecord.class))).thenReturn(1);
            when(wrongQuestionMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(null);
            when(wrongQuestionMapper.insert(any(WrongQuestion.class))).thenReturn(1);
            practiceService.submitAnswer(1L, 1L, "X", 30);
            verify(wrongQuestionMapper).insert(argThat(wq -> "A".equals(wq.getCorrectAnswer())));
        }

        @Test @DisplayName("TC14k: 答对isCorrect=1")
        void tc14k() {
            when(questionMapper.selectById(1L)).thenReturn(choiceQuestion);
            when(practiceRecordMapper.insert(any(PracticeRecord.class))).thenReturn(1);
            PracticeRecord result = practiceService.submitAnswer(1L, 1L, "A", 30);
            assertEquals(1, result.getIsCorrect());
        }

        @Test @DisplayName("TC15g: 答错isCorrect=0")
        void tc15g() {
            when(questionMapper.selectById(1L)).thenReturn(choiceQuestion);
            when(practiceRecordMapper.insert(any(PracticeRecord.class))).thenReturn(1);
            when(wrongQuestionMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(null);
            when(wrongQuestionMapper.insert(any(WrongQuestion.class))).thenReturn(1);
            PracticeRecord result = practiceService.submitAnswer(1L, 1L, "Z", 30);
            assertEquals(0, result.getIsCorrect());
        }

        @Test @DisplayName("TC18b: 错题次数从5增加到6")
        void tc18b() {
            when(questionMapper.selectById(1L)).thenReturn(choiceQuestion);
            when(practiceRecordMapper.insert(any(PracticeRecord.class))).thenReturn(1);
            WrongQuestion existing = new WrongQuestion();
            existing.setId(1L); existing.setWrongCount(5);
            when(wrongQuestionMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(existing);
            practiceService.submitAnswer(1L, 1L, "B", 30);
            verify(wrongQuestionMapper).updateById(argThat(wq -> wq.getWrongCount() == 6));
        }

        @Test @DisplayName("TC14l: 返回对象非null")
        void tc14l() {
            when(questionMapper.selectById(1L)).thenReturn(choiceQuestion);
            when(practiceRecordMapper.insert(any(PracticeRecord.class))).thenReturn(1);
            assertNotNull(practiceService.submitAnswer(1L, 1L, "A", 30));
        }

        @Test @DisplayName("TC17c: 题目不存在错误消息正确")
        void tc17c() {
            when(questionMapper.selectById(777L)).thenReturn(null);
            BusinessException ex = assertThrows(BusinessException.class,
                () -> practiceService.submitAnswer(1L, 777L, "A", 30));
            assertEquals("题目不存在", ex.getMessage());
        }
    }

    // ========== getPracticeRecords ==========
    @Nested @DisplayName("获取练习记录")
    class GetPracticeRecordsTests {

        @Test @DisplayName("TC16b: 获取练习记录成功")
        void tc16b() {
            PracticeRecord r = new PracticeRecord();
            r.setId(1L); r.setUserId(1L); r.setIsCorrect(1);
            when(practiceRecordMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(r));
            List<PracticeRecord> result = practiceService.getPracticeRecords(1L, null, null);
            assertEquals(1, result.size());
        }

        @Test @DisplayName("TC16c: 空练习记录")
        void tc16c() {
            when(practiceRecordMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of());
            List<PracticeRecord> result = practiceService.getPracticeRecords(1L, null, null);
            assertEquals(0, result.size());
        }

        @Test @DisplayName("TC16d: 多条记录")
        void tc16d() {
            List<PracticeRecord> records = new ArrayList<>();
            for (int i = 1; i <= 5; i++) {
                PracticeRecord r = new PracticeRecord();
                r.setId((long) i); r.setUserId(1L);
                records.add(r);
            }
            when(practiceRecordMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(records);
            List<PracticeRecord> result = practiceService.getPracticeRecords(1L, null, null);
            assertEquals(5, result.size());
        }

        @Test @DisplayName("TC16e: selectList调用一次")
        void tc16e() {
            when(practiceRecordMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of());
            practiceService.getPracticeRecords(1L, null, null);
            verify(practiceRecordMapper, times(1)).selectList(any(LambdaQueryWrapper.class));
        }

        @Test @DisplayName("TC16f: 返回非null")
        void tc16f() {
            when(practiceRecordMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of());
            assertNotNull(practiceService.getPracticeRecords(1L, null, null));
        }
    }

    // ========== judgeQuestion ==========
    @Nested @DisplayName("判断题自动评分")
    class JudgeQuestionTests {

        @Test @DisplayName("TC19: 判断题答对")
        void tc19() {
            Question judgeQ = new Question();
            judgeQ.setId(3L); judgeQ.setType(4); judgeQ.setAnswer("对"); judgeQ.setScore(3);
            when(questionMapper.selectById(3L)).thenReturn(judgeQ);
            when(practiceRecordMapper.insert(any(PracticeRecord.class))).thenReturn(1);
            PracticeRecord result = practiceService.submitAnswer(1L, 3L, "对", 10);
            assertEquals(1, result.getIsCorrect());
            assertEquals(java.math.BigDecimal.valueOf(3), result.getAiScore());
        }

        @Test @DisplayName("TC20: 大小写不敏感")
        void tc20() {
            Question q = new Question();
            q.setId(4L); q.setType(1); q.setAnswer("a"); q.setScore(5);
            when(questionMapper.selectById(4L)).thenReturn(q);
            when(practiceRecordMapper.insert(any(PracticeRecord.class))).thenReturn(1);
            PracticeRecord result = practiceService.submitAnswer(1L, 4L, "A", 10);
            assertEquals(1, result.getIsCorrect());
        }

        @Test @DisplayName("TC19b: 判断题答错不得分")
        void tc19b() {
            Question judgeQ = new Question();
            judgeQ.setId(5L); judgeQ.setType(4); judgeQ.setAnswer("错"); judgeQ.setScore(3);
            when(questionMapper.selectById(5L)).thenReturn(judgeQ);
            when(practiceRecordMapper.insert(any(PracticeRecord.class))).thenReturn(1);
            when(wrongQuestionMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(null);
            when(wrongQuestionMapper.insert(any(WrongQuestion.class))).thenReturn(1);
            PracticeRecord result = practiceService.submitAnswer(1L, 5L, "对", 10);
            assertEquals(0, result.getIsCorrect());
            assertEquals(java.math.BigDecimal.ZERO, result.getAiScore());
        }

        @Test @DisplayName("TC20b: 答案匹配忽略大小写")
        void tc20b() {
            Question q = new Question();
            q.setId(6L); q.setType(1); q.setAnswer("B"); q.setScore(5);
            when(questionMapper.selectById(6L)).thenReturn(q);
            when(practiceRecordMapper.insert(any(PracticeRecord.class))).thenReturn(1);
            PracticeRecord result = practiceService.submitAnswer(1L, 6L, "b", 10);
            assertEquals(1, result.getIsCorrect());
            assertEquals(java.math.BigDecimal.valueOf(5), result.getAiScore());
        }

        @Test @DisplayName("TC19c: 判断题type=4答对不加入错题")
        void tc19c() {
            Question judgeQ = new Question();
            judgeQ.setId(7L); judgeQ.setType(4); judgeQ.setAnswer("对"); judgeQ.setScore(2);
            when(questionMapper.selectById(7L)).thenReturn(judgeQ);
            when(practiceRecordMapper.insert(any(PracticeRecord.class))).thenReturn(1);
            practiceService.submitAnswer(1L, 7L, "对", 10);
            verify(wrongQuestionMapper, never()).selectOne(any());
            verify(wrongQuestionMapper, never()).insert(any());
        }

        @Test @DisplayName("TC19d: 判断题答错加入错题本")
        void tc19d() {
            Question judgeQ = new Question();
            judgeQ.setId(8L); judgeQ.setType(4); judgeQ.setAnswer("对"); judgeQ.setScore(2);
            when(questionMapper.selectById(8L)).thenReturn(judgeQ);
            when(practiceRecordMapper.insert(any(PracticeRecord.class))).thenReturn(1);
            when(wrongQuestionMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(null);
            when(wrongQuestionMapper.insert(any(WrongQuestion.class))).thenReturn(1);
            practiceService.submitAnswer(1L, 8L, "错", 10);
            verify(wrongQuestionMapper).insert(argThat(wq -> {
                assertEquals("错", wq.getWrongAnswer());
                assertEquals("对", wq.getCorrectAnswer());
                return true;
            }));
        }

        @Test @DisplayName("TC20c: 全大写答案匹配")
        void tc20c() {
            Question q = new Question();
            q.setId(9L); q.setType(1); q.setAnswer("c"); q.setScore(4);
            when(questionMapper.selectById(9L)).thenReturn(q);
            when(practiceRecordMapper.insert(any(PracticeRecord.class))).thenReturn(1);
            PracticeRecord result = practiceService.submitAnswer(1L, 9L, "C", 10);
            assertEquals(1, result.getIsCorrect());
        }
    }
}
