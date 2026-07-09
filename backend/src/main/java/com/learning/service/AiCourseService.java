package com.learning.service;

import cn.hutool.http.HttpRequest;
import cn.hutool.http.HttpResponse;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.learning.entity.Chapter;
import com.learning.entity.Grade;
import com.learning.entity.Knowledge;
import com.learning.entity.Question;
import com.learning.entity.Subject;
import com.learning.mapper.ChapterMapper;
import com.learning.mapper.GradeMapper;
import com.learning.mapper.KnowledgeMapper;
import com.learning.mapper.QuestionMapper;
import com.learning.mapper.SubjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiCourseService {

    private final SubjectMapper subjectMapper;
    private final GradeMapper gradeMapper;
    private final ChapterMapper chapterMapper;
    private final KnowledgeMapper knowledgeMapper;
    private final QuestionMapper questionMapper;
    private final ObjectMapper objectMapper;

    @Value("${dashscope.api-key:}")
    private String apiKey;

    private static final String DASHSCOPE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions";

    /**
     * 预览 AI 课程数据（不入库，返回原始数据供管理员确认）
     */
    public Map<String, Object> previewCourseData(Long gradeId, Long subjectId, String semester) {
        Map<String, Object> result = new LinkedHashMap<>();

        try {
            // 1. 校验 API Key
            if (apiKey == null || apiKey.isBlank()) {
                result.put("error", "未配置 DashScope API Key，请在 application-local.yml 中设置 dashscope.api-key");
                return result;
            }

            // 2. 查询年级和学科名称
            Subject subject = subjectMapper.selectById(subjectId);
            Grade grade = gradeMapper.selectById(gradeId);
            if (subject == null || grade == null) {
                result.put("error", "学科或年级不存在");
                return result;
            }

            String subjectName = subject.getName();
            String gradeName = grade.getName();

            // 3. 构建 Prompt
            String prompt = buildPrompt(gradeName, semester, subjectName);

            // 4. 调用通义千问 API
            String aiResponse = callQwenApi(prompt);
            log.info("AI 返回内容长度: {}", aiResponse.length());

            // 5. 解析 JSON 响应
            JsonNode root = parseAiResponse(aiResponse);
            if (root == null) {
                result.put("error", "AI 返回内容解析失败，无法提取 JSON");
                return result;
            }

            JsonNode chaptersNode = root.get("chapters");
            if (chaptersNode == null || !chaptersNode.isArray()) {
                result.put("error", "AI 返回的 JSON 中缺少 chapters 数组");
                return result;
            }

            // 6. 查询已存在的章节（用于标记跳过）
            List<Chapter> existingChapters = chapterMapper.selectList(
                    new LambdaQueryWrapper<Chapter>()
                            .eq(Chapter::getSubjectId, subjectId)
                            .eq(Chapter::getGradeId, gradeId)
            );
            Set<String> existingChapterNames = new HashSet<>();
            for (Chapter ch : existingChapters) {
                existingChapterNames.add(ch.getName().trim());
            }

            // 7. 构建预览数据（不入库）
            List<Map<String, Object>> previewChapters = new ArrayList<>();
            int skipped = 0;
            for (JsonNode chapterNode : chaptersNode) {
                String chapterName = getTextValue(chapterNode, "name");
                if (chapterName == null || chapterName.isBlank()) continue;
                chapterName = chapterName.trim();

                if (existingChapterNames.contains(chapterName)) {
                    skipped++;
                    continue;
                }

                Map<String, Object> previewChapter = new LinkedHashMap<>();
                previewChapter.put("name", chapterName);
                previewChapter.put("sortOrder", getIntValue(chapterNode, "sortOrder", 1));

                // 子章节
                List<Map<String, Object>> children = new ArrayList<>();
                JsonNode childrenNode = chapterNode.get("children");
                if (childrenNode != null && childrenNode.isArray()) {
                    for (JsonNode childNode : childrenNode) {
                        String childName = getTextValue(childNode, "name");
                        if (childName == null || childName.isBlank()) continue;
                        childName = childName.trim();
                        if (existingChapterNames.contains(childName)) {
                            skipped++;
                            continue;
                        }
                        Map<String, Object> child = new LinkedHashMap<>();
                        child.put("name", childName);
                        child.put("sortOrder", getIntValue(childNode, "sortOrder", children.size() + 1));
                        children.add(child);
                    }
                }
                previewChapter.put("children", children);

                // 知识点
                List<Map<String, Object>> knowledgePoints = new ArrayList<>();
                JsonNode kpNode = chapterNode.get("knowledgePoints");
                if (kpNode != null && kpNode.isArray()) {
                    for (JsonNode kpItem : kpNode) {
                        String kpName = getTextValue(kpItem, "name");
                        if (kpName == null || kpName.isBlank()) continue;
                        kpName = kpName.trim();
                        Map<String, Object> kp = new LinkedHashMap<>();
                        kp.put("name", kpName);
                        kp.put("summary", getTextValue(kpItem, "summary"));

                        // 题目
                        List<Map<String, Object>> questions = new ArrayList<>();
                        JsonNode qNode = kpItem.get("questions");
                        if (qNode != null && qNode.isArray()) {
                            for (JsonNode qItem : qNode) {
                                Map<String, Object> q = new LinkedHashMap<>();
                                q.put("type", getIntValue(qItem, "type", 1));
                                q.put("content", getTextValue(qItem, "content"));
                                q.put("options", getTextValue(qItem, "options"));
                                q.put("answer", getTextValue(qItem, "answer"));
                                q.put("analysis", getTextValue(qItem, "analysis"));
                                q.put("difficulty", getIntValue(qItem, "difficulty", 2));
                                q.put("source", getTextValue(qItem, "source"));
                                questions.add(q);
                            }
                        }
                        kp.put("questions", questions);
                        knowledgePoints.add(kp);
                    }
                }
                previewChapter.put("knowledgePoints", knowledgePoints);
                previewChapters.add(previewChapter);
            }

            result.put("chapters", previewChapters);
            result.put("skipped", skipped);

        } catch (Exception e) {
            log.error("AI 预览课程数据失败", e);
            result.put("error", "系统错误: " + e.getMessage());
        }
        return result;
    }

    /**
     * 确认并保存 AI 课程数据到数据库
     */
    @Transactional
    public Map<String, Object> confirmCourseData(Long gradeId, Long subjectId, List<Map<String, Object>> chapters) {
        Map<String, Object> result = new LinkedHashMap<>();
        int chaptersAdded = 0;
        int knowledgeAdded = 0;
        int questionsAdded = 0;
        int skipped = 0;
        List<String> errors = new ArrayList<>();

        try {
            // 查询已存在的章节（用于去重）
            List<Chapter> existingChapters = chapterMapper.selectList(
                    new LambdaQueryWrapper<Chapter>()
                            .eq(Chapter::getSubjectId, subjectId)
                            .eq(Chapter::getGradeId, gradeId)
            );
            Set<String> existingChapterNames = new HashSet<>();
            for (Chapter ch : existingChapters) {
                existingChapterNames.add(ch.getName().trim());
            }

            for (Map<String, Object> chapterMap : chapters) {
                try {
                    String chapterName = String.valueOf(chapterMap.get("name")).trim();
                    if (chapterName.isEmpty()) continue;

                    int sortOrder = chapterMap.get("sortOrder") != null
                            ? ((Number) chapterMap.get("sortOrder")).intValue() : 1;

                    if (existingChapterNames.contains(chapterName)) {
                        skipped++;
                        continue;
                    }

                    // 插入根章节
                    Chapter rootChapter = new Chapter();
                    rootChapter.setSubjectId(subjectId);
                    rootChapter.setGradeId(gradeId);
                    rootChapter.setParentId(0L);
                    rootChapter.setName(chapterName);
                    rootChapter.setSortOrder(sortOrder);
                    chapterMapper.insert(rootChapter);
                    chaptersAdded++;
                    existingChapterNames.add(chapterName);

                    // 处理子章节
                    @SuppressWarnings("unchecked")
                    List<Map<String, Object>> children = (List<Map<String, Object>>) chapterMap.get("children");
                    if (children != null) {
                        int childOrder = 1;
                        for (Map<String, Object> childMap : children) {
                            try {
                                String childName = String.valueOf(childMap.get("name")).trim();
                                if (childName.isEmpty()) continue;
                                if (existingChapterNames.contains(childName)) {
                                    skipped++;
                                    continue;
                                }
                                int childSort = childMap.get("sortOrder") != null
                                        ? ((Number) childMap.get("sortOrder")).intValue() : childOrder;
                                Chapter childChapter = new Chapter();
                                childChapter.setSubjectId(subjectId);
                                childChapter.setGradeId(gradeId);
                                childChapter.setParentId(rootChapter.getId());
                                childChapter.setName(childName);
                                childChapter.setSortOrder(childSort);
                                chapterMapper.insert(childChapter);
                                chaptersAdded++;
                                existingChapterNames.add(childName);
                                childOrder++;
                            } catch (Exception e) {
                                errors.add("子章节插入失败: " + e.getMessage());
                            }
                        }
                    }

                    // 处理知识点
                    @SuppressWarnings("unchecked")
                    List<Map<String, Object>> knowledgePoints = (List<Map<String, Object>>) chapterMap.get("knowledgePoints");
                    if (knowledgePoints != null) {
                        int kpOrder = 1;
                        for (Map<String, Object> kpMap : knowledgePoints) {
                            try {
                                String kpName = String.valueOf(kpMap.get("name")).trim();
                                if (kpName.isEmpty()) continue;
                                String summary = kpMap.get("summary") != null ? String.valueOf(kpMap.get("summary")) : "";
                                Knowledge k = new Knowledge();
                                k.setChapterId(rootChapter.getId());
                                k.setName(kpName);
                                k.setSummary(summary);
                                k.setSortOrder(kpOrder);
                                knowledgeMapper.insert(k);
                                knowledgeAdded++;

                                // 处理题目
                                @SuppressWarnings("unchecked")
                                List<Map<String, Object>> questions = (List<Map<String, Object>>) kpMap.get("questions");
                                if (questions != null) {
                                    for (Map<String, Object> qMap : questions) {
                                        try {
                                            String content = qMap.get("content") != null ? String.valueOf(qMap.get("content")).trim() : "";
                                            if (content.isEmpty()) continue;
                                            Question q = new Question();
                                            q.setSubjectId(subjectId);
                                            q.setGradeId(gradeId);
                                            q.setChapterId(rootChapter.getId());
                                            q.setKnowledgeId(k.getId());
                                            q.setType(qMap.get("type") != null ? ((Number) qMap.get("type")).intValue() : 1);
                                            q.setContent(content);
                                            q.setOptions(qMap.get("options") != null ? String.valueOf(qMap.get("options")) : null);
                                            q.setAnswer(qMap.get("answer") != null ? String.valueOf(qMap.get("answer")) : "");
                                            q.setAnalysis(qMap.get("analysis") != null ? String.valueOf(qMap.get("analysis")) : "");
                                            q.setDifficulty(qMap.get("difficulty") != null ? ((Number) qMap.get("difficulty")).intValue() : 2);
                                            q.setSource(qMap.get("source") != null ? String.valueOf(qMap.get("source")) : "");
                                            q.setScore(q.getType() == 1 ? 2 : 4);
                                            q.setStatus(1);
                                            questionMapper.insert(q);
                                            questionsAdded++;
                                        } catch (Exception e) {
                                            errors.add("题目插入失败: " + e.getMessage());
                                        }
                                    }
                                }

                                kpOrder++;
                            } catch (Exception e) {
                                errors.add("知识点插入失败: " + e.getMessage());
                            }
                        }
                    }

                } catch (Exception e) {
                    errors.add("章节处理失败: " + e.getMessage());
                }
            }

        } catch (Exception e) {
            log.error("确认保存AI课程数据失败", e);
            errors.add("系统错误: " + e.getMessage());
        }

        result.put("chaptersAdded", chaptersAdded);
        result.put("knowledgeAdded", knowledgeAdded);
        result.put("questionsAdded", questionsAdded);
        result.put("skipped", skipped);
        result.put("errors", errors);
        return result;
    }

    /**
     * 构建 AI 查询 Prompt
     */
    private String buildPrompt(String gradeName, String semester, String subjectName) {
        return """
                你是一位资深%s教师，精通上海新课编%s教材和课程标准。请为%s学生列出上海新课编%s（%s）的完整章节结构、每章的核心知识点，以及每个知识点的配套题目。

                要求：
                1. 章节结构必须严格对应上海新课编教材的实际目录，包含章和节两级
                2. 每章列出3-8个核心知识点
                3. 知识点需包含简要概述（1-2句话）
                4. 每个知识点生成2-3道配套题目，优先使用上海历年真题或课本例题
                5. 题目类型: type=1为选择题(必须有4个选项), type=2为填空题
                6. 选择题的options为JSON数组字符串，如[\"A. xxx\",\"B. xxx\",\"C. xxx\",\"D. xxx\"]
                7. 填空题的options为空字符串
                8. difficulty范围1-5，建议2-3
                9. source标注题目来源，如\"上海新课编-课本例题\"或\"历年真题\"
                10. 严格按照以下JSON格式返回，不要添加任何其他文字说明：

                {
                  "chapters": [
                    {
                      "name": "第一章 章节名称",
                      "sortOrder": 1,
                      "children": [
                        {"name": "1.1 节名称", "sortOrder": 1}
                      ],
                      "knowledgePoints": [
                        {
                          "name": "知识点名称",
                          "summary": "知识点的简要概述",
                          "questions": [
                            {
                              "type": 1,
                              "content": "下列哪个说法是正确的？",
                              "options": "[\\"A. 选项一\\",\\"B. 选项二\\",\\"C. 选项三\\",\\"D. 选项四\\"]",
                              "answer": "A",
                              "analysis": "因为...所以选A",
                              "difficulty": 2,
                              "source": "上海新课编-课本例题"
                            },
                            {
                              "type": 2,
                              "content": "填空题的题目内容，答案用____表示。",
                              "options": "",
                              "answer": "填空答案",
                              "analysis": "解析过程",
                              "difficulty": 3,
                              "source": "历年真题"
                            }
                          ]
                        }
                      ]
                    }
                  ]
                }

                请确保返回有效的JSON格式。
                """.formatted(subjectName, subjectName, gradeName, subjectName, semester);
    }

    /**
     * 调用通义千问 API
     */
    private String callQwenApi(String prompt) {
        ObjectNode requestBody = objectMapper.createObjectNode();
        requestBody.put("model", "qwen-turbo");

        ArrayNode messages = requestBody.putArray("messages");
        ObjectNode msg = messages.addObject();
        msg.put("role", "user");
        msg.put("content", prompt);

        ObjectNode responseFormat = requestBody.putObject("response_format");
        responseFormat.put("type", "json_object");

        requestBody.put("temperature", 0.3);
        requestBody.put("max_tokens", 8000);

        String bodyJson;
        try {
            bodyJson = objectMapper.writeValueAsString(requestBody);
        } catch (Exception e) {
            throw new RuntimeException("请求体序列化失败: " + e.getMessage());
        }

        HttpResponse response = HttpRequest.post(DASHSCOPE_URL)
                .header("Authorization", "Bearer " + apiKey)
                .header("Content-Type", "application/json")
                .body(bodyJson)
                .timeout(60000)
                .execute();

        String responseBody = response.body();
        log.debug("DashScope API 响应: {}", responseBody);

        if (response.getStatus() != 200) {
            throw new RuntimeException("DashScope API 调用失败, HTTP " + response.getStatus() + ": " + responseBody);
        }

        try {
            JsonNode respJson = objectMapper.readTree(responseBody);
            JsonNode choices = respJson.get("choices");
            if (choices != null && choices.isArray() && choices.size() > 0) {
                JsonNode firstChoice = choices.get(0);
                JsonNode message = firstChoice.get("message");
                if (message != null) {
                    return message.get("content").asText();
                }
            }
            throw new RuntimeException("API 响应格式异常: " + responseBody);
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("API 响应解析失败: " + e.getMessage());
        }
    }

    /**
     * 解析 AI 返回的 JSON（兼容 markdown 代码块包裹）
     */
    private JsonNode parseAiResponse(String content) {
        try {
            // 去除可能的 markdown 代码块包裹
            String json = content.trim();
            if (json.startsWith("```json")) {
                json = json.substring(7);
            } else if (json.startsWith("```")) {
                json = json.substring(3);
            }
            if (json.endsWith("```")) {
                json = json.substring(0, json.length() - 3);
            }
            json = json.trim();
            return objectMapper.readTree(json);
        } catch (Exception e) {
            log.error("AI 响应 JSON 解析失败: {}", content, e);
            return null;
        }
    }

    private String getTextValue(JsonNode node, String field) {
        JsonNode val = node.get(field);
        if (val == null || val.isNull()) return null;
        return val.asText();
    }

    private int getIntValue(JsonNode node, String field, int defaultValue) {
        JsonNode val = node.get(field);
        if (val == null || val.isNull()) return defaultValue;
        try {
            return val.asInt(defaultValue);
        } catch (Exception e) {
            return defaultValue;
        }
    }

    // ==================== AI 智能搜题 ====================

    /**
     * AI 搜题 - 预览（不入库）
     */
    public Map<String, Object> previewAiQuestions(Long gradeId, Long subjectId, String semester) {
        Map<String, Object> result = new LinkedHashMap<>();

        try {
            if (apiKey == null || apiKey.isBlank()) {
                result.put("error", "未配置 DashScope API Key");
                return result;
            }

            Subject subject = subjectMapper.selectById(subjectId);
            Grade grade = gradeMapper.selectById(gradeId);
            if (subject == null || grade == null) {
                result.put("error", "学科或年级不存在");
                return result;
            }

            String prompt = buildQuestionSearchPrompt(grade.getName(), semester, subject.getName());
            String aiResponse = callQwenApi(prompt);
            log.info("AI 搜题返回内容长度: {}", aiResponse.length());

            JsonNode root = parseAiResponse(aiResponse);
            if (root == null) {
                result.put("error", "AI 返回内容解析失败");
                return result;
            }

            JsonNode questionsNode = root.get("questions");
            if (questionsNode == null || !questionsNode.isArray()) {
                result.put("error", "AI 返回的 JSON 中缺少 questions 数组");
                return result;
            }

            List<Map<String, Object>> questions = new ArrayList<>();
            for (JsonNode qNode : questionsNode) {
                Map<String, Object> q = new LinkedHashMap<>();
                q.put("type", getIntValue(qNode, "type", 1));
                q.put("content", getTextValue(qNode, "content"));
                q.put("options", getTextValue(qNode, "options"));
                q.put("answer", getTextValue(qNode, "answer"));
                q.put("analysis", getTextValue(qNode, "analysis"));
                q.put("difficulty", getIntValue(qNode, "difficulty", 3));
                q.put("source", getTextValue(qNode, "source"));
                q.put("knowledge", getTextValue(qNode, "knowledge"));
                questions.add(q);
            }

            result.put("questions", questions);

        } catch (Exception e) {
            log.error("AI 搜题失败", e);
            result.put("error", "系统错误: " + e.getMessage());
        }
        return result;
    }

    /**
     * AI 搜题 - 确认保存
     */
    @Transactional
    public Map<String, Object> confirmAiQuestions(Long gradeId, Long subjectId, List<Map<String, Object>> questions) {
        Map<String, Object> result = new LinkedHashMap<>();
        int added = 0;
        int skipped = 0;
        List<String> errors = new ArrayList<>();

        try {
            for (Map<String, Object> qMap : questions) {
                try {
                    String content = qMap.get("content") != null ? String.valueOf(qMap.get("content")).trim() : "";
                    if (content.isEmpty()) continue;

                    // 去重检查：同学科、同年级、同内容视为重复
                    Long existCount = questionMapper.selectCount(
                        new LambdaQueryWrapper<Question>()
                            .eq(Question::getSubjectId, subjectId)
                            .eq(Question::getGradeId, gradeId)
                            .eq(Question::getContent, content)
                            .eq(Question::getDeleted, 0)
                    );
                    if (existCount != null && existCount > 0) {
                        skipped++;
                        continue;
                    }

                    Question q = new Question();
                    q.setSubjectId(subjectId);
                    q.setGradeId(gradeId);
                    q.setChapterId(0L);
                    q.setKnowledgeId(0L);
                    q.setType(qMap.get("type") != null ? ((Number) qMap.get("type")).intValue() : 1);
                    q.setContent(content);
                    q.setOptions(qMap.get("options") != null ? String.valueOf(qMap.get("options")) : null);
                    q.setAnswer(qMap.get("answer") != null ? String.valueOf(qMap.get("answer")) : "");
                    q.setAnalysis(qMap.get("analysis") != null ? String.valueOf(qMap.get("analysis")) : "");
                    q.setDifficulty(qMap.get("difficulty") != null ? ((Number) qMap.get("difficulty")).intValue() : 3);
                    q.setSource(qMap.get("source") != null ? String.valueOf(qMap.get("source")) : "AI搜题");
                    q.setScore(q.getType() == 1 ? 2 : (q.getType() == 2 ? 4 : 10));
                    q.setStatus(1);
                    questionMapper.insert(q);
                    added++;
                } catch (Exception e) {
                    errors.add("题目插入失败: " + e.getMessage());
                }
            }
        } catch (Exception e) {
            log.error("确认保存AI搜题结果失败", e);
            errors.add("系统错误: " + e.getMessage());
        }

        result.put("added", added);
        result.put("skipped", skipped);
        result.put("errors", errors);
        return result;
    }

    /**
     * 构建 AI 搜题 Prompt
     */
    private String buildQuestionSearchPrompt(String gradeName, String semester, String subjectName) {
        return """
                你是一位资深%s教师，精通上海新课编%s教材。请搜索并整理上海新课编%s（%s）近5年考试真题中的经典题目。

                要求：
                1. 生成15-25道高质量题目，覆盖本学期主要知识点
                2. 题目类型混合搭配：选择题(type=1)占60%%，填空题(type=2)占30%%，解答题(type=3)占10%%
                3. 每道题标注对应的知识点名称(knowledge字段)
                4. 选择题必须有4个选项，options为JSON数组字符串
                5. 填空题和解答题options为空字符串
                6. difficulty范围1-5，真题建议3-4
                7. source标注题目来源，如"2024年上海XX区期中真题"、"2023年上海期末真题"、"上海新课编-课本例题"等
                8. 严格按照以下JSON格式返回：

                {
                  "questions": [
                    {
                      "type": 1,
                      "content": "题目内容",
                      "options": "[\\"A. 选项一\\",\\"B. 选项二\\",\\"C. 选项三\\",\\"D. 选项四\\"]",
                      "answer": "A",
                      "analysis": "详细解析过程",
                      "difficulty": 3,
                      "source": "2024年上海浦东新区期中真题",
                      "knowledge": "对应的知识点名称"
                    }
                  ]
                }

                请确保返回有效的JSON格式。
                """.formatted(subjectName, subjectName, gradeName, subjectName, semester);
    }

    // ==================== AI 知识点导入 ====================

    /**
     * AI 知识点导入 - 预览（不入库）
     * 支持单章节或多章节（chapterId为null时查询该学科+年级的所有章节）
     */
    public Map<String, Object> previewAiKnowledges(Long subjectId, Long gradeId, Long chapterId, String semester) {
        Map<String, Object> result = new LinkedHashMap<>();

        try {
            if (apiKey == null || apiKey.isBlank()) {
                result.put("error", "未配置 DashScope API Key");
                return result;
            }

            Subject subject = subjectMapper.selectById(subjectId);
            Grade grade = gradeMapper.selectById(gradeId);
            if (subject == null || grade == null) {
                result.put("error", "学科或年级不存在");
                return result;
            }

            // 确定要处理的章节列表
            List<Chapter> chaptersToProcess = new ArrayList<>();
            if (chapterId != null && chapterId > 0) {
                // 单章节模式
                Chapter chapter = chapterMapper.selectById(chapterId);
                if (chapter == null) {
                    result.put("error", "章节不存在");
                    return result;
                }
                chaptersToProcess.add(chapter);
            } else {
                // 多章节模式：查询该学科+年级的所有章节
                List<Chapter> allChapters = chapterMapper.selectList(
                    new LambdaQueryWrapper<Chapter>()
                        .eq(Chapter::getSubjectId, subjectId)
                        .eq(Chapter::getGradeId, gradeId)
                        .eq(Chapter::getParentId, 0L)
                        .orderByAsc(Chapter::getSortOrder)
                );
                if (allChapters == null || allChapters.isEmpty()) {
                    result.put("error", "该学科年级下暂无章节");
                    return result;
                }
                chaptersToProcess.addAll(allChapters);
            }

            // 为每个章节生成知识点
            List<Map<String, Object>> allKnowledges = new ArrayList<>();
            for (Chapter chapter : chaptersToProcess) {
                String prompt = buildKnowledgePrompt(grade.getName(), semester, subject.getName(), chapter.getName());
                String aiResponse = callQwenApi(prompt);
                log.info("AI 知识点导入[{}]返回内容长度: {}", chapter.getName(), aiResponse.length());

                JsonNode root = parseAiResponse(aiResponse);
                if (root == null) {
                    log.warn("AI 返回内容解析失败，章节: {}", chapter.getName());
                    continue;
                }

                JsonNode knowledgesNode = root.get("knowledges");
                if (knowledgesNode == null || !knowledgesNode.isArray()) {
                    log.warn("AI 返回的 JSON 中缺少 knowledges 数组，章节: {}", chapter.getName());
                    continue;
                }

                int sortOrder = 1;
                for (JsonNode kNode : knowledgesNode) {
                    Map<String, Object> k = new LinkedHashMap<>();
                    k.put("chapterId", chapter.getId());
                    k.put("chapterName", chapter.getName());
                    k.put("name", getTextValue(kNode, "name"));
                    k.put("summary", getTextValue(kNode, "summary"));
                    k.put("keyPoints", getTextValue(kNode, "keyPoints"));
                    k.put("formulas", getTextValue(kNode, "formulas"));
                    k.put("examples", getTextValue(kNode, "examples"));
                    k.put("sortOrder", sortOrder++);
                    allKnowledges.add(k);
                }
            }

            result.put("knowledges", allKnowledges);
            result.put("chapterCount", chaptersToProcess.size());

        } catch (Exception e) {
            log.error("AI 知识点导入失败", e);
            result.put("error", "系统错误: " + e.getMessage());
        }
        return result;
    }

    /**
     * AI 知识点导入 - 确认保存
     * 支持多章节保存（每个知识点带有 chapterId）
     */
    @Transactional
    public Map<String, Object> confirmAiKnowledges(List<Map<String, Object>> knowledges) {
        Map<String, Object> result = new LinkedHashMap<>();
        int added = 0;
        int skipped = 0;
        List<String> errors = new ArrayList<>();

        try {
            for (Map<String, Object> kMap : knowledges) {
                try {
                    String name = kMap.get("name") != null ? String.valueOf(kMap.get("name")).trim() : "";
                    if (name.isEmpty()) continue;

                    Long chapterId = kMap.get("chapterId") != null ? ((Number) kMap.get("chapterId")).longValue() : 0L;
                    if (chapterId == 0L) {
                        errors.add("知识点缺少章节ID: " + name);
                        continue;
                    }

                    // 去重检查：同章节、同名称视为重复
                    Long existCount = knowledgeMapper.selectCount(
                        new LambdaQueryWrapper<Knowledge>()
                            .eq(Knowledge::getChapterId, chapterId)
                            .eq(Knowledge::getName, name)
                    );
                    if (existCount != null && existCount > 0) {
                        skipped++;
                        continue;
                    }

                    Knowledge k = new Knowledge();
                    k.setChapterId(chapterId);
                    k.setName(name);
                    k.setSummary(kMap.get("summary") != null ? String.valueOf(kMap.get("summary")) : "");
                    k.setKeyPoints(kMap.get("keyPoints") != null ? String.valueOf(kMap.get("keyPoints")) : "");
                    k.setFormulas(kMap.get("formulas") != null ? String.valueOf(kMap.get("formulas")) : "");
                    k.setExamples(kMap.get("examples") != null ? String.valueOf(kMap.get("examples")) : "");
                    k.setSortOrder(kMap.get("sortOrder") != null ? ((Number) kMap.get("sortOrder")).intValue() : 0);
                    knowledgeMapper.insert(k);
                    added++;
                } catch (Exception e) {
                    errors.add("知识点插入失败: " + e.getMessage());
                }
            }
        } catch (Exception e) {
            log.error("确认保存AI知识点结果失败", e);
            errors.add("系统错误: " + e.getMessage());
        }

        result.put("added", added);
        result.put("skipped", skipped);
        result.put("errors", errors);
        return result;
    }

    /**
     * 构建 AI 知识点导入 Prompt
     */
    private String buildKnowledgePrompt(String gradeName, String semester, String subjectName, String chapterName) {
        return """
                你是一位资深%s教师，精通上海新课编%s教材。请为%s%s（%s）的章节“%s”生成详尽的知识点列表。

                要求：
                1. 生成10-20个知识点，覆盖该章节的核心内容
                2. 每个知识点包含：
                   - name: 知识点名称（简洁明了）
                   - summary: 知识点概要（50-100字描述）
                   - keyPoints: 重难点说明（可选，可为空字符串）
                   - formulas: 相关公式（可选，可为空字符串）
                   - examples: 典型例题（可选，可为空字符串）
                3. 知识点按教学顺序排列，从基础到进阶
                4. 内容要符合上海新课编教材要求
                5. 严格按照以下JSON格式返回：

                {
                  "knowledges": [
                    {
                      "name": "知识点名称",
                      "summary": "知识点概要描述",
                      "keyPoints": "重难点说明",
                      "formulas": "相关公式",
                      "examples": "典型例题"
                    }
                  ]
                }

                请确保返回有效的JSON格式。
                """.formatted(subjectName, subjectName, gradeName, subjectName, semester, chapterName);
    }
}
