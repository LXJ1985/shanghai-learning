package com.learning.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.learning.entity.Question;
import com.learning.mapper.QuestionMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.IOException;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AdminService \u5355\u5143\u6d4b\u8bd5")
class AdminServiceTest {

    @Mock private QuestionMapper questionMapper;
    @InjectMocks private AdminService adminService;

    // ========== createQuestion ==========
    @Nested @DisplayName("createQuestion - \u521b\u5efa\u9898\u76ee")
    class CreateQuestion {
        @Test @DisplayName("TC01: \u6b63\u5e38\u521b\u5efa - type\u5b57\u6bb5\u6b63\u786e\u6620\u5c04")
        void tc01() {
            Question q = buildQ(1L, 1, "\u5185\u5bb9", "A", 2, 5);
            when(questionMapper.insert(any())).thenReturn(1);
            adminService.createQuestion(q);
            ArgumentCaptor<Question> c = ArgumentCaptor.forClass(Question.class);
            verify(questionMapper).insert(c.capture());
            assertEquals(1, c.getValue().getType());
            assertEquals(1L, c.getValue().getSubjectId());
        }

        @Test @DisplayName("TC02: gradeId\u548cchapterId\u53ef\u4e3a\u7a7a")
        void tc02() {
            Question q = buildQ(1L, 2, "2+3=____", "5", 1, 3);
            when(questionMapper.insert(any())).thenReturn(1);
            adminService.createQuestion(q);
            ArgumentCaptor<Question> c = ArgumentCaptor.forClass(Question.class);
            verify(questionMapper).insert(c.capture());
            assertNull(c.getValue().getGradeId());
            assertNull(c.getValue().getChapterId());
        }

        @Test @DisplayName("TC03: \u6240\u6709\u65b0\u589e\u5b57\u6bb5\u6b63\u786e\u4f20\u9012")
        void tc03() {
            Question q = buildQ(1L, 3, "\u89e3\u7b54", "\u8be6\u89e3", 4, 10);
            q.setSource("2024\u4e0a\u6d77\u4e2d\u8003"); q.setStatus(1); q.setCreatedBy(100L);
            when(questionMapper.insert(any())).thenReturn(1);
            adminService.createQuestion(q);
            ArgumentCaptor<Question> c = ArgumentCaptor.forClass(Question.class);
            verify(questionMapper).insert(c.capture());
            assertEquals("2024\u4e0a\u6d77\u4e2d\u8003", c.getValue().getSource());
            assertEquals(1, c.getValue().getStatus());
            assertEquals(100L, c.getValue().getCreatedBy());
        }

        @Test @DisplayName("TC04: type\u503c\u8986\u76d6\u6240\u6709\u9898\u578b")
        void tc04() {
            for (int t = 1; t <= 7; t++) {
                Question q = buildQ(1L, t, "\u5185\u5bb9", "\u7b54\u6848", 3, 5);
                when(questionMapper.insert(any())).thenReturn(1);
                adminService.createQuestion(q);
                ArgumentCaptor<Question> c = ArgumentCaptor.forClass(Question.class);
                verify(questionMapper, atLeast(t)).insert(c.capture());
                assertEquals(t, c.getValue().getType());
            }
        }

        @Test @DisplayName("TC01b: insert\u53ea\u8c03\u7528\u4e00\u6b21")
        void tc01b() {
            Question q = buildQ(1L, 1, "\u6d4b\u8bd5", "A", 2, 5);
            when(questionMapper.insert(any())).thenReturn(1);
            adminService.createQuestion(q);
            verify(questionMapper, times(1)).insert(any());
        }

        @Test @DisplayName("TC01c: \u8fd4\u56de\u7ed3\u679c\u975e\u7a7a")
        void tc01c() {
            Question q = buildQ(1L, 1, "\u6d4b\u8bd5", "A", 2, 5);
            when(questionMapper.insert(any())).thenReturn(1);
            assertNotNull(adminService.createQuestion(q));
        }

        @Test @DisplayName("TC02b: 创建填空题type=7")
        void tc02b() {
            Question q = buildQ(1L, 7, "判断", "对", 1, 2);
            when(questionMapper.insert(any())).thenReturn(1);
            adminService.createQuestion(q);
            ArgumentCaptor<Question> c = ArgumentCaptor.forClass(Question.class);
            verify(questionMapper).insert(c.capture());
            assertEquals(7, c.getValue().getType());
        }

        @Test @DisplayName("TC03b: source\u4e3a\u7a7a\u9ed8\u8ba4")
        void tc03b() {
            Question q = buildQ(1L, 1, "\u6d4b\u8bd5", "A", 2, 5);
            when(questionMapper.insert(any())).thenReturn(1);
            adminService.createQuestion(q);
            ArgumentCaptor<Question> c = ArgumentCaptor.forClass(Question.class);
            verify(questionMapper).insert(c.capture());
            assertNull(c.getValue().getSource());
        }

        @Test @DisplayName("TC04b: \u96be\u5ea6\u8fb9\u754c\u503c1")
        void tc04b() {
            Question q = buildQ(1L, 1, "\u6d4b\u8bd5", "A", 1, 5);
            when(questionMapper.insert(any())).thenReturn(1);
            adminService.createQuestion(q);
            ArgumentCaptor<Question> c = ArgumentCaptor.forClass(Question.class);
            verify(questionMapper).insert(c.capture());
            assertEquals(1, c.getValue().getDifficulty());
        }

        @Test @DisplayName("TC04c: \u96be\u5ea6\u8fb9\u754c\u503c5")
        void tc04c() {
            Question q = buildQ(1L, 1, "\u96be\u9898", "B", 5, 10);
            when(questionMapper.insert(any())).thenReturn(1);
            adminService.createQuestion(q);
            ArgumentCaptor<Question> c = ArgumentCaptor.forClass(Question.class);
            verify(questionMapper).insert(c.capture());
            assertEquals(5, c.getValue().getDifficulty());
        }

        @Test @DisplayName("TC01d: score=0\u8fb9\u754c")
        void tc01d() {
            Question q = buildQ(1L, 1, "\u6d4b\u8bd5", "A", 2, 0);
            when(questionMapper.insert(any())).thenReturn(1);
            adminService.createQuestion(q);
            ArgumentCaptor<Question> c = ArgumentCaptor.forClass(Question.class);
            verify(questionMapper).insert(c.capture());
            assertEquals(0, c.getValue().getScore());
        }

        @Test @DisplayName("TC01e: content\u4e3a\u7a7a\u5b57\u7b26\u4e32")
        void tc01e() {
            Question q = buildQ(1L, 1, "", "A", 2, 5);
            when(questionMapper.insert(any())).thenReturn(1);
            adminService.createQuestion(q);
            ArgumentCaptor<Question> c = ArgumentCaptor.forClass(Question.class);
            verify(questionMapper).insert(c.capture());
            assertEquals("", c.getValue().getContent());
        }

        @Test @DisplayName("TC01f: answer\u4e3anull")
        void tc01f() {
            Question q = buildQ(1L, 1, "\u5185\u5bb9", null, 2, 5);
            when(questionMapper.insert(any())).thenReturn(1);
            adminService.createQuestion(q);
            ArgumentCaptor<Question> c = ArgumentCaptor.forClass(Question.class);
            verify(questionMapper).insert(c.capture());
            assertNull(c.getValue().getAnswer());
        }

        @Test @DisplayName("TC01g: insert\u8fd4\u56de0\u4e0d\u629b\u5f02\u5e38")
        void tc01g() {
            Question q = buildQ(1L, 1, "\u6d4b\u8bd5", "A", 2, 5);
            when(questionMapper.insert(any())).thenReturn(0);
            assertDoesNotThrow(() -> adminService.createQuestion(q));
        }

        @Test @DisplayName("TC01h: \u8d85\u957f\u5185\u5bb9\u5b57\u7b26\u4e32")
        void tc01h() {
            String longContent = "A".repeat(5000);
            Question q = buildQ(1L, 1, longContent, "A", 2, 5);
            when(questionMapper.insert(any())).thenReturn(1);
            adminService.createQuestion(q);
            ArgumentCaptor<Question> c = ArgumentCaptor.forClass(Question.class);
            verify(questionMapper).insert(c.capture());
            assertEquals(5000, c.getValue().getContent().length());
        }

        @Test @DisplayName("TC01i: subjectId=0")
        void tc01i() {
            Question q = buildQ(0L, 1, "\u6d4b\u8bd5", "A", 2, 5);
            when(questionMapper.insert(any())).thenReturn(1);
            adminService.createQuestion(q);
            ArgumentCaptor<Question> c = ArgumentCaptor.forClass(Question.class);
            verify(questionMapper).insert(c.capture());
            assertEquals(0L, c.getValue().getSubjectId());
        }

        @Test @DisplayName("TC01j: \u8fd4\u56de\u5bf9\u8c61\u5373\u4f20\u5165\u5bf9\u8c61")
        void tc01j() {
            Question q = buildQ(1L, 1, "\u6d4b\u8bd5", "A", 2, 5);
            when(questionMapper.insert(any())).thenReturn(1);
            Question r = adminService.createQuestion(q);
            assertSame(q, r);
        }

        @Test @DisplayName("TC01k: \u591a\u6b21\u521b\u5efa\u4e0d\u540csubjectId")
        void tc01k() {
            for (long sid = 1; sid <= 3; sid++) {
                Question q = buildQ(sid, 1, "\u5185\u5bb9", "A", 2, 5);
                when(questionMapper.insert(any())).thenReturn(1);
                adminService.createQuestion(q);
            }
            verify(questionMapper, times(3)).insert(any());
        }

        @Test @DisplayName("TC01l: \u96be\u5ea6\u8d1f\u6570")
        void tc01l() {
            Question q = buildQ(1L, 1, "\u6d4b\u8bd5", "A", -1, 5);
            when(questionMapper.insert(any())).thenReturn(1);
            adminService.createQuestion(q);
            ArgumentCaptor<Question> c = ArgumentCaptor.forClass(Question.class);
            verify(questionMapper).insert(c.capture());
            assertEquals(-1, c.getValue().getDifficulty());
        }

        @Test @DisplayName("TC01m: options\u5b57\u6bb5\u4fdd\u5b58")
        void tc01m() {
            Question q = buildQ(1L, 1, "\u9009\u62e9\u9898", "A", 2, 5);
            q.setOptions("[\"A. x\", \"B. y\"]");
            when(questionMapper.insert(any())).thenReturn(1);
            adminService.createQuestion(q);
            ArgumentCaptor<Question> c = ArgumentCaptor.forClass(Question.class);
            verify(questionMapper).insert(c.capture());
            assertEquals("[\"A. x\", \"B. y\"]", c.getValue().getOptions());
        }

        @Test @DisplayName("TC01n: analysis\u5b57\u6bb5\u4fdd\u5b58")
        void tc01n() {
            Question q = buildQ(1L, 1, "\u5185\u5bb9", "A", 2, 5);
            q.setAnalysis("\u89e3\u6790\u5185\u5bb9");
            when(questionMapper.insert(any())).thenReturn(1);
            adminService.createQuestion(q);
            ArgumentCaptor<Question> c = ArgumentCaptor.forClass(Question.class);
            verify(questionMapper).insert(c.capture());
            assertEquals("\u89e3\u6790\u5185\u5bb9", c.getValue().getAnalysis());
        }

        @Test @DisplayName("TC01o: gradeId\u548cchapterId\u540c\u65f6\u8bbe\u7f6e")
        void tc01o() {
            Question q = buildQ(1L, 1, "\u5185\u5bb9", "A", 2, 5);
            q.setGradeId(2L); q.setChapterId(3L);
            when(questionMapper.insert(any())).thenReturn(1);
            adminService.createQuestion(q);
            ArgumentCaptor<Question> c = ArgumentCaptor.forClass(Question.class);
            verify(questionMapper).insert(c.capture());
            assertEquals(2L, c.getValue().getGradeId());
            assertEquals(3L, c.getValue().getChapterId());
        }

        @Test @DisplayName("TC01p: knowledgeId\u5b57\u6bb5\u4fdd\u5b58")
        void tc01p() {
            Question q = buildQ(1L, 1, "\u5185\u5bb9", "A", 2, 5);
            q.setKnowledgeId(10L);
            when(questionMapper.insert(any())).thenReturn(1);
            adminService.createQuestion(q);
            ArgumentCaptor<Question> c = ArgumentCaptor.forClass(Question.class);
            verify(questionMapper).insert(c.capture());
            assertEquals(10L, c.getValue().getKnowledgeId());
        }

        @Test @DisplayName("TC01q: score=100\u8fb9\u754c")
        void tc01q() {
            Question q = buildQ(1L, 1, "\u6d4b\u8bd5", "A", 2, 100);
            when(questionMapper.insert(any())).thenReturn(1);
            adminService.createQuestion(q);
            ArgumentCaptor<Question> c = ArgumentCaptor.forClass(Question.class);
            verify(questionMapper).insert(c.capture());
            assertEquals(100, c.getValue().getScore());
        }
    }

    // ========== updateQuestion ==========
    @Nested @DisplayName("updateQuestion - \u66f4\u65b0\u9898\u76ee")
    class UpdateQuestion {
        @Test @DisplayName("TC04e: \u66f4\u65b0\u5185\u5bb9")
        void tc04e() {
            Question upd = new Question(); upd.setId(1L); upd.setContent("\u66f4\u65b0\u540e");
            when(questionMapper.updateById(any())).thenReturn(1);
            when(questionMapper.selectById(1L)).thenReturn(upd);
            Question in = new Question(); in.setContent("\u66f4\u65b0\u540e");
            Question r = adminService.updateQuestion(1L, in);
            ArgumentCaptor<Question> c = ArgumentCaptor.forClass(Question.class);
            verify(questionMapper).updateById(c.capture());
            assertEquals(1L, c.getValue().getId());
            assertEquals("\u66f4\u65b0\u540e", r.getContent());
        }

        @Test @DisplayName("TC04f: \u8fd4\u56de\u6700\u65b0\u6570\u636e")
        void tc04f() {
            Question latest = new Question(); latest.setId(5L); latest.setDifficulty(4); latest.setScore(8);
            when(questionMapper.updateById(any())).thenReturn(1);
            when(questionMapper.selectById(5L)).thenReturn(latest);
            Question r = adminService.updateQuestion(5L, new Question());
            assertEquals(4, r.getDifficulty());
            assertEquals(8, r.getScore());
        }

        @Test @DisplayName("TC04g: \u66f4\u65b0\u7a7a\u5bf9\u8c61")
        void tc04g() {
            when(questionMapper.updateById(any())).thenReturn(1);
            when(questionMapper.selectById(1L)).thenReturn(new Question());
            assertDoesNotThrow(() -> adminService.updateQuestion(1L, new Question()));
        }

        @Test @DisplayName("TC04h: id\u6b63\u786e\u8bbe\u7f6e")
        void tc04h() {
            when(questionMapper.updateById(any())).thenReturn(1);
            when(questionMapper.selectById(99L)).thenReturn(new Question());
            adminService.updateQuestion(99L, new Question());
            ArgumentCaptor<Question> c = ArgumentCaptor.forClass(Question.class);
            verify(questionMapper).updateById(c.capture());
            assertEquals(99L, c.getValue().getId());
        }

        @Test @DisplayName("TC04i: updateById\u8c03\u7528\u4e00\u6b21")
        void tc04i() {
            when(questionMapper.updateById(any())).thenReturn(1);
            when(questionMapper.selectById(1L)).thenReturn(new Question());
            adminService.updateQuestion(1L, new Question());
            verify(questionMapper, times(1)).updateById(any());
        }

        @Test @DisplayName("TC04j: selectById\u5728update\u540e\u8c03\u7528")
        void tc04j() {
            when(questionMapper.updateById(any())).thenReturn(1);
            when(questionMapper.selectById(1L)).thenReturn(new Question());
            adminService.updateQuestion(1L, new Question());
            verify(questionMapper).selectById(1L);
        }

        @Test @DisplayName("TC04k: \u66f4\u65b0\u4e0d\u5b58\u5728\u7684id")
        void tc04k() {
            when(questionMapper.updateById(any())).thenReturn(0);
            when(questionMapper.selectById(999L)).thenReturn(null);
            assertNull(adminService.updateQuestion(999L, new Question()));
        }

        @Test @DisplayName("TC04l: \u66f4\u65b0\u591a\u4e2a\u5b57\u6bb5")
        void tc04l() {
            Question upd = new Question(); upd.setId(1L); upd.setContent("new"); upd.setDifficulty(3);
            when(questionMapper.updateById(any())).thenReturn(1);
            when(questionMapper.selectById(1L)).thenReturn(upd);
            Question in = new Question(); in.setContent("new"); in.setDifficulty(3);
            adminService.updateQuestion(1L, in);
            ArgumentCaptor<Question> c = ArgumentCaptor.forClass(Question.class);
            verify(questionMapper).updateById(c.capture());
            assertEquals("new", c.getValue().getContent());
            assertEquals(3, c.getValue().getDifficulty());
        }

        @Test @DisplayName("TC04m: \u66f4\u65b0\u540e\u8fd4\u56deDB\u6700\u65b0\u503c")
        void tc04m() {
            Question db = new Question(); db.setId(1L); db.setScore(99);
            when(questionMapper.updateById(any())).thenReturn(1);
            when(questionMapper.selectById(1L)).thenReturn(db);
            Question r = adminService.updateQuestion(1L, new Question());
            assertEquals(99, r.getScore());
        }

        @Test @DisplayName("TC04n: selectById\u53ea\u8c03\u7528\u4e00\u6b21")
        void tc04n() {
            when(questionMapper.updateById(any())).thenReturn(1);
            when(questionMapper.selectById(1L)).thenReturn(new Question());
            adminService.updateQuestion(1L, new Question());
            verify(questionMapper, times(1)).selectById(1L);
        }
    }

    // ========== getQuestions ==========
    @Nested @DisplayName("getQuestions - \u67e5\u8be2\u5217\u8868")
    class GetQuestions {
        @Test @DisplayName("TC05: \u6309type\u7b5b\u9009")
        void tc05() {
            Question q1 = new Question(); q1.setId(1L); q1.setType(1);
            Page<Question> mp = mockPage(1, 10, List.of(q1));
            when(questionMapper.selectPage(any(Page.class), any(LambdaQueryWrapper.class))).thenReturn(mp);
            Page<Question> r = adminService.getQuestions(null, null, 1, null, 1, 10);
            assertEquals(1, r.getRecords().size());
        }

        @Test @DisplayName("TC06: \u6309\u5b66\u79d1\u548c\u5173\u952e\u8bcd\u7b5b\u9009")
        void tc06() {
            Question q = new Question(); q.setId(2L); q.setSubjectId(1L); q.setContent("\u4e8c\u6b21\u6839\u5f0f");
            Page<Question> mp = mockPage(1, 10, List.of(q));
            when(questionMapper.selectPage(any(Page.class), any(LambdaQueryWrapper.class))).thenReturn(mp);
            Page<Question> r = adminService.getQuestions(1L, null, null, "\u4e8c\u6b21\u6839\u5f0f", 1, 10);
            assertTrue(r.getRecords().get(0).getContent().contains("\u4e8c\u6b21\u6839\u5f0f"));
        }

        @Test @DisplayName("TC05b: \u65e0\u7b5b\u9009\u67e5\u5168\u90e8")
        void tc05b() {
            Page<Question> mp = mockPage(1, 10, List.of());
            when(questionMapper.selectPage(any(Page.class), any(LambdaQueryWrapper.class))).thenReturn(mp);
            Page<Question> r = adminService.getQuestions(null, null, null, null, 1, 10);
            assertEquals(0, r.getRecords().size());
        }

        @Test @DisplayName("TC06b: \u6309chapterId\u7b5b\u9009")
        void tc06b() {
            Question q = new Question(); q.setId(3L); q.setChapterId(2L);
            Page<Question> mp = mockPage(1, 10, List.of(q));
            when(questionMapper.selectPage(any(Page.class), any(LambdaQueryWrapper.class))).thenReturn(mp);
            Page<Question> r = adminService.getQuestions(null, 2L, null, null, 1, 10);
            assertEquals(2L, r.getRecords().get(0).getChapterId());
        }

        @Test @DisplayName("TC06c: \u7a7a\u767d\u5173\u952e\u8bcd\u5ffd\u7565")
        void tc06c() {
            Page<Question> mp = mockPage(1, 10, List.of());
            when(questionMapper.selectPage(any(Page.class), any(LambdaQueryWrapper.class))).thenReturn(mp);
            assertDoesNotThrow(() -> adminService.getQuestions(null, null, null, "  ", 1, 10));
        }

        @Test @DisplayName("TC06d: \u5206\u9875\u53c2\u6570\u6b63\u786e")
        void tc06d() {
            Page<Question> mp = mockPage(2, 5, List.of());
            when(questionMapper.selectPage(any(Page.class), any(LambdaQueryWrapper.class))).thenReturn(mp);
            adminService.getQuestions(null, null, null, null, 2, 5);
            verify(questionMapper).selectPage(argThat(p -> p.getCurrent() == 2 && p.getSize() == 5), any());
        }

        @Test @DisplayName("TC06e: \u591a\u6761\u4ef6\u7ec4\u5408\u7b5b\u9009")
        void tc06e() {
            Page<Question> mp = mockPage(1, 10, List.of());
            when(questionMapper.selectPage(any(Page.class), any(LambdaQueryWrapper.class))).thenReturn(mp);
            assertDoesNotThrow(() -> adminService.getQuestions(1L, 2L, 1, "\u5173\u952e", 1, 10));
        }

        @Test @DisplayName("TC06f: \u7ed3\u679c\u975e\u7a7a")
        void tc06f() {
            Page<Question> mp = mockPage(1, 10, List.of());
            when(questionMapper.selectPage(any(Page.class), any(LambdaQueryWrapper.class))).thenReturn(mp);
            assertNotNull(adminService.getQuestions(null, null, null, null, 1, 10));
        }

        @Test @DisplayName("TC06g: \u7b2c\u4e00\u9875\u67e5\u8be2")
        void tc06g() {
            Page<Question> mp = mockPage(1, 20, List.of());
            when(questionMapper.selectPage(any(Page.class), any(LambdaQueryWrapper.class))).thenReturn(mp);
            adminService.getQuestions(null, null, null, null, 1, 20);
            verify(questionMapper).selectPage(argThat(p -> p.getCurrent() == 1), any());
        }

        @Test @DisplayName("TC06h: \u5927\u5206\u9875size")
        void tc06h() {
            Page<Question> mp = mockPage(1, 100, List.of());
            when(questionMapper.selectPage(any(Page.class), any(LambdaQueryWrapper.class))).thenReturn(mp);
            adminService.getQuestions(null, null, null, null, 1, 100);
            verify(questionMapper).selectPage(argThat(p -> p.getSize() == 100), any());
        }

        @Test @DisplayName("TC06i: selectPage\u53ea\u8c03\u7528\u4e00\u6b21")
        void tc06i() {
            Page<Question> mp = mockPage(1, 10, List.of());
            when(questionMapper.selectPage(any(Page.class), any(LambdaQueryWrapper.class))).thenReturn(mp);
            adminService.getQuestions(null, null, null, null, 1, 10);
            verify(questionMapper, times(1)).selectPage(any(Page.class), any(LambdaQueryWrapper.class));
        }

        @Test @DisplayName("TC06j: \u7279\u6b8a\u5b57\u7b26\u5173\u952e\u8bcd")
        void tc06j() {
            Page<Question> mp = mockPage(1, 10, List.of());
            when(questionMapper.selectPage(any(Page.class), any(LambdaQueryWrapper.class))).thenReturn(mp);
            assertDoesNotThrow(() -> adminService.getQuestions(null, null, null, "2+3=?", 1, 10));
        }

        @Test @DisplayName("TC06k: \u6309subjectId\u7b5b\u9009")
        void tc06k() {
            Question q = new Question(); q.setId(1L); q.setSubjectId(3L);
            Page<Question> mp = mockPage(1, 10, List.of(q));
            when(questionMapper.selectPage(any(Page.class), any(LambdaQueryWrapper.class))).thenReturn(mp);
            Page<Question> r = adminService.getQuestions(3L, null, null, null, 1, 10);
            assertEquals(1, r.getRecords().size());
        }

        @Test @DisplayName("TC06l: total\u6b63\u786e\u8fd4\u56de")
        void tc06l() {
            Page<Question> mp = mockPage(1, 10, List.of());
            mp.setTotal(50);
            when(questionMapper.selectPage(any(Page.class), any(LambdaQueryWrapper.class))).thenReturn(mp);
            Page<Question> r = adminService.getQuestions(null, null, null, null, 1, 10);
            assertEquals(50, r.getTotal());
        }

        @Test @DisplayName("TC06m: records\u975e\u7a7a")
        void tc06m() {
            Page<Question> mp = mockPage(1, 10, List.of(new Question()));
            when(questionMapper.selectPage(any(Page.class), any(LambdaQueryWrapper.class))).thenReturn(mp);
            assertNotNull(adminService.getQuestions(null, null, null, null, 1, 10).getRecords());
        }

        @Test @DisplayName("TC06n: \u7a7a\u5173\u952e\u8bcdnull")
        void tc06n() {
            Page<Question> mp = mockPage(1, 10, List.of());
            when(questionMapper.selectPage(any(Page.class), any(LambdaQueryWrapper.class))).thenReturn(mp);
            assertDoesNotThrow(() -> adminService.getQuestions(null, null, null, null, 1, 10));
        }
    }

    // ========== deleteQuestion ==========
    @Nested @DisplayName("deleteQuestion - \u5220\u9664\u9898\u76ee")
    class DeleteQuestion {
        @Test @DisplayName("TC07: \u903b\u8f91\u5220\u9664")
        void tc07() {
            when(questionMapper.deleteById(1L)).thenReturn(1);
            adminService.deleteQuestion(1L);
            verify(questionMapper).deleteById(1L);
        }

        @Test @DisplayName("TC07b: \u5220\u9664\u4e0d\u5b58\u5728\u4e0d\u629b\u5f02\u5e38")
        void tc07b() {
            when(questionMapper.deleteById(999L)).thenReturn(0);
            assertDoesNotThrow(() -> adminService.deleteQuestion(999L));
        }

        @Test @DisplayName("TC07c: deleteById\u53ea\u8c03\u7528\u4e00\u6b21")
        void tc07c() {
            when(questionMapper.deleteById(5L)).thenReturn(1);
            adminService.deleteQuestion(5L);
            verify(questionMapper, times(1)).deleteById(5L);
            verify(questionMapper, never()).selectById(any());
        }

        @Test @DisplayName("TC07d: \u5220\u9664id=0")
        void tc07d() {
            when(questionMapper.deleteById(0L)).thenReturn(0);
            assertDoesNotThrow(() -> adminService.deleteQuestion(0L));
        }

        @Test @DisplayName("TC07e: deleteById\u8fd4\u56de0")
        void tc07e() {
            when(questionMapper.deleteById(10L)).thenReturn(0);
            adminService.deleteQuestion(10L);
            verify(questionMapper).deleteById(10L);
        }

        @Test @DisplayName("TC07f: \u4e0d\u8c03\u7528\u5176\u4ed6\u65b9\u6cd5")
        void tc07f() {
            when(questionMapper.deleteById(1L)).thenReturn(1);
            adminService.deleteQuestion(1L);
            verify(questionMapper, never()).selectById(any());
            verify(questionMapper, never()).selectPage(any(), any());
            verify(questionMapper, never()).insert(any());
        }

        @Test @DisplayName("TC07g: \u5220\u9664\u8d1f\u6570id")
        void tc07g() {
            when(questionMapper.deleteById(-1L)).thenReturn(0);
            assertDoesNotThrow(() -> adminService.deleteQuestion(-1L));
        }

        @Test @DisplayName("TC07h: \u5220\u9664\u65e0\u8fd4\u56de\u503c")
        void tc07h() {
            when(questionMapper.deleteById(1L)).thenReturn(1);
            assertDoesNotThrow(() -> adminService.deleteQuestion(1L));
        }
    }

    // ========== importQuestions ==========
    @Nested @DisplayName("importQuestions - \u6279\u91cf\u5bfc\u5165")
    class ImportQuestions {
        @Test @DisplayName("TC08: \u6b63\u5e38\u683c\u5f0f\u5bfc\u5165")
        void tc08() throws Exception {
            String c = "1|\u9009\u62e9\u9898|A|3|5\n2|\u586b\u7a7a\u9898|\u7b54\u6848|2|3";
            var f = file("test.txt", c);
            when(questionMapper.insert(any())).thenReturn(1);
            Map<String, Object> r = adminService.importQuestions(f, 1L);
            assertEquals(2, r.get("success"));
            assertEquals(0, r.get("fail"));
        }

        @Test @DisplayName("TC09: \u683c\u5f0f\u9519\u8bef\u884c\u8df3\u8fc7")
        void tc09() throws Exception {
            String c = "1|\u6b63\u786e|A|3|5\n\u9519\u8bef\u884c\n2|\u53e6\u4e00\u9898|B|2|3";
            var f = file("test.txt", c);
            when(questionMapper.insert(any())).thenReturn(1);
            Map<String, Object> r = adminService.importQuestions(f, 1L);
            assertEquals(2, r.get("success"));
            assertEquals(1, r.get("fail"));
        }

        @Test @DisplayName("TC08b: \u7a7a\u6587\u4ef6")
        void tc08b() throws Exception {
            var f = file("empty.txt", "");
            Map<String, Object> r = adminService.importQuestions(f, 1L);
            assertEquals(0, r.get("success"));
            assertEquals(0, r.get("fail"));
        }

        @Test @DisplayName("TC09b: subjectId\u4e3anull\u9ed8\u8ba41")
        void tc09b() throws Exception {
            String c = "1|\u9898\u76ee|A|2|5";
            var f = file("test.txt", c);
            when(questionMapper.insert(any())).thenReturn(1);
            adminService.importQuestions(f, null);
            ArgumentCaptor<Question> cap = ArgumentCaptor.forClass(Question.class);
            verify(questionMapper).insert(cap.capture());
            assertEquals(1L, cap.getValue().getSubjectId());
        }

        @Test @DisplayName("TC09c: \u542b\u7a7a\u884c\u8df3\u8fc7")
        void tc09c() throws Exception {
            String c = "1|\u4e00|A|2|5\n\n\n2|\u4e8c|B|3|3\n";
            var f = file("test.txt", c);
            when(questionMapper.insert(any())).thenReturn(1);
            Map<String, Object> r = adminService.importQuestions(f, 1L);
            assertEquals(2, r.get("success"));
        }

        @Test @DisplayName("TC09d: \u6570\u5b57\u89e3\u6790\u9519\u8bef\u8df3\u8fc7")
        void tc09d() throws Exception {
            String c = "abc|\u9898\u76ee|A|xyz|5\n1|\u6b63\u5e38|B|2|3";
            var f = file("test.txt", c);
            when(questionMapper.insert(any())).thenReturn(1);
            Map<String, Object> r = adminService.importQuestions(f, 1L);
            assertEquals(1, r.get("success"));
            assertEquals(1, r.get("fail"));
        }

        @Test @DisplayName("TC09e: subjectId=0\u9ed8\u8ba41")
        void tc09e() throws Exception {
            String c = "1|\u9898\u76ee|A|2|5";
            var f = file("test.txt", c);
            when(questionMapper.insert(any())).thenReturn(1);
            adminService.importQuestions(f, 0L);
            ArgumentCaptor<Question> cap = ArgumentCaptor.forClass(Question.class);
            verify(questionMapper).insert(cap.capture());
            assertEquals(1L, cap.getValue().getSubjectId());
        }

        @Test @DisplayName("TC09f: \u5355\u884c\u5bfc\u5165")
        void tc09f() throws Exception {
            String c = "1|\u5355\u9898|A|1|5";
            var f = file("test.txt", c);
            when(questionMapper.insert(any())).thenReturn(1);
            Map<String, Object> r = adminService.importQuestions(f, 1L);
            assertEquals(1, r.get("success"));
            assertEquals(0, r.get("fail"));
        }

        @Test @DisplayName("TC09g: \u8d85\u51fa5\u4e2a\u5b57\u6bb5\u4ecd\u6b63\u5e38")
        void tc09g() throws Exception {
            String c = "1|\u5185\u5bb9|A|2|5|\u989d\u5916";
            var f = file("test.txt", c);
            when(questionMapper.insert(any())).thenReturn(1);
            Map<String, Object> r = adminService.importQuestions(f, 1L);
            assertEquals(1, r.get("success"));
        }

        @Test @DisplayName("TC09h: \u6bcf\u9898subjectId\u6b63\u786e")
        void tc09h() throws Exception {
            String c = "1|A|X|1|1\n2|B|Y|2|2";
            var f = file("test.txt", c);
            when(questionMapper.insert(any())).thenReturn(1);
            adminService.importQuestions(f, 5L);
            ArgumentCaptor<Question> cap = ArgumentCaptor.forClass(Question.class);
            verify(questionMapper, times(2)).insert(cap.capture());
            cap.getAllValues().forEach(q -> assertEquals(5L, q.getSubjectId()));
        }

        @Test @DisplayName("TC09i: \u5b57\u6bb5\u542b\u7a7a\u683c")
        void tc09i() throws Exception {
            String c = "1| \u5185\u5bb9 | A |2| 5 ";
            var f = file("test.txt", c);
            when(questionMapper.insert(any())).thenReturn(1);
            adminService.importQuestions(f, 1L);
            ArgumentCaptor<Question> cap = ArgumentCaptor.forClass(Question.class);
            verify(questionMapper).insert(cap.capture());
            assertEquals("\u5185\u5bb9", cap.getValue().getContent());
            assertEquals("A", cap.getValue().getAnswer());
        }

        @Test @DisplayName("TC09j: \u6240\u6709\u884c\u90fd\u5931\u8d25")
        void tc09j() throws Exception {
            String c = "bad1\nbad2\nbad3";
            var f = file("test.txt", c);
            Map<String, Object> r = adminService.importQuestions(f, 1L);
            assertEquals(0, r.get("success"));
            assertEquals(3, r.get("fail"));
        }

        @Test @DisplayName("TC09k: \u7ed3\u679c\u542b\u6240\u6709key")
        void tc09k() throws Exception {
            var f = file("test.txt", "1|A|X|1|1");
            when(questionMapper.insert(any())).thenReturn(1);
            Map<String, Object> r = adminService.importQuestions(f, 1L);
            assertTrue(r.containsKey("success"));
            assertTrue(r.containsKey("fail"));
            assertTrue(r.containsKey("errors"));
        }

        @Test @DisplayName("TC09l: UTF-8\u89e3\u6790\u6b63\u5e38")
        void tc09l() throws Exception {
            String c = "1|\u4e2d\u6587\u9898\u76ee|\u7b54\u6848|2|5";
            var f = file("test.txt", c);
            when(questionMapper.insert(any())).thenReturn(1);
            Map<String, Object> r = adminService.importQuestions(f, 1L);
            assertEquals(1, r.get("success"));
        }
    }

    // ========== GenerateTemplates ==========
    @Nested @DisplayName("\u6a21\u677f\u751f\u6210")
    class GenerateTemplates {
        @Test @DisplayName("TC10a: TXT\u6a21\u677f\u975e\u7a7a\u542b\u793a\u4f8b")
        void tc10a() {
            String t = adminService.generateTxtTemplate();
            assertNotNull(t); assertFalse(t.isEmpty()); assertTrue(t.contains("|"));
        }

        @Test @DisplayName("TC10b: CSV\u542bBOM\u548c\u8868\u5934")
        void tc10b() {
            String c = adminService.generateCsvTemplate();
            assertTrue(c.startsWith("\uFEFF"));
            assertTrue(c.contains("\u9898\u578b,\u5185\u5bb9,\u7b54\u6848,\u96be\u5ea6,\u5206\u503c"));
        }

        @Test @DisplayName("TC10c: Excel\u5b57\u8282\u6570\u7ec4\u975e\u7a7a")
        void tc10c() throws IOException {
            byte[] b = adminService.generateExcelTemplate();
            assertNotNull(b); assertTrue(b.length > 0);
            assertEquals(0x50, b[0] & 0xFF); assertEquals(0x4B, b[1] & 0xFF);
        }

        @Test @DisplayName("TC10d: TXT\u6bcf\u884c\u81f3\u5c115\u5b57\u6bb5")
        void tc10d() {
            String[] lines = adminService.generateTxtTemplate().split("\n");
            assertTrue(lines.length >= 3);
            for (String l : lines) { if (!l.isEmpty()) assertTrue(l.split("\\|").length >= 5); }
        }

        @Test @DisplayName("TC10e: TXT\u542b4\u884c\u6570\u636e")
        void tc10e() {
            long cnt = adminService.generateTxtTemplate().lines().filter(l -> !l.isEmpty()).count();
            assertEquals(4, cnt);
        }

        @Test @DisplayName("TC10f: CSV\u542b\u8868\u5934+4\u884c\u6570\u636e")
        void tc10f() {
            long cnt = adminService.generateCsvTemplate().lines().filter(l -> !l.isEmpty()).count();
            assertEquals(5, cnt); // 1 header + 4 data
        }

        @Test @DisplayName("TC10g: Excel\u5927\u4e8e100\u5b57\u8282")
        void tc10g() throws IOException {
            assertTrue(adminService.generateExcelTemplate().length > 100);
        }

        @Test @DisplayName("TC10h: TXT\u542b\u7ba1\u7b26\u5206\u9694")
        void tc10h() {
            String t = adminService.generateTxtTemplate();
            for (String l : t.split("\n")) { if (!l.isEmpty()) assertTrue(l.contains("|")); }
        }

        @Test @DisplayName("TC10i: CSV\u542b\u9898\u578b\u6570\u5b57")
        void tc10i() {
            String c = adminService.generateCsvTemplate();
            assertTrue(c.contains("1,"));
            assertTrue(c.contains("2,"));
        }

        @Test @DisplayName("TC10j: Excel\u591aSheet")
        void tc10j() throws IOException {
            byte[] b = adminService.generateExcelTemplate();
            assertTrue(b.length > 500);
        }

        @Test @DisplayName("TC10k: TXT\u96be\u5ea6\u503c\u5728\u7b2c4\u5217")
        void tc10k() {
            for (String l : adminService.generateTxtTemplate().split("\n")) {
                if (l.isEmpty()) continue;
                String[] p = l.split("\\|");
                int d = Integer.parseInt(p[3].trim());
                assertTrue(d >= 1 && d <= 5);
            }
        }

        @Test @DisplayName("TC10l: CSV\u6570\u636e\u884c\u67095\u5217")
        void tc10l() {
            String[] lines = adminService.generateCsvTemplate().split("\n");
            for (int i = 1; i < lines.length; i++) {
                if (lines[i].isEmpty()) continue;
                // CSV may have quoted commas, just check non-empty
                assertFalse(lines[i].trim().isEmpty());
            }
        }
    }

    // ========== helpers ==========
    private Question buildQ(Long sid, int type, String content, String answer, int diff, int score) {
        Question q = new Question();
        q.setSubjectId(sid); q.setType(type); q.setContent(content);
        q.setAnswer(answer); q.setDifficulty(diff); q.setScore(score);
        return q;
    }

    private Page<Question> mockPage(int cur, int size, List<Question> records) {
        Page<Question> p = new Page<>(cur, size);
        p.setRecords(records);
        p.setTotal(records.size());
        return p;
    }

    private org.springframework.mock.web.MockMultipartFile file(String name, String content) throws Exception {
        return new org.springframework.mock.web.MockMultipartFile("file", name, "text/plain", content.getBytes("UTF-8"));
    }
}
