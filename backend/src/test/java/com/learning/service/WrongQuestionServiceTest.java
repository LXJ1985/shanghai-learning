package com.learning.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.learning.entity.WrongQuestion;
import com.learning.mapper.WrongQuestionMapper;
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
@DisplayName("WrongQuestionService 单元测试")
class WrongQuestionServiceTest {

    @Mock private WrongQuestionMapper wrongQuestionMapper;
    @InjectMocks private WrongQuestionService wrongQuestionService;

    // ========== getWrongQuestions ==========
    @Nested @DisplayName("获取错题列表")
    class GetWrongQuestionsTests {

        @Test @DisplayName("TC35: 获取错题列表")
        void tc35() {
            Page<WrongQuestion> mockPage = new Page<>(1, 10);
            WrongQuestion wq = new WrongQuestion();
            wq.setId(1L); wq.setQuestionId(1L); wq.setWrongCount(3);
            mockPage.setRecords(List.of(wq));
            when(wrongQuestionMapper.selectPage(any(Page.class), any(LambdaQueryWrapper.class))).thenReturn(mockPage);
            Page<WrongQuestion> result = wrongQuestionService.getWrongQuestions(1L, null, 1, 10);
            assertEquals(1, result.getRecords().size());
            assertEquals(3, result.getRecords().get(0).getWrongCount());
        }

        @Test @DisplayName("TC35b: 空结果")
        void tc35b() {
            Page<WrongQuestion> mockPage = new Page<>(1, 10);
            mockPage.setRecords(List.of());
            mockPage.setTotal(0);
            when(wrongQuestionMapper.selectPage(any(Page.class), any(LambdaQueryWrapper.class))).thenReturn(mockPage);
            Page<WrongQuestion> result = wrongQuestionService.getWrongQuestions(1L, null, 1, 10);
            assertEquals(0, result.getRecords().size());
        }

        @Test @DisplayName("TC35c: 分页参数正确")
        void tc35c() {
            Page<WrongQuestion> mockPage = new Page<>(2, 5);
            mockPage.setRecords(List.of());
            when(wrongQuestionMapper.selectPage(any(Page.class), any(LambdaQueryWrapper.class))).thenReturn(mockPage);
            wrongQuestionService.getWrongQuestions(1L, null, 2, 5);
            verify(wrongQuestionMapper).selectPage(argThat(p ->
                p.getCurrent() == 2 && p.getSize() == 5
            ), any());
        }

        @Test @DisplayName("TC35d: 带subjectId参数")
        void tc35d() {
            Page<WrongQuestion> mockPage = new Page<>(1, 10);
            mockPage.setRecords(List.of());
            when(wrongQuestionMapper.selectPage(any(Page.class), any(LambdaQueryWrapper.class))).thenReturn(mockPage);
            Page<WrongQuestion> result = wrongQuestionService.getWrongQuestions(1L, 2L, 1, 10);
            assertNotNull(result);
        }

        @Test @DisplayName("TC35e: 多条错题记录")
        void tc35e() {
            Page<WrongQuestion> mockPage = new Page<>(1, 10);
            List<WrongQuestion> list = new ArrayList<>();
            for (int i = 1; i <= 5; i++) {
                WrongQuestion wq = new WrongQuestion();
                wq.setId((long) i); wq.setWrongCount(i);
                list.add(wq);
            }
            mockPage.setRecords(list);
            when(wrongQuestionMapper.selectPage(any(Page.class), any(LambdaQueryWrapper.class))).thenReturn(mockPage);
            Page<WrongQuestion> result = wrongQuestionService.getWrongQuestions(1L, null, 1, 10);
            assertEquals(5, result.getRecords().size());
        }

        @Test @DisplayName("TC35f: total正确")
        void tc35f() {
            Page<WrongQuestion> mockPage = new Page<>(1, 10);
            mockPage.setRecords(List.of());
            mockPage.setTotal(50);
            when(wrongQuestionMapper.selectPage(any(Page.class), any(LambdaQueryWrapper.class))).thenReturn(mockPage);
            Page<WrongQuestion> result = wrongQuestionService.getWrongQuestions(1L, null, 1, 10);
            assertEquals(50, result.getTotal());
        }

        @Test @DisplayName("TC35g: selectPage调用一次")
        void tc35g() {
            Page<WrongQuestion> mockPage = new Page<>(1, 10);
            mockPage.setRecords(List.of());
            when(wrongQuestionMapper.selectPage(any(Page.class), any(LambdaQueryWrapper.class))).thenReturn(mockPage);
            wrongQuestionService.getWrongQuestions(1L, null, 1, 10);
            verify(wrongQuestionMapper, times(1)).selectPage(any(Page.class), any(LambdaQueryWrapper.class));
        }

        @Test @DisplayName("TC35h: 返回非null")
        void tc35h() {
            Page<WrongQuestion> mockPage = new Page<>(1, 10);
            mockPage.setRecords(List.of());
            when(wrongQuestionMapper.selectPage(any(Page.class), any(LambdaQueryWrapper.class))).thenReturn(mockPage);
            assertNotNull(wrongQuestionService.getWrongQuestions(1L, null, 1, 10));
        }

        @Test @DisplayName("TC35i: 大分页参数")
        void tc35i() {
            Page<WrongQuestion> mockPage = new Page<>(100, 20);
            mockPage.setRecords(List.of());
            when(wrongQuestionMapper.selectPage(any(Page.class), any(LambdaQueryWrapper.class))).thenReturn(mockPage);
            wrongQuestionService.getWrongQuestions(1L, null, 100, 20);
            verify(wrongQuestionMapper).selectPage(argThat(p ->
                p.getCurrent() == 100 && p.getSize() == 20
            ), any());
        }
    }

    // ========== removeWrongQuestion ==========
    @Nested @DisplayName("删除错题")
    class RemoveWrongQuestionTests {

        @Test @DisplayName("TC36: 删除错题")
        void tc36() {
            when(wrongQuestionMapper.delete(any(LambdaQueryWrapper.class))).thenReturn(1);
            assertDoesNotThrow(() -> wrongQuestionService.removeWrongQuestion(1L, 1L));
            verify(wrongQuestionMapper).delete(any(LambdaQueryWrapper.class));
        }

        @Test @DisplayName("TC36b: 删除不存在不抛异常")
        void tc36b() {
            when(wrongQuestionMapper.delete(any(LambdaQueryWrapper.class))).thenReturn(0);
            assertDoesNotThrow(() -> wrongQuestionService.removeWrongQuestion(999L, 1L));
            verify(wrongQuestionMapper).delete(any(LambdaQueryWrapper.class));
        }

        @Test @DisplayName("TC36c: delete只调用一次")
        void tc36c() {
            when(wrongQuestionMapper.delete(any(LambdaQueryWrapper.class))).thenReturn(1);
            wrongQuestionService.removeWrongQuestion(1L, 1L);
            verify(wrongQuestionMapper, times(1)).delete(any(LambdaQueryWrapper.class));
        }

        @Test @DisplayName("TC36d: 不同userId")
        void tc36d() {
            when(wrongQuestionMapper.delete(any(LambdaQueryWrapper.class))).thenReturn(1);
            assertDoesNotThrow(() -> wrongQuestionService.removeWrongQuestion(1L, 99L));
            verify(wrongQuestionMapper).delete(any(LambdaQueryWrapper.class));
        }

        @Test @DisplayName("TC36e: 返回void无异常")
        void tc36e() {
            when(wrongQuestionMapper.delete(any(LambdaQueryWrapper.class))).thenReturn(1);
            assertDoesNotThrow(() -> wrongQuestionService.removeWrongQuestion(5L, 3L));
        }

        @Test @DisplayName("TC36f: 不调用selectPage")
        void tc36f() {
            when(wrongQuestionMapper.delete(any(LambdaQueryWrapper.class))).thenReturn(1);
            wrongQuestionService.removeWrongQuestion(1L, 1L);
            verify(wrongQuestionMapper, never()).selectPage(any(), any());
        }

        @Test @DisplayName("TC36g: 不调用selectList")
        void tc36g() {
            when(wrongQuestionMapper.delete(any(LambdaQueryWrapper.class))).thenReturn(1);
            wrongQuestionService.removeWrongQuestion(1L, 1L);
            verify(wrongQuestionMapper, never()).selectList(any());
        }

        @Test @DisplayName("TC36h: delete返回2")
        void tc36h() {
            when(wrongQuestionMapper.delete(any(LambdaQueryWrapper.class))).thenReturn(2);
            assertDoesNotThrow(() -> wrongQuestionService.removeWrongQuestion(1L, 1L));
        }

        @Test @DisplayName("TC36i: 多次删除不报错")
        void tc36i() {
            when(wrongQuestionMapper.delete(any(LambdaQueryWrapper.class))).thenReturn(1);
            assertDoesNotThrow(() -> {
                wrongQuestionService.removeWrongQuestion(1L, 1L);
                wrongQuestionService.removeWrongQuestion(2L, 1L);
            });
            verify(wrongQuestionMapper, times(2)).delete(any(LambdaQueryWrapper.class));
        }
    }

    // ========== clearWrongQuestions ==========
    @Nested @DisplayName("清空错题")
    class ClearWrongQuestionsTests {

        @Test @DisplayName("TC37: 清空错题")
        void tc37() {
            when(wrongQuestionMapper.delete(any(LambdaQueryWrapper.class))).thenReturn(5);
            assertDoesNotThrow(() -> wrongQuestionService.clearWrongQuestions(1L, null));
            verify(wrongQuestionMapper).delete(any(LambdaQueryWrapper.class));
        }

        @Test @DisplayName("TC37b: 按用户ID")
        void tc37b() {
            when(wrongQuestionMapper.delete(any(LambdaQueryWrapper.class))).thenReturn(3);
            wrongQuestionService.clearWrongQuestions(5L, null);
            verify(wrongQuestionMapper).delete(argThat(wrapper -> wrapper != null));
        }

        @Test @DisplayName("TC37c: 不抛异常")
        void tc37c() {
            when(wrongQuestionMapper.delete(any(LambdaQueryWrapper.class))).thenReturn(0);
            assertDoesNotThrow(() -> wrongQuestionService.clearWrongQuestions(1L, 2L));
        }

        @Test @DisplayName("TC37d: delete调用一次")
        void tc37d() {
            when(wrongQuestionMapper.delete(any(LambdaQueryWrapper.class))).thenReturn(1);
            wrongQuestionService.clearWrongQuestions(1L, null);
            verify(wrongQuestionMapper, times(1)).delete(any(LambdaQueryWrapper.class));
        }

        @Test @DisplayName("TC37e: 带subjectId")
        void tc37e() {
            when(wrongQuestionMapper.delete(any(LambdaQueryWrapper.class))).thenReturn(2);
            assertDoesNotThrow(() -> wrongQuestionService.clearWrongQuestions(1L, 3L));
        }

        @Test @DisplayName("TC37f: 不调用selectPage")
        void tc37f() {
            when(wrongQuestionMapper.delete(any(LambdaQueryWrapper.class))).thenReturn(1);
            wrongQuestionService.clearWrongQuestions(1L, null);
            verify(wrongQuestionMapper, never()).selectPage(any(), any());
        }

        @Test @DisplayName("TC37g: 返回void")
        void tc37g() {
            when(wrongQuestionMapper.delete(any(LambdaQueryWrapper.class))).thenReturn(10);
            assertDoesNotThrow(() -> wrongQuestionService.clearWrongQuestions(1L, null));
        }

        @Test @DisplayName("TC37h: 删除0条也成功")
        void tc37h() {
            when(wrongQuestionMapper.delete(any(LambdaQueryWrapper.class))).thenReturn(0);
            assertDoesNotThrow(() -> wrongQuestionService.clearWrongQuestions(99L, null));
        }

        @Test @DisplayName("TC37i: 不同userId")
        void tc37i() {
            when(wrongQuestionMapper.delete(any(LambdaQueryWrapper.class))).thenReturn(1);
            wrongQuestionService.clearWrongQuestions(100L, null);
            verify(wrongQuestionMapper).delete(any(LambdaQueryWrapper.class));
        }
    }
}
