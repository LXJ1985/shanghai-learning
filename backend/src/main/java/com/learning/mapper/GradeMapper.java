package com.learning.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.learning.entity.Grade;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface GradeMapper extends BaseMapper<Grade> {
}
