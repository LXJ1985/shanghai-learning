package com.learning.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.learning.entity.Chapter;
import com.learning.entity.Knowledge;
import com.learning.entity.Question;
import com.learning.mapper.ChapterMapper;
import com.learning.mapper.KnowledgeMapper;
import com.learning.mapper.QuestionMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final QuestionMapper questionMapper;
    private final ChapterMapper chapterMapper;
    private final KnowledgeMapper knowledgeMapper;

    /**
     * 题目分页查询
     */
    public Page<Question> getQuestions(Long subjectId, Long chapterId, Integer type,
                                       String keyword, int page, int size) {
        LambdaQueryWrapper<Question> wrapper = new LambdaQueryWrapper<>();
        if (subjectId != null) wrapper.eq(Question::getSubjectId, subjectId);
        if (chapterId != null) wrapper.eq(Question::getChapterId, chapterId);
        if (type != null) wrapper.eq(Question::getType, type);
        if (keyword != null && !keyword.isBlank()) {
            wrapper.like(Question::getContent, keyword);
        }
        wrapper.orderByDesc(Question::getCreatedAt);
        return questionMapper.selectPage(new Page<>(page, size), wrapper);
    }

    public Question createQuestion(Question question) {
        questionMapper.insert(question);
        return question;
    }

    public Question updateQuestion(Long id, Question question) {
        question.setId(id);
        questionMapper.updateById(question);
        return questionMapper.selectById(id);
    }

    public void deleteQuestion(Long id) {
        questionMapper.deleteById(id);
    }

    /**
     * 生成 TXT 导入模板内容
     * 格式: 题型|内容|答案|难度|分值
     */
    public String generateTxtTemplate() {
        return "1|二次根式的定义是什么？|根号下含有字母的式子|2|5\n"
             + "1|下列哪个是二次根式？A.√3 B.√x C.∛2 D.1/x|B|1|5\n"
             + "4|√4=2，这句话对吗？（对/错）|对|1|3\n"
             + "2|计算：√2 × √8 = ____|4|2|5\n";
    }

    /**
     * 生成 CSV 导入模板内容
     * 列: 题型,内容,答案,难度,分值
     */
    public String generateCsvTemplate() {
        StringBuilder sb = new StringBuilder();
        // BOM + 表头
        sb.append("\uFEFF题型,内容,答案,难度,分值\n");
        sb.append("1,二次根式的定义是什么？,根号下含有字母的式子,2,5\n");
        sb.append("1,\"下列哪个是二次根式？A.√3 B.√x C.∛2 D.1/x\",B,1,5\n");
        sb.append("4,\"√4=2，这句话对吗？（对/错）\",对,1,3\n");
        sb.append("2,\"计算：√2 × √8 = ____\",4,2,5\n");
        return sb.toString();
    }

    /**
     * 生成 Excel 导入模板字节数组
     */
    public byte[] generateExcelTemplate() throws IOException {
        try (Workbook wb = new XSSFWorkbook()) {
            Sheet sheet = wb.createSheet("题目导入模板");

            // 表头样式
            CellStyle headerStyle = wb.createCellStyle();
            Font headerFont = wb.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.PALE_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setBorderBottom(BorderStyle.THIN);
            headerStyle.setBorderTop(BorderStyle.THIN);
            headerStyle.setBorderLeft(BorderStyle.THIN);
            headerStyle.setBorderRight(BorderStyle.THIN);

            // 表头
            String[] headers = {"题型", "内容", "答案", "难度", "分值"};
            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // 示例数据
            String[][] data = {
                {"1", "二次根式的定义是什么？", "根号下含有字母的式子", "2", "5"},
                {"1", "下列哪个是二次根式？A.√3 B.√x C.∛2 D.1/x", "B", "1", "5"},
                {"4", "√4=2，这句话对吗？（对/错）", "对", "1", "3"},
                {"2", "计算：√2 × √8 = ____", "4", "2", "5"},
            };
            for (int r = 0; r < data.length; r++) {
                Row row = sheet.createRow(r + 1);
                for (int c = 0; c < data[r].length; c++) {
                    row.createCell(c).setCellValue(data[r][c]);
                }
            }

            // 说明 Sheet
            Sheet infoSheet = wb.createSheet("说明");
            infoSheet.createRow(0).createCell(0).setCellValue("题型说明");
            infoSheet.createRow(1).createCell(0).setCellValue("1 = 单选题");
            infoSheet.createRow(2).createCell(0).setCellValue("2 = 填空题");
            infoSheet.createRow(3).createCell(0).setCellValue("3 = 解答题");
            infoSheet.createRow(4).createCell(0).setCellValue("4 = 判断题");
            infoSheet.createRow(5).createCell(0).setCellValue("5 = 简答题");
            infoSheet.createRow(7).createCell(0).setCellValue("难度: 1=易 2=中 3=难 4=较难 5=难");
            infoSheet.createRow(8).createCell(0).setCellValue("分值: 1-100 的整数");

            // 列宽自适应
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            wb.write(out);
            return out.toByteArray();
        }
    }

    /**
     * 批量导入章节
     * 新格式(5列): 学科ID|年级ID|父行号(0=根)|章节名称|排序
     * 旧格式(4列): 学科ID|父行号(0=根)|章节名称|排序（兼容，年级ID取前端选择或0）
     * 父行号为数据行号（不含表头），0 表示根章节，>0 表示引用该行号对应的章节作为父级
     */
    public Map<String, Object> importChapters(MultipartFile file, Long defaultSubjectId, Long defaultGradeId) {
        int success = 0;
        int fail = 0;
        List<String> errors = new ArrayList<>();
        Map<Integer, Long> rowIdMap = new HashMap<>();

        try {
            // 自动检测编码: 处理 UTF-8 BOM 和 GBK
            byte[] bytes = file.getBytes();
            String content;
            if (bytes.length >= 3 && (bytes[0] & 0xFF) == 0xEF && (bytes[1] & 0xFF) == 0xBB && (bytes[2] & 0xFF) == 0xBF) {
                content = new String(bytes, 3, bytes.length - 3, "UTF-8");
            } else {
                content = new String(bytes, "UTF-8");
                if (content.contains("\uFFFD")) {
                    content = new String(bytes, "GBK");
                }
            }
            String[] lines = content.split("\n");
            int dataRowNum = 0;
            String separator = null; // 自动检测分隔符
            for (String line : lines) {
                line = line.trim();
                if (line.isEmpty()) continue;

                // 自动检测分隔符（第一行数据时检测）
                if (separator == null) {
                    if (line.contains("|")) {
                        separator = "\\|";
                    } else if (line.contains("\t")) {
                        separator = "\t";
                    } else {
                        separator = ",";
                    }
                }

                String[] parts = line.split(separator);
                // 跳过表头行（第一个字段不是数字）
                if (dataRowNum == 0 && parts.length > 0 && !parts[0].trim().matches("\\d+")) {
                    continue;
                }

                dataRowNum++;
                try {
                    long subjectId;
                    long gradeId;
                    int parentRef;
                    String name;
                    int sortOrder;

                    if (parts.length >= 5) {
                        // 新格式: 学科ID|年级ID|父行号|章节名称|排序
                        subjectId = defaultSubjectId != null && defaultSubjectId > 0
                                ? defaultSubjectId : Long.parseLong(parts[0].trim());
                        gradeId = defaultGradeId != null && defaultGradeId > 0
                                ? defaultGradeId : Long.parseLong(parts[1].trim());
                        parentRef = Integer.parseInt(parts[2].trim());
                        name = parts[3].trim();
                        sortOrder = Integer.parseInt(parts[4].trim());
                    } else if (parts.length >= 4) {
                        // 旧格式兼容: 学科ID|父行号|章节名称|排序
                        subjectId = defaultSubjectId != null && defaultSubjectId > 0
                                ? defaultSubjectId : Long.parseLong(parts[0].trim());
                        gradeId = defaultGradeId != null && defaultGradeId > 0
                                ? defaultGradeId : 0L;
                        parentRef = Integer.parseInt(parts[1].trim());
                        name = parts[2].trim();
                        sortOrder = Integer.parseInt(parts[3].trim());
                    } else {
                        fail++;
                        errors.add("格式错误(需4或5列): " + line);
                        continue;
                    }

                    long parentId = 0L;
                    if (parentRef > 0) {
                        Long refId = rowIdMap.get(parentRef);
                        if (refId == null) {
                            fail++;
                            errors.add("第" + dataRowNum + "行: 父行号" + parentRef + "不存在或尚未导入");
                            continue;
                        }
                        parentId = refId;
                    }

                    Chapter ch = new Chapter();
                    ch.setSubjectId(subjectId);
                    ch.setGradeId(gradeId);
                    ch.setParentId(parentId);
                    ch.setName(name);
                    ch.setSortOrder(sortOrder);
                    chapterMapper.insert(ch);
                    rowIdMap.put(dataRowNum, ch.getId());
                    success++;
                } catch (Exception e) {
                    fail++;
                    errors.add("解析失败: " + line);
                }
            }
        } catch (Exception e) {
            errors.add("文件读取失败: " + e.getMessage());
        }

        Map<String, Object> result = new HashMap<>();
        result.put("success", success);
        result.put("fail", fail);
        result.put("errors", errors);
        return result;
    }

    /**
     * 生成章节导入 TXT 模板
     */
    public String generateChapterTxtTemplate() {
        return "学科ID|年级ID|父行号(0=根)|章节名称|排序\n"
             + "1|3|0|第一章 二次根式|1\n"
             + "1|3|1|1.1 二次根式的定义|1\n"
             + "1|3|1|1.2 二次根式的性质|2\n"
             + "1|3|0|第二章 勾股定理|2\n"
             + "1|3|4|2.1 勾股定理的内容|1\n"
             + "1|3|4|2.2 勾股定理的应用|2\n";
    }

    /**
     * 生成章节导入 CSV 模板
     */
    public String generateChapterCsvTemplate() {
        StringBuilder sb = new StringBuilder();
        sb.append("\uFEFF学科ID,年级ID,父行号(0=根),章节名称,排序\n");
        sb.append("1,3,0,第一章 二次根式,1\n");
        sb.append("1,3,1,1.1 二次根式的定义,1\n");
        sb.append("1,3,1,1.2 二次根式的性质,2\n");
        sb.append("1,3,0,第二章 勾股定理,2\n");
        sb.append("1,3,4,2.1 勾股定理的内容,1\n");
        sb.append("1,3,4,2.2 勾股定理的应用,2\n");
        return sb.toString();
    }

    /**
     * 生成章节导入 Excel 模板
     */
    public byte[] generateChapterExcelTemplate() throws IOException {
        try (Workbook wb = new XSSFWorkbook()) {
            Sheet sheet = wb.createSheet("章节导入模板");

            CellStyle headerStyle = wb.createCellStyle();
            Font headerFont = wb.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.LIGHT_GREEN.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setBorderBottom(BorderStyle.THIN);
            headerStyle.setBorderTop(BorderStyle.THIN);
            headerStyle.setBorderLeft(BorderStyle.THIN);
            headerStyle.setBorderRight(BorderStyle.THIN);

            String[] headers = {"学科ID", "年级ID", "父行号(0=根)", "章节名称", "排序"};
            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            String[][] data = {
                {"1", "3", "0", "第一章 二次根式", "1"},
                {"1", "3", "1", "1.1 二次根式的定义", "1"},
                {"1", "3", "1", "1.2 二次根式的性质", "2"},
                {"1", "3", "0", "第二章 勾股定理", "2"},
                {"1", "3", "4", "2.1 勾股定理的内容", "1"},
                {"1", "3", "4", "2.2 勾股定理的应用", "2"},
            };
            for (int r = 0; r < data.length; r++) {
                Row row = sheet.createRow(r + 1);
                for (int c = 0; c < data[r].length; c++) {
                    row.createCell(c).setCellValue(data[r][c]);
                }
            }

            Sheet infoSheet = wb.createSheet("说明");
            infoSheet.createRow(0).createCell(0).setCellValue("章节导入说明");
            infoSheet.createRow(2).createCell(0).setCellValue("学科ID对照:");
            infoSheet.createRow(3).createCell(0).setCellValue("1-语文, 2-数学, 3-英语, 4-历史, 5-地理, 6-生物, 7-物理, 8-化学, 9-科学, 10-思想政治");
            infoSheet.createRow(5).createCell(0).setCellValue("年级ID对照:");
            infoSheet.createRow(6).createCell(0).setCellValue("1-六年级, 2-七年级, 3-八年级, 4-九年级");
            infoSheet.createRow(8).createCell(0).setCellValue("父行号: 0=根章节, 其他=数据行号(不含表头)");
            infoSheet.createRow(9).createCell(0).setCellValue("例如: 第1行数据父行号为0(根), 第2行父行号为1(挂在第1行下)");
            infoSheet.createRow(10).createCell(0).setCellValue("排序: 数值越小越靠前");
            infoSheet.createRow(12).createCell(0).setCellValue("注意: 父行号必须引用已出现的行号, 请先导入父章节再导入子章节");

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            wb.write(out);
            return out.toByteArray();
        }
    }

    /**
     * 批量导入题目(简化版: 解析文本格式)
     * 格式: 题型|内容|答案|难度|分值
     */
    public Map<String, Object> importQuestions(MultipartFile file, Long subjectId) {
        int success = 0;
        int fail = 0;
        List<String> errors = new ArrayList<>();

        try {
            // 自动检测编码: 处理 UTF-8 BOM 和 GBK
            byte[] bytes = file.getBytes();
            String content;
            if (bytes.length >= 3 && (bytes[0] & 0xFF) == 0xEF && (bytes[1] & 0xFF) == 0xBB && (bytes[2] & 0xFF) == 0xBF) {
                content = new String(bytes, 3, bytes.length - 3, "UTF-8");
            } else {
                content = new String(bytes, "UTF-8");
                if (content.contains("\uFFFD")) {
                    content = new String(bytes, "GBK");
                }
            }
            String[] lines = content.split("\n");
            for (String line : lines) {
                line = line.trim();
                if (line.isEmpty()) continue;
                try {
                    // 简单格式: 题型|内容|答案|难度|分值
                    String[] parts = line.split("\\|");
                    if (parts.length >= 5) {
                        Question q = new Question();
                        q.setSubjectId(subjectId != null && subjectId > 0 ? subjectId : 1L);
                        q.setType(Integer.parseInt(parts[0].trim()));
                        q.setContent(parts[1].trim());
                        q.setAnswer(parts[2].trim());
                        q.setDifficulty(Integer.parseInt(parts[3].trim()));
                        q.setScore(Integer.parseInt(parts[4].trim()));
                        questionMapper.insert(q);
                        success++;
                    } else {
                        fail++;
                        errors.add("格式错误: " + line);
                    }
                } catch (Exception e) {
                    fail++;
                    errors.add("解析失败: " + line);
                }
            }
        } catch (Exception e) {
            errors.add("文件读取失败: " + e.getMessage());
        }

        Map<String, Object> result = new HashMap<>();
        result.put("success", success);
        result.put("fail", fail);
        result.put("errors", errors);
        return result;
    }

    /**
     * 批量导入知识点
     * 格式: 章节名称|知识点名称|知识概要|重难点|公式|例题|排序
     * 最少必填: 章节名称|知识点名称|排序（其余列可为空）
     * 第一列为章节名称，从章节表中按名称匹配章节ID
     */
    public Map<String, Object> importKnowledges(MultipartFile file, Long defaultChapterId) {
        int success = 0;
        int fail = 0;
        List<String> errors = new ArrayList<>();

        try {
            // 构建章节名称 -> 章节ID 的映射
            List<Chapter> allChapters = chapterMapper.selectList(
                    new LambdaQueryWrapper<Chapter>().orderByAsc(Chapter::getId));
            Map<String, Long> nameToChapterId = new LinkedHashMap<>();
            for (Chapter ch : allChapters) {
                nameToChapterId.put(ch.getName(), ch.getId());
            }

            byte[] bytes = file.getBytes();
            String originalFilename = file.getOriginalFilename();
            boolean isExcel = originalFilename != null
                    && (originalFilename.endsWith(".xlsx") || originalFilename.endsWith(".xls"));
            // 也通过文件头检测: xlsx 以 PK 开头 (ZIP格式)
            if (!isExcel && bytes.length >= 2 && (bytes[0] & 0xFF) == 0x50 && (bytes[1] & 0xFF) == 0x4B) {
                isExcel = true;
            }

            if (isExcel) {
                // 使用 POI 解析 Excel
                try (Workbook wb = WorkbookFactory.create(new java.io.ByteArrayInputStream(bytes))) {
                    Sheet sheet = wb.getSheetAt(0);
                    int dataRowNum = 0;
                    for (Row row : sheet) {
                        if (row.getRowNum() == 0) {
                            // 跳过表头行（检查第一列是否包含"示例"或"章节"）
                            Cell firstCell = row.getCell(0);
                            if (firstCell != null) {
                                String val = getCellStringValue(firstCell);
                                if (val != null && (val.contains("示例") || val.contains("章节"))) {
                                    continue;
                                }
                            }
                        }
                        // 跳过空行
                        Cell firstCell = row.getCell(0);
                        if (firstCell == null || getCellStringValue(firstCell) == null
                                || getCellStringValue(firstCell).trim().isEmpty()) {
                            continue;
                        }

                        dataRowNum++;
                        try {
                            int lastCol = row.getLastCellNum();
                            if (lastCol < 3) {
                                fail++;
                                errors.add("第" + (row.getRowNum() + 1) + "行: 格式错误(至少3列: 章节名称|知识点名称|排序)");
                                continue;
                            }

                            String[] parts = new String[lastCol];
                            for (int c = 0; c < lastCol; c++) {
                                Cell cell = row.getCell(c);
                                parts[c] = cell != null ? getCellStringValue(cell) : "";
                            }

                            // 第一列为章节名称，匹配章节ID
                            long chapterId;
                            if (defaultChapterId != null && defaultChapterId > 0) {
                                chapterId = defaultChapterId;
                            } else {
                                String chapterName = parts[0].trim();
                                chapterId = nameToChapterId.getOrDefault(chapterName, 0L);
                                if (chapterId == 0L) {
                                    fail++;
                                    errors.add("第" + (row.getRowNum() + 1) + "行: 章节\"" + chapterName + "\"不存在，请检查名称是否完全匹配");
                                    continue;
                                }
                            }
                            String name = parts[1].trim();
                            int sortOrder = parseIntSafe(parts[lastCol - 1], dataRowNum);

                            Knowledge k = new Knowledge();
                            k.setChapterId(chapterId);
                            k.setName(name);
                            k.setSortOrder(sortOrder);

                            // 中间列: summary|keyPoints|formulas|examples (可选)
                            if (parts.length >= 7) {
                                k.setSummary(safeGet(parts, 2));
                                k.setKeyPoints(safeGet(parts, 3));
                                k.setFormulas(safeGet(parts, 4));
                                k.setExamples(safeGet(parts, 5));
                            } else if (parts.length >= 4) {
                                k.setSummary(safeGet(parts, 2));
                            }

                            knowledgeMapper.insert(k);
                            success++;
                        } catch (Exception e) {
                            fail++;
                            errors.add("第" + (row.getRowNum() + 1) + "行解析失败: " + e.getMessage());
                        }
                    }
                }
            } else {
                // 文本格式解析 (TXT/CSV)
                String content;
                if (bytes.length >= 3 && (bytes[0] & 0xFF) == 0xEF && (bytes[1] & 0xFF) == 0xBB && (bytes[2] & 0xFF) == 0xBF) {
                    content = new String(bytes, 3, bytes.length - 3, "UTF-8");
                } else {
                    content = new String(bytes, "UTF-8");
                    if (content.contains("\uFFFD")) {
                        content = new String(bytes, "GBK");
                    }
                }
                String[] lines = content.split("\n");
                String separator = null;
                int dataRowNum = 0;
                for (String line : lines) {
                    line = line.trim();
                    if (line.isEmpty()) continue;

                    if (separator == null) {
                        if (line.contains("|")) {
                            separator = "\\|";
                        } else if (line.contains("\t")) {
                            separator = "\t";
                        } else {
                            separator = ",";
                        }
                    }

                    String[] parts = line.split(separator);
                    // 跳过表头（第一列包含"示例"或"章节"等关键字）
                    if (dataRowNum == 0 && parts.length > 0
                            && (parts[0].trim().contains("示例") || parts[0].trim().contains("章节"))) {
                        continue;
                    }

                    dataRowNum++;
                    try {
                        if (parts.length < 3) {
                            fail++;
                            errors.add("第" + dataRowNum + "行: 格式错误(至少3列: 章节名称|知识点名称|排序): " + line);
                            continue;
                        }

                        // 第一列为章节名称，匹配章节ID
                        long chapterId;
                        if (defaultChapterId != null && defaultChapterId > 0) {
                            chapterId = defaultChapterId;
                        } else {
                            String chapterName = parts[0].trim();
                            chapterId = nameToChapterId.getOrDefault(chapterName, 0L);
                            if (chapterId == 0L) {
                                fail++;
                                errors.add("第" + dataRowNum + "行: 章节\"" + chapterName + "\"不存在，请检查名称是否完全匹配");
                                continue;
                            }
                        }
                        String name = parts[1].trim();
                        int sortOrder = parseIntSafe(parts[parts.length - 1], dataRowNum);

                        Knowledge k = new Knowledge();
                        k.setChapterId(chapterId);
                        k.setName(name);
                        k.setSortOrder(sortOrder);

                        // 中间列: summary|keyPoints|formulas|examples (可选)
                        if (parts.length >= 7) {
                            k.setSummary(safeGet(parts, 2));
                            k.setKeyPoints(safeGet(parts, 3));
                            k.setFormulas(safeGet(parts, 4));
                            k.setExamples(safeGet(parts, 5));
                        } else if (parts.length >= 4) {
                            k.setSummary(safeGet(parts, 2));
                        }

                        knowledgeMapper.insert(k);
                        success++;
                    } catch (Exception e) {
                        fail++;
                        errors.add("第" + dataRowNum + "行解析失败: " + e.getMessage());
                    }
                }
            }
        } catch (Exception e) {
            errors.add("文件读取失败: " + e.getMessage());
        }

        Map<String, Object> result = new HashMap<>();
        result.put("success", success);
        result.put("fail", fail);
        result.put("errors", errors);
        return result;
    }

    /**
     * 获取 Excel 单元格的字符串值（兼容数字、字符串、布尔等类型）
     */
    private String getCellStringValue(Cell cell) {
        if (cell == null) return "";
        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue();
            case NUMERIC:
                return numericToString(cell.getNumericCellValue());
            case BOOLEAN:
                return String.valueOf(cell.getBooleanCellValue());
            case FORMULA:
                try {
                    return cell.getStringCellValue();
                } catch (Exception e) {
                    try {
                        return numericToString(cell.getNumericCellValue());
                    } catch (Exception e2) {
                        return "";
                    }
                }
            default:
                return "";
        }
    }

    private String numericToString(double val) {
        if (val == Math.floor(val) && !Double.isInfinite(val)) {
            return String.valueOf((long) val);
        }
        return String.valueOf(val);
    }

    private String safeGet(String[] parts, int index) {
        if (index >= parts.length) return "";
        String val = parts[index].trim();
        return val.isEmpty() ? null : val;
    }

    /**
     * 安全解析整数，空值或非数字返回默认值1
     */
    private int parseIntSafe(String raw, int rowNum) {
        if (raw == null) return rowNum;
        String val = raw.trim();
        if (val.isEmpty()) return rowNum;
        try {
            return Integer.parseInt(val);
        } catch (NumberFormatException e) {
            return rowNum;
        }
    }

    /**
     * 根据筛选条件获取章节列表
     * @param chapterId 指定章节ID（优先）
     * @param subjectId 学科ID
     * @param gradeId 年级ID
     */
    private List<Chapter> getFilteredChapters(Long chapterId, Long subjectId, Long gradeId) {
        LambdaQueryWrapper<Chapter> wrapper = new LambdaQueryWrapper<>();
        if (chapterId != null && chapterId > 0) {
            wrapper.eq(Chapter::getId, chapterId);
        } else {
            if (subjectId != null && subjectId > 0) wrapper.eq(Chapter::getSubjectId, subjectId);
            if (gradeId != null && gradeId > 0) wrapper.eq(Chapter::getGradeId, gradeId);
        }
        wrapper.orderByAsc(Chapter::getId);
        return chapterMapper.selectList(wrapper);
    }

    /**
     * 生成知识点导入 TXT 模板
     * 第一列为章节行号示例（章节名称），根据筛选条件动态生成
     */
    public String generateKnowledgeTxtTemplate(Long chapterId, Long subjectId, Long gradeId) {
        List<Chapter> chapters = getFilteredChapters(chapterId, subjectId, gradeId);
        StringBuilder sb = new StringBuilder();
        sb.append("章节行号示例|知识点名称|知识概要|重难点|公式|例题|排序\n");
        for (Chapter ch : chapters) {
            sb.append(ch.getName()).append("|示例知识点|知识概要|重难点|公式|例题|1\n");
        }
        return sb.toString();
    }

    /**
     * 生成知识点导入 CSV 模板
     */
    public String generateKnowledgeCsvTemplate(Long chapterId, Long subjectId, Long gradeId) {
        List<Chapter> chapters = getFilteredChapters(chapterId, subjectId, gradeId);
        StringBuilder sb = new StringBuilder();
        sb.append("\uFEFF章节行号示例,知识点名称,知识概要,重难点,公式,例题,排序\n");
        for (Chapter ch : chapters) {
            sb.append(ch.getName()).append(",示例知识点,知识概要,重难点,公式,例题,1\n");
        }
        return sb.toString();
    }

    /**
     * 生成知识点导入 Excel 模板
     */
    public byte[] generateKnowledgeExcelTemplate(Long chapterId, Long subjectId, Long gradeId) throws IOException {
        List<Chapter> chapters = getFilteredChapters(chapterId, subjectId, gradeId);
        try (Workbook wb = new XSSFWorkbook()) {
            Sheet sheet = wb.createSheet("知识点导入模板");

            CellStyle headerStyle = wb.createCellStyle();
            Font headerFont = wb.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.LIGHT_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setBorderBottom(BorderStyle.THIN);
            headerStyle.setBorderTop(BorderStyle.THIN);
            headerStyle.setBorderLeft(BorderStyle.THIN);
            headerStyle.setBorderRight(BorderStyle.THIN);

            String[] headers = {"章节行号示例", "知识点名称", "知识概要", "重难点", "公式", "例题", "排序"};
            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // 每个章节一行示例数据
            for (int i = 0; i < chapters.size(); i++) {
                Chapter ch = chapters.get(i);
                Row row = sheet.createRow(i + 1);
                row.createCell(0).setCellValue(ch.getName());
                row.createCell(1).setCellValue("示例知识点");
                row.createCell(2).setCellValue("知识概要");
                row.createCell(3).setCellValue("重难点");
                row.createCell(4).setCellValue("公式");
                row.createCell(5).setCellValue("例题");
                row.createCell(6).setCellValue(1);
            }

            // 说明 Sheet
            Sheet infoSheet = wb.createSheet("说明");
            infoSheet.createRow(0).createCell(0).setCellValue("知识点导入说明");
            infoSheet.createRow(2).createCell(0).setCellValue("必填列: 章节行号示例(章节名称)、知识点名称、排序");
            infoSheet.createRow(3).createCell(0).setCellValue("可选列: 知识概要、重难点、公式、例题");
            infoSheet.createRow(5).createCell(0).setCellValue("第一列填写章节名称(必须与系统中章节名称完全一致)");
            infoSheet.createRow(6).createCell(0).setCellValue("可从本模板获取可用的章节名称列表");
            infoSheet.createRow(8).createCell(0).setCellValue("格式说明");
            infoSheet.createRow(9).createCell(0).setCellValue("TXT: 用 | 分隔各列");
            infoSheet.createRow(10).createCell(0).setCellValue("CSV: 用逗号分隔，含逗号的内容用双引号包裹");
            infoSheet.createRow(11).createCell(0).setCellValue("Excel: 直接填写对应列");

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            wb.write(out);
            return out.toByteArray();
        }
    }

    /**
     * 修复章节学科ID映射
     * 用于修正导入时学科ID映射错误的情况
     * @param mapping 旧学科ID -> 新学科ID 的映射
     */
    public Map<String, Object> fixChapterSubjectIds(Map<Long, Long> mapping) {
        Map<String, Object> result = new HashMap<>();
        int totalUpdated = 0;
        List<String> details = new ArrayList<>();

        // 使用临时ID避免冲突: 先改为临时ID(1000+), 再改为目标ID
        long tempBase = 1000;

        // 第一步: 所有旧ID改为临时ID
        for (Map.Entry<Long, Long> entry : mapping.entrySet()) {
            Long oldId = entry.getKey();
            Long tempId = tempBase + oldId;
            LambdaQueryWrapper<Chapter> wrapper = new LambdaQueryWrapper<>();
            wrapper.eq(Chapter::getSubjectId, oldId);
            Chapter update = new Chapter();
            update.setSubjectId(tempId);
            int count = chapterMapper.update(update, wrapper);
            details.add("Step1: subject_id " + oldId + " -> " + tempId + " (" + count + " rows)");
            totalUpdated += count;
        }

        // 第二步: 临时ID改为目标ID
        for (Map.Entry<Long, Long> entry : mapping.entrySet()) {
            Long newId = entry.getValue();
            Long tempId = tempBase + entry.getKey();
            LambdaQueryWrapper<Chapter> wrapper = new LambdaQueryWrapper<>();
            wrapper.eq(Chapter::getSubjectId, tempId);
            Chapter update = new Chapter();
            update.setSubjectId(newId);
            int count = chapterMapper.update(update, wrapper);
            details.add("Step2: subject_id " + tempId + " -> " + newId + " (" + count + " rows)");
        }

        result.put("totalUpdated", totalUpdated);
        result.put("details", details);
        return result;
    }

    /**
     * 删除指定学科ID范围内且ID小于指定阈值的章节（清理旧数据）
     * @param subjectId 学科ID
     * @param maxId 只删除ID小于此值的章节
     */
    public int deleteChaptersBySubjectAndMaxId(Long subjectId, Long maxId) {
        LambdaQueryWrapper<Chapter> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Chapter::getSubjectId, subjectId);
        wrapper.lt(Chapter::getId, maxId);
        return chapterMapper.delete(wrapper);
    }

    /**
     * 修复章节年级ID映射
     * 用于修正导入时年级ID映射错误的情况
     * @param mapping 旧年级ID -> 新年级ID 的映射
     */
    public Map<String, Object> fixChapterGradeIds(Map<Long, Long> mapping) {
        Map<String, Object> result = new HashMap<>();
        int totalUpdated = 0;
        List<String> details = new ArrayList<>();

        // 使用临时ID避免冲突
        long tempBase = 1000;

        // 第一步: 所有旧ID改为临时ID
        for (Map.Entry<Long, Long> entry : mapping.entrySet()) {
            Long oldId = entry.getKey();
            Long tempId = tempBase + oldId;
            LambdaQueryWrapper<Chapter> wrapper = new LambdaQueryWrapper<>();
            wrapper.eq(Chapter::getGradeId, oldId);
            Chapter update = new Chapter();
            update.setGradeId(tempId);
            int count = chapterMapper.update(update, wrapper);
            details.add("Step1: grade_id " + oldId + " -> " + tempId + " (" + count + " rows)");
            totalUpdated += count;
        }

        // 第二步: 临时ID改为目标ID
        for (Map.Entry<Long, Long> entry : mapping.entrySet()) {
            Long newId = entry.getValue();
            Long tempId = tempBase + entry.getKey();
            LambdaQueryWrapper<Chapter> wrapper = new LambdaQueryWrapper<>();
            wrapper.eq(Chapter::getGradeId, tempId);
            Chapter update = new Chapter();
            update.setGradeId(newId);
            int count = chapterMapper.update(update, wrapper);
            details.add("Step2: grade_id " + tempId + " -> " + newId + " (" + count + " rows)");
        }

        result.put("totalUpdated", totalUpdated);
        result.put("details", details);
        return result;
    }
}
