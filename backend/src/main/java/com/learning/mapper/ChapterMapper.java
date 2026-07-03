package com.learning.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.learning.entity.Chapter;
import org.apache.ibatis.annotations.Mapper;
import java.util.List;

@Mapper
public interface ChapterMapper extends BaseMapper<Chapter> {
}
