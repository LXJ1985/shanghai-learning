package com.learning.controller;

import com.learning.common.annotation.OpLog;
import com.learning.common.result.Result;
import com.learning.common.util.SecurityContextUtil;
import com.learning.entity.User;
import com.learning.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public Result<Map<String, Object>> login(@RequestBody Map<String, String> body) {
        Map<String, Object> result = authService.login(body.get("username"), body.get("password"));
        return Result.success(result);
    }

    @PostMapping("/register")
    @OpLog(module = "用户管理", operation = "用户注册")
    public Result<Void> register(@RequestBody Map<String, Object> body) {
        authService.register(
            (String) body.get("username"),
            (String) body.get("password"),
            (String) body.get("nickname"),
            (Integer) body.get("role")
        );
        return Result.success();
    }

    @GetMapping("/current-user")
    public Result<User> getCurrentUser() {
        Long userId = SecurityContextUtil.getCurrentUserId();
        return Result.success(authService.getCurrentUser(userId));
    }

    @PutMapping("/password")
    @OpLog(module = "用户管理", operation = "修改密码")
    public Result<Void> changePassword(@RequestBody Map<String, String> body) {
        Long userId = SecurityContextUtil.getCurrentUserId();
        authService.changePassword(userId, body.get("oldPassword"), body.get("newPassword"));
        return Result.success();
    }
}
