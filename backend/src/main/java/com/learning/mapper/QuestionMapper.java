package com.learning.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.learning.entity.Question;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;
import java.util.List;

@Mapper
public interface QuestionMapper extends BaseMapper<Question> {

    @Select("SELECT * FROM t_question WHERE knowledge_id = #{knowledgeId} AND deleted = 0 ORDER BY difficulty ASC")
    List<Question> selectByKnowledgeId(Long knowledgeId);
}
