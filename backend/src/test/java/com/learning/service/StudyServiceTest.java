package com.learning.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.learning.entity.*;
import com.learning.mapper.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("StudyService 单元测试")
class StudyServiceTest {

    @Mock private SubjectMapper subjectMapper;
    @Mock private GradeMapper gradeMapper;
    @Mock private ChapterMapper chapterMapper;
    @Mock private KnowledgeMapper knowledgeMapper;
    @InjectMocks private StudyService studyService;

    // ========== getSubjects ==========
    @Nested @DisplayName("获取学科列表")
    class GetSubjectsTests {

        @Test @DisplayName("TC30: 获取学科列表")
        void tc30() {
            Subject math = new Subject();
            math.setId(2L); math.setName("数学");
            when(subjectMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(math));
            List<Subject> result = studyService.getSubjects();
            assertEquals(1, result.size());
            assertEquals("数学", result.get(0).getName());
        }

        @Test @DisplayName("TC30b: 多个学科")
        void tc30b() {
            Subject s1 = new Subject(); s1.setId(1L); s1.setName("语文");
            Subject s2 = new Subject(); s2.setId(2L); s2.setName("数学");
            Subject s3 = new Subject(); s3.setId(3L); s3.setName("英语");
            when(subjectMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(s1, s2, s3));
            List<Subject> result = studyService.getSubjects();
            assertEquals(3, result.size());
        }

        @Test @DisplayName("TC30c: 空结果")
        void tc30c() {
            when(subjectMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of());
            List<Subject> result = studyService.getSubjects();
            assertEquals(0, result.size());
        }

        @Test @DisplayName("TC30d: selectList调用一次")
        void tc30d() {
            when(subjectMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of());
            studyService.getSubjects();
            verify(subjectMapper, times(1)).selectList(any(LambdaQueryWrapper.class));
        }

        @Test @DisplayName("TC30e: 返回非null")
        void tc30e() {
            when(subjectMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of());
            assertNotNull(studyService.getSubjects());
        }

        @Test @DisplayName("TC30f: 保留id字段")
        void tc30f() {
            Subject s = new Subject(); s.setId(99L); s.setName("物理");
            when(subjectMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(s));
            List<Subject> result = studyService.getSubjects();
            assertEquals(99L, result.get(0).getId());
        }

        @Test @DisplayName("TC30g: 10个学科")
        void tc30g() {
            List<Subject> subjects = new ArrayList<>();
            for (int i = 1; i <= 10; i++) {
                Subject s = new Subject(); s.setId((long) i); s.setName("学科" + i);
                subjects.add(s);
            }
            when(subjectMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(subjects);
            List<Subject> result = studyService.getSubjects();
            assertEquals(10, result.size());
        }

        @Test @DisplayName("TC30h: 第一个学科正确")
        void tc30h() {
            Subject s1 = new Subject(); s1.setId(1L); s1.setName("语文");
            Subject s2 = new Subject(); s2.setId(2L); s2.setName("数学");
            when(subjectMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(s1, s2));
            List<Subject> result = studyService.getSubjects();
            assertEquals("语文", result.get(0).getName());
        }

        @Test @DisplayName("TC30i: 最后一个学科正确")
        void tc30i() {
            Subject s1 = new Subject(); s1.setId(1L); s1.setName("语文");
            Subject s2 = new Subject(); s2.setId(2L); s2.setName("数学");
            when(subjectMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(s1, s2));
            List<Subject> result = studyService.getSubjects();
            assertEquals("数学", result.get(result.size() - 1).getName());
        }
    }

    // ========== getGrades ==========
    @Nested @DisplayName("获取年级列表")
    class GetGradesTests {

        @Test @DisplayName("TC31: 获取年级列表")
        void tc31() {
            Grade g8 = new Grade();
            g8.setId(3L); g8.setName("八年级");
            when(gradeMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(g8));
            List<Grade> result = studyService.getGrades();
            assertEquals(1, result.size());
            assertEquals("八年级", result.get(0).getName());
        }

        @Test @DisplayName("TC31b: 多个年级")
        void tc31b() {
            Grade g1 = new Grade(); g1.setId(1L); g1.setName("六年级");
            Grade g2 = new Grade(); g2.setId(2L); g2.setName("七年级");
            Grade g3 = new Grade(); g3.setId(3L); g3.setName("八年级");
            Grade g4 = new Grade(); g4.setId(4L); g4.setName("九年级");
            when(gradeMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(g1, g2, g3, g4));
            List<Grade> result = studyService.getGrades();
            assertEquals(4, result.size());
        }

        @Test @DisplayName("TC31c: 验证调用")
        void tc31c() {
            when(gradeMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of());
            studyService.getGrades();
            verify(gradeMapper).selectList(any(LambdaQueryWrapper.class));
        }

        @Test @DisplayName("TC31d: 空结果")
        void tc31d() {
            when(gradeMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of());
            List<Grade> result = studyService.getGrades();
            assertEquals(0, result.size());
        }

        @Test @DisplayName("TC31e: 返回非null")
        void tc31e() {
            when(gradeMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of());
            assertNotNull(studyService.getGrades());
        }

        @Test @DisplayName("TC31f: 保留id字段")
        void tc31f() {
            Grade g = new Grade(); g.setId(77L); g.setName("高三");
            when(gradeMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(g));
            List<Grade> result = studyService.getGrades();
            assertEquals(77L, result.get(0).getId());
        }

        @Test @DisplayName("TC31g: selectList只调用一次")
        void tc31g() {
            when(gradeMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of());
            studyService.getGrades();
            verify(gradeMapper, times(1)).selectList(any(LambdaQueryWrapper.class));
        }

        @Test @DisplayName("TC31h: 第一个年级正确")
        void tc31h() {
            Grade g1 = new Grade(); g1.setId(1L); g1.setName("六年级");
            Grade g2 = new Grade(); g2.setId(2L); g2.setName("七年级");
            when(gradeMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(g1, g2));
            List<Grade> result = studyService.getGrades();
            assertEquals("六年级", result.get(0).getName());
        }

        @Test @DisplayName("TC31i: 返回非null")
        void tc31i() {
            when(gradeMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of());
            assertNotNull(studyService.getGrades());
        }
    }

    // ========== getChapterTree ==========
    @Nested @DisplayName("获取章节树")
    class GetChapterTreeTests {

        @Test @DisplayName("TC32: 获取章节树")
        void tc32() {
            Chapter parent = new Chapter();
            parent.setId(1L); parent.setSubjectId(2L); parent.setGradeId(3L);
            parent.setParentId(0L); parent.setName("第14章 二次根式");
            Chapter child = new Chapter();
            child.setId(2L); child.setSubjectId(2L); child.setGradeId(3L);
            child.setParentId(1L); child.setName("14.1 二次根式的概念");
            when(chapterMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(parent, child));
            List<Map<String, Object>> result = studyService.getChapterTree(2L, 3L);
            assertEquals(1, result.size());
            assertEquals("第14章 二次根式", result.get(0).get("name"));
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> children = (List<Map<String, Object>>) result.get(0).get("children");
            assertNotNull(children);
            assertEquals(1, children.size());
            assertEquals("14.1 二次根式的概念", children.get(0).get("name"));
        }

        @Test @DisplayName("TC32b: 无子章节时不含children")
        void tc32b() {
            Chapter single = new Chapter();
            single.setId(1L); single.setSubjectId(2L); single.setGradeId(3L);
            single.setParentId(0L); single.setName("第1章");
            when(chapterMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(single));
            List<Map<String, Object>> result = studyService.getChapterTree(2L, 3L);
            assertEquals(1, result.size());
            assertNull(result.get(0).get("children"));
        }

        @Test @DisplayName("TC32c: 空结果")
        void tc32c() {
            when(chapterMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of());
            List<Map<String, Object>> result = studyService.getChapterTree(2L, 3L);
            assertEquals(0, result.size());
        }

        @Test @DisplayName("TC32d: 三层树结构")
        void tc32d() {
            Chapter root = new Chapter();
            root.setId(1L); root.setSubjectId(2L); root.setGradeId(3L);
            root.setParentId(0L); root.setName("根");
            Chapter mid = new Chapter();
            mid.setId(2L); mid.setSubjectId(2L); mid.setGradeId(3L);
            mid.setParentId(1L); mid.setName("中");
            Chapter leaf = new Chapter();
            leaf.setId(3L); leaf.setSubjectId(2L); leaf.setGradeId(3L);
            leaf.setParentId(2L); leaf.setName("叶");
            when(chapterMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(root, mid, leaf));
            List<Map<String, Object>> result = studyService.getChapterTree(2L, 3L);
            assertEquals(1, result.size());
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> midChildren = (List<Map<String, Object>>) result.get(0).get("children");
            assertEquals(1, midChildren.size());
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> leafChildren = (List<Map<String, Object>>) midChildren.get(0).get("children");
            assertEquals(1, leafChildren.size());
            assertEquals("叶", leafChildren.get(0).get("name"));
        }

        @Test @DisplayName("TC32e: 多个子章节")
        void tc32e() {
            Chapter parent = new Chapter();
            parent.setId(1L); parent.setParentId(0L); parent.setName("父");
            Chapter c1 = new Chapter();
            c1.setId(2L); c1.setParentId(1L); c1.setName("子1");
            Chapter c2 = new Chapter();
            c2.setId(3L); c2.setParentId(1L); c2.setName("子2");
            Chapter c3 = new Chapter();
            c3.setId(4L); c3.setParentId(1L); c3.setName("子3");
            when(chapterMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(parent, c1, c2, c3));
            List<Map<String, Object>> result = studyService.getChapterTree(2L, 3L);
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> children = (List<Map<String, Object>>) result.get(0).get("children");
            assertEquals(3, children.size());
        }

        @Test @DisplayName("TC32f: 含id字段")
        void tc32f() {
            Chapter ch = new Chapter();
            ch.setId(55L); ch.setParentId(0L); ch.setName("测试章");
            when(chapterMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(ch));
            List<Map<String, Object>> result = studyService.getChapterTree(2L, 3L);
            assertEquals(55L, result.get(0).get("id"));
        }

        @Test @DisplayName("TC32g: selectList调用一次")
        void tc32g() {
            when(chapterMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of());
            studyService.getChapterTree(2L, 3L);
            verify(chapterMapper, times(1)).selectList(any(LambdaQueryWrapper.class));
        }

        @Test @DisplayName("TC32h: 多个根章节")
        void tc32h() {
            Chapter r1 = new Chapter();
            r1.setId(1L); r1.setParentId(0L); r1.setName("根1");
            Chapter r2 = new Chapter();
            r2.setId(2L); r2.setParentId(0L); r2.setName("根2");
            when(chapterMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(r1, r2));
            List<Map<String, Object>> result = studyService.getChapterTree(2L, 3L);
            assertEquals(2, result.size());
        }

        @Test @DisplayName("TC32i: 含sortOrder字段")
        void tc32i() {
            Chapter ch = new Chapter();
            ch.setId(1L); ch.setParentId(0L); ch.setName("章"); ch.setSortOrder(5);
            when(chapterMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(ch));
            List<Map<String, Object>> result = studyService.getChapterTree(2L, 3L);
            assertEquals(5, result.get(0).get("sortOrder"));
        }

        @Test @DisplayName("TC32j: 返回非null")
        void tc32j() {
            when(chapterMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of());
            assertNotNull(studyService.getChapterTree(2L, 3L));
        }

        @Test @DisplayName("TC32k: 含name字段")
        void tc32k() {
            Chapter ch = new Chapter();
            ch.setId(1L); ch.setParentId(0L); ch.setName("测试章节");
            when(chapterMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(ch));
            List<Map<String, Object>> result = studyService.getChapterTree(2L, 3L);
            assertEquals("测试章节", result.get(0).get("name"));
        }
    }

    // ========== getKnowledge ==========
    @Nested @DisplayName("获取知识点")
    class GetKnowledgeTests {

        @Test @DisplayName("TC33: 获取知识点列表")
        void tc33() {
            Knowledge k = new Knowledge();
            k.setId(1L); k.setName("二次根式的定义");
            when(knowledgeMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(k));
            List<Knowledge> result = studyService.getKnowledgeList(1L);
            assertEquals(1, result.size());
            assertEquals("二次根式的定义", result.get(0).getName());
        }

        @Test @DisplayName("TC33b: 多个知识点")
        void tc33b() {
            Knowledge k1 = new Knowledge(); k1.setId(1L); k1.setName("定义");
            Knowledge k2 = new Knowledge(); k2.setId(2L); k2.setName("性质");
            when(knowledgeMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(k1, k2));
            List<Knowledge> result = studyService.getKnowledgeList(1L);
            assertEquals(2, result.size());
        }

        @Test @DisplayName("TC34: 获取知识点详情")
        void tc34() {
            Knowledge k = new Knowledge();
            k.setId(1L); k.setName("二次根式的定义");
            k.setSummary("形如√a（a≥0）的式子叫做二次根式");
            when(knowledgeMapper.selectById(1L)).thenReturn(k);
            Knowledge result = studyService.getKnowledgeDetail(1L);
            assertNotNull(result);
            assertEquals("二次根式的定义", result.getName());
            assertTrue(result.getSummary().contains("√a"));
        }

        @Test @DisplayName("TC34b: selectById调用一次")
        void tc34b() {
            Knowledge k = new Knowledge(); k.setId(5L);
            when(knowledgeMapper.selectById(5L)).thenReturn(k);
            studyService.getKnowledgeDetail(5L);
            verify(knowledgeMapper, times(1)).selectById(5L);
        }

        @Test @DisplayName("TC33c: 空知识点列表")
        void tc33c() {
            when(knowledgeMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of());
            List<Knowledge> result = studyService.getKnowledgeList(1L);
            assertEquals(0, result.size());
        }

        @Test @DisplayName("TC33d: selectList调用一次")
        void tc33d() {
            when(knowledgeMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of());
            studyService.getKnowledgeList(1L);
            verify(knowledgeMapper, times(1)).selectList(any(LambdaQueryWrapper.class));
        }

        @Test @DisplayName("TC34c: 详情不存在返回null")
        void tc34c() {
            when(knowledgeMapper.selectById(999L)).thenReturn(null);
            assertNull(studyService.getKnowledgeDetail(999L));
        }

        @Test @DisplayName("TC34d: 详情保留summary")
        void tc34d() {
            Knowledge k = new Knowledge();
            k.setId(1L); k.setName("测试"); k.setSummary("详细内容");
            when(knowledgeMapper.selectById(1L)).thenReturn(k);
            Knowledge result = studyService.getKnowledgeDetail(1L);
            assertEquals("详细内容", result.getSummary());
        }

        @Test @DisplayName("TC33e: 返回非null")
        void tc33e() {
            when(knowledgeMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of());
            assertNotNull(studyService.getKnowledgeList(1L));
        }

        @Test @DisplayName("TC33f: 保留id字段")
        void tc33f() {
            Knowledge k = new Knowledge(); k.setId(88L); k.setName("测试");
            when(knowledgeMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(k));
            List<Knowledge> result = studyService.getKnowledgeList(1L);
            assertEquals(88L, result.get(0).getId());
        }

        @Test @DisplayName("TC34e: 详情保留id字段")
        void tc34e() {
            Knowledge k = new Knowledge(); k.setId(42L); k.setName("测试"); k.setSummary("内容");
            when(knowledgeMapper.selectById(42L)).thenReturn(k);
            Knowledge result = studyService.getKnowledgeDetail(42L);
            assertEquals(42L, result.getId());
        }

        @Test @DisplayName("TC34f: 详情保留name字段")
        void tc34f() {
            Knowledge k = new Knowledge(); k.setId(1L); k.setName("根式"); k.setSummary("内容");
            when(knowledgeMapper.selectById(1L)).thenReturn(k);
            Knowledge result = studyService.getKnowledgeDetail(1L);
            assertEquals("根式", result.getName());
        }

        @Test @DisplayName("TC33g: 不同chapterId")
        void tc33g() {
            when(knowledgeMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of());
            studyService.getKnowledgeList(99L);
            verify(knowledgeMapper).selectList(any(LambdaQueryWrapper.class));
        }

        @Test @DisplayName("TC33h: 多个知识点保留顺序")
        void tc33h() {
            Knowledge k1 = new Knowledge(); k1.setId(1L); k1.setName("A");
            Knowledge k2 = new Knowledge(); k2.setId(2L); k2.setName("B");
            Knowledge k3 = new Knowledge(); k3.setId(3L); k3.setName("C");
            when(knowledgeMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(k1, k2, k3));
            List<Knowledge> result = studyService.getKnowledgeList(1L);
            assertEquals("A", result.get(0).getName());
            assertEquals("B", result.get(1).getName());
            assertEquals("C", result.get(2).getName());
        }

        @Test @DisplayName("TC34g: selectById返回正确对象")
        void tc34g() {
            Knowledge k = new Knowledge(); k.setId(10L); k.setName("测试"); k.setSummary("内容");
            when(knowledgeMapper.selectById(10L)).thenReturn(k);
            Knowledge result = studyService.getKnowledgeDetail(10L);
            assertSame(k, result);
        }

        @Test @DisplayName("TC33i: 知识点列表含name字段")
        void tc33i() {
            Knowledge k = new Knowledge(); k.setId(1L); k.setName("根式");
            when(knowledgeMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(k));
            List<Knowledge> result = studyService.getKnowledgeList(1L);
            assertEquals("根式", result.get(0).getName());
        }

        @Test @DisplayName("TC33j: 知识点列表返回多个")
        void tc33j() {
            Knowledge k1 = new Knowledge(); k1.setId(1L); k1.setName("A");
            Knowledge k2 = new Knowledge(); k2.setId(2L); k2.setName("B");
            Knowledge k3 = new Knowledge(); k3.setId(3L); k3.setName("C");
            Knowledge k4 = new Knowledge(); k4.setId(4L); k4.setName("D");
            when(knowledgeMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(k1, k2, k3, k4));
            List<Knowledge> result = studyService.getKnowledgeList(1L);
            assertEquals(4, result.size());
        }
    }
}
