package com.learning.common.annotation;

import java.lang.annotation.*;

/**
 * 操作日志注解，标注在 Controller 方法上自动记录操作日志
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface OpLog {

    /** 模块名称 */
    String module() default "";

    /** 操作描述 */
    String operation() default "";
}
