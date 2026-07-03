package com.learning.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.learning.common.exception.BusinessException;
import com.learning.common.util.JwtUtil;
import com.learning.entity.User;
import com.learning.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public Map<String, Object> login(String username, String password) {
        User user = userMapper.selectOne(
            new LambdaQueryWrapper<User>().eq(User::getUsername, username)
        );
        if (user == null) {
            throw BusinessException.of("用户不存在");
        }
        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw BusinessException.of("密码错误");
        }
        if (user.getStatus() == 0) {
            throw BusinessException.of("账号已被禁用");
        }

        String token = jwtUtil.generateToken(user.getId(), user.getUsername(), 
            user.getRole() == 1 ? "STUDENT" : "ADMIN");

        Map<String, Object> result = new HashMap<>();
        result.put("token", token);
        
        Map<String, Object> userInfo = new HashMap<>();
        userInfo.put("id", user.getId());
        userInfo.put("username", user.getUsername());
        userInfo.put("nickname", user.getNickname());
        userInfo.put("role", user.getRole());
        result.put("userInfo", userInfo);
        
        return result;
    }

    public void register(String username, String password, String nickname, Integer role) {
        // 注册只允许学生角色，管理员由系统分配
        if (role == null || role != 1) {
            throw BusinessException.of("注册角色无效");
        }
        Long count = userMapper.selectCount(
            new LambdaQueryWrapper<User>().eq(User::getUsername, username)
        );
        if (count > 0) {
            throw BusinessException.of("用户名已存在");
        }

        User user = new User();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(password));
        user.setNickname(nickname);
        user.setRole(role);
        user.setStatus(1);
        userMapper.insert(user);
    }

    public User getCurrentUser(Long userId) {
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw BusinessException.of("用户不存在");
        }
        user.setPassword(null);
        return user;
    }

    public void changePassword(Long userId, String oldPassword, String newPassword) {
        User user = userMapper.selectById(userId);
        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw BusinessException.of("原密码错误");
        }
        user.setPassword(passwordEncoder.encode(newPassword));
        userMapper.updateById(user);
    }
}
