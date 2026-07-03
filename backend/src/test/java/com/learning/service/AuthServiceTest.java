package com.learning.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.learning.common.exception.BusinessException;
import com.learning.common.util.JwtUtil;
import com.learning.entity.User;
import com.learning.mapper.UserMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService \u5355\u5143\u6d4b\u8bd5")
class AuthServiceTest {

    @Mock private UserMapper userMapper;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtUtil jwtUtil;
    @InjectMocks private AuthService authService;
    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setUsername("student1");
        testUser.setPassword("$2a$10$encoded");
        testUser.setNickname("\u5b66\u751f\u5c0f\u660e");
        testUser.setRole(1);
        testUser.setStatus(1);
    }

    // ========== Login ==========
    @Nested @DisplayName("\u767b\u5f55\u529f\u80fd")
    class LoginTests {
        @Test @DisplayName("TC01: \u5b66\u751f\u767b\u5f55\u6210\u529f")
        void tc01() {
            when(userMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(testUser);
            when(passwordEncoder.matches("123456", "$2a$10$encoded")).thenReturn(true);
            when(jwtUtil.generateToken(1L, "student1", "STUDENT")).thenReturn("mock-token");
            Map<String, Object> r = authService.login("student1", "123456");
            assertNotNull(r);
            assertEquals("mock-token", r.get("token"));
            assertNotNull(r.get("userInfo"));
        }

        @Test @DisplayName("TC02: \u7528\u6237\u4e0d\u5b58\u5728")
        void tc02() {
            when(userMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(null);
            BusinessException ex = assertThrows(BusinessException.class, () -> authService.login("x", "123456"));
            assertEquals("\u7528\u6237\u4e0d\u5b58\u5728", ex.getMessage());
        }

        @Test @DisplayName("TC03: \u5bc6\u7801\u9519\u8bef")
        void tc03() {
            when(userMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(testUser);
            when(passwordEncoder.matches("wrong", "$2a$10$encoded")).thenReturn(false);
            BusinessException ex = assertThrows(BusinessException.class, () -> authService.login("student1", "wrong"));
            assertEquals("\u5bc6\u7801\u9519\u8bef", ex.getMessage());
        }

        @Test @DisplayName("TC04: \u8d26\u53f7\u88ab\u7981\u7528")
        void tc04() {
            testUser.setStatus(0);
            when(userMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(testUser);
            when(passwordEncoder.matches("123456", "$2a$10$encoded")).thenReturn(true);
            BusinessException ex = assertThrows(BusinessException.class, () -> authService.login("student1", "123456"));
            assertEquals("\u8d26\u53f7\u5df2\u88ab\u7981\u7528", ex.getMessage());
        }

        @Test @DisplayName("TC05: \u7ba1\u7406\u5458\u767b\u5f55\u89d2\u8272\u6b63\u786e")
        void tc05() {
            testUser.setRole(2);
            when(userMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(testUser);
            when(passwordEncoder.matches("admin123", "$2a$10$encoded")).thenReturn(true);
            when(jwtUtil.generateToken(1L, "student1", "ADMIN")).thenReturn("admin-token");
            Map<String, Object> r = authService.login("student1", "admin123");
            assertEquals("admin-token", r.get("token"));
            verify(jwtUtil).generateToken(1L, "student1", "ADMIN");
        }

        @Test @DisplayName("TC01b: userInfo\u542b\u7528\u6237\u540d\u548c\u6635\u79f0")
        void tc01b() {
            when(userMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(testUser);
            when(passwordEncoder.matches("123456", "$2a$10$encoded")).thenReturn(true);
            when(jwtUtil.generateToken(1L, "student1", "STUDENT")).thenReturn("t");
            Map<String, Object> r = authService.login("student1", "123456");
            @SuppressWarnings("unchecked") Map<String, Object> ui = (Map<String, Object>) r.get("userInfo");
            assertEquals("student1", ui.get("username"));
            assertEquals("\u5b66\u751f\u5c0f\u660e", ui.get("nickname"));
            assertEquals(1, ui.get("role"));
        }

        @Test @DisplayName("TC01c: passwordEncoder\u8c03\u7528\u4e00\u6b21")
        void tc01c() {
            when(userMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(testUser);
            when(passwordEncoder.matches("123456", "$2a$10$encoded")).thenReturn(true);
            when(jwtUtil.generateToken(1L, "student1", "STUDENT")).thenReturn("t");
            authService.login("student1", "123456");
            verify(passwordEncoder, times(1)).matches("123456", "$2a$10$encoded");
            verify(jwtUtil, times(1)).generateToken(1L, "student1", "STUDENT");
        }

        @Test @DisplayName("TC02b: \u7528\u6237\u4e0d\u5b58\u5728\u4e0d\u8c03\u7528passwordEncoder")
        void tc02b() {
            when(userMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(null);
            assertThrows(BusinessException.class, () -> authService.login("x", "123456"));
            verify(passwordEncoder, never()).matches(anyString(), anyString());
            verify(jwtUtil, never()).generateToken(anyLong(), anyString(), anyString());
        }

        @Test @DisplayName("TC03b: \u5bc6\u7801\u9519\u8bef\u4e0d\u751f\u6210token")
        void tc03b() {
            when(userMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(testUser);
            when(passwordEncoder.matches("w", "$2a$10$encoded")).thenReturn(false);
            assertThrows(BusinessException.class, () -> authService.login("s", "w"));
            verify(jwtUtil, never()).generateToken(anyLong(), anyString(), anyString());
        }

        @Test @DisplayName("TC04b: \u8d26\u53f7\u7981\u7528\u5728\u5bc6\u7801\u6821\u9a8c\u540e")
        void tc04b() {
            testUser.setStatus(0);
            when(userMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(testUser);
            when(passwordEncoder.matches("123456", "$2a$10$encoded")).thenReturn(true);
            assertThrows(BusinessException.class, () -> authService.login("s", "123456"));
            verify(jwtUtil, never()).generateToken(anyLong(), anyString(), anyString());
        }

        @Test @DisplayName("TC05b: \u5b66\u751f\u89d2\u8272\u4e3aSTUDENT")
        void tc05b() {
            when(userMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(testUser);
            when(passwordEncoder.matches("123456", "$2a$10$encoded")).thenReturn(true);
            when(jwtUtil.generateToken(1L, "student1", "STUDENT")).thenReturn("t");
            authService.login("student1", "123456");
            verify(jwtUtil).generateToken(eq(1L), eq("student1"), eq("STUDENT"));
        }

        @Test @DisplayName("TC01d: token\u975e\u7a7a")
        void tc01d() {
            when(userMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(testUser);
            when(passwordEncoder.matches("123456", "$2a$10$encoded")).thenReturn(true);
            when(jwtUtil.generateToken(1L, "student1", "STUDENT")).thenReturn("tok");
            Map<String, Object> r = authService.login("student1", "123456");
            assertFalse(r.get("token").toString().isEmpty());
        }

        @Test @DisplayName("TC01e: userInfo\u542bid")
        void tc01e() {
            when(userMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(testUser);
            when(passwordEncoder.matches("123456", "$2a$10$encoded")).thenReturn(true);
            when(jwtUtil.generateToken(1L, "student1", "STUDENT")).thenReturn("t");
            Map<String, Object> r = authService.login("student1", "123456");
            @SuppressWarnings("unchecked") Map<String, Object> ui = (Map<String, Object>) r.get("userInfo");
            assertEquals(1L, ui.get("id"));
        }

        @Test @DisplayName("TC01f: selectOne\u8c03\u7528\u4e00\u6b21")
        void tc01f() {
            when(userMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(testUser);
            when(passwordEncoder.matches("123456", "$2a$10$encoded")).thenReturn(true);
            when(jwtUtil.generateToken(1L, "student1", "STUDENT")).thenReturn("t");
            authService.login("student1", "123456");
            verify(userMapper, times(1)).selectOne(any(LambdaQueryWrapper.class));
        }

        @Test @DisplayName("TC01g: \u7a7a\u5bc6\u7801\u9519\u8bef")
        void tc01g() {
            when(userMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(testUser);
            when(passwordEncoder.matches("", "$2a$10$encoded")).thenReturn(false);
            assertThrows(BusinessException.class, () -> authService.login("s", ""));
        }

        @Test @DisplayName("TC01h: \u7a7a\u7528\u6237\u540d\u67e5\u8be2")
        void tc01h() {
            when(userMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(null);
            assertThrows(BusinessException.class, () -> authService.login("", "123456"));
        }

        @Test @DisplayName("TC01i: result\u542b2\u4e2akey")
        void tc01i() {
            when(userMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(testUser);
            when(passwordEncoder.matches("123456", "$2a$10$encoded")).thenReturn(true);
            when(jwtUtil.generateToken(1L, "student1", "STUDENT")).thenReturn("t");
            Map<String, Object> r = authService.login("student1", "123456");
            assertTrue(r.containsKey("token"));
            assertTrue(r.containsKey("userInfo"));
        }

        @Test @DisplayName("TC01j: \u767b\u5f55\u540e\u4e0d\u8c03\u7528insert/update")
        void tc01j() {
            when(userMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(testUser);
            when(passwordEncoder.matches("123456", "$2a$10$encoded")).thenReturn(true);
            when(jwtUtil.generateToken(1L, "student1", "STUDENT")).thenReturn("t");
            authService.login("student1", "123456");
            verify(userMapper, never()).insert(any());
            verify(userMapper, never()).updateById(any());
        }

        @Test @DisplayName("TC01k: \u7279\u6b8a\u5b57\u7b26\u7528\u6237\u540d")
        void tc01k() {
            when(userMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(testUser);
            when(passwordEncoder.matches("p@ss!", "$2a$10$encoded")).thenReturn(true);
            when(jwtUtil.generateToken(1L, "student1", "STUDENT")).thenReturn("t");
            assertDoesNotThrow(() -> authService.login("student1", "p@ss!"));
        }

        @Test @DisplayName("TC01l: role=3\u6620\u5c04\u4e3aADMIN")
        void tc01l() {
            testUser.setRole(3);
            when(userMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(testUser);
            when(passwordEncoder.matches("pw", "$2a$10$encoded")).thenReturn(true);
            when(jwtUtil.generateToken(1L, "student1", "ADMIN")).thenReturn("t");
            authService.login("student1", "pw");
            verify(jwtUtil).generateToken(eq(1L), eq("student1"), eq("ADMIN"));
        }

        @Test @DisplayName("TC01m: status=-1\u53ef\u767b\u5f55")
        void tc01m() {
            testUser.setStatus(-1);
            when(userMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(testUser);
            when(passwordEncoder.matches("pw", "$2a$10$encoded")).thenReturn(true);
            when(jwtUtil.generateToken(1L, "student1", "STUDENT")).thenReturn("t");
            Map<String, Object> r = authService.login("student1", "pw");
            assertNotNull(r.get("token"));
        }

        @Test @DisplayName("TC01n: nickname\u4e3anull")
        void tc01n() {
            testUser.setNickname(null);
            when(userMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(testUser);
            when(passwordEncoder.matches("pw", "$2a$10$encoded")).thenReturn(true);
            when(jwtUtil.generateToken(1L, "student1", "STUDENT")).thenReturn("t");
            Map<String, Object> r = authService.login("student1", "pw");
            @SuppressWarnings("unchecked") Map<String, Object> ui = (Map<String, Object>) r.get("userInfo");
            assertNull(ui.get("nickname"));
        }

        @Test @DisplayName("TC01o: \u591a\u6b21\u767b\u5f55\u76f8\u540c\u7528\u6237")
        void tc01o() {
            when(userMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(testUser);
            when(passwordEncoder.matches("pw", "$2a$10$encoded")).thenReturn(true);
            when(jwtUtil.generateToken(1L, "student1", "STUDENT")).thenReturn("t");
            authService.login("student1", "pw");
            authService.login("student1", "pw");
            verify(userMapper, times(2)).selectOne(any(LambdaQueryWrapper.class));
        }
    }

    // ========== Register ==========
    @Nested @DisplayName("\u6ce8\u518c\u529f\u80fd")
    class RegisterTests {
        @Test @DisplayName("TC06: \u6ce8\u518c\u6210\u529f")
        void tc06() {
            when(userMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(0L);
            when(passwordEncoder.encode("123456")).thenReturn("$2a$10$encoded");
            when(userMapper.insert(any(User.class))).thenReturn(1);
            assertDoesNotThrow(() -> authService.register("newuser", "123456", "\u65b0\u7528\u6237", 1));
            verify(userMapper).insert(argThat(u -> {
                assertEquals("newuser", u.getUsername());
                assertEquals("$2a$10$encoded", u.getPassword());
                assertEquals("\u65b0\u7528\u6237", u.getNickname());
                assertEquals(1, u.getRole());
                assertEquals(1, u.getStatus());
                return true;
            }));
        }

        @Test @DisplayName("TC07: \u7528\u6237\u540d\u5df2\u5b58\u5728")
        void tc07() {
            when(userMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(1L);
            BusinessException ex = assertThrows(BusinessException.class, () -> authService.register("e", "1", "\u6635", 1));
            assertEquals("\u7528\u6237\u540d\u5df2\u5b58\u5728", ex.getMessage());
        }

        @Test @DisplayName("TC08: \u7ba1\u7406\u5458\u89d2\u8272\u7981\u6b62")
        void tc08() {
            BusinessException ex = assertThrows(BusinessException.class, () -> authService.register("h", "1", "\u9ed1", 2));
            assertEquals("\u6ce8\u518c\u89d2\u8272\u65e0\u6548", ex.getMessage());
        }

        @Test @DisplayName("TC06b: \u5bc6\u7801\u7ecf\u52a0\u5bc6")
        void tc06b() {
            when(userMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(0L);
            when(passwordEncoder.encode("mypw")).thenReturn("$2a$10$h");
            when(userMapper.insert(any(User.class))).thenReturn(1);
            authService.register("u1", "mypw", "\u6635", 1);
            verify(passwordEncoder).encode("mypw");
            verify(userMapper).insert(argThat(u -> "$2a$10$h".equals(u.getPassword())));
        }

        @Test @DisplayName("TC06c: \u9ed8\u8ba4status=1")
        void tc06c() {
            when(userMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(0L);
            when(passwordEncoder.encode("1")).thenReturn("$2a");
            when(userMapper.insert(any(User.class))).thenReturn(1);
            authService.register("u", "1", "\u6635", 1);
            verify(userMapper).insert(argThat(u -> u.getStatus() == 1));
        }

        @Test @DisplayName("TC07b: \u5b58\u5728\u4e0d\u63d2\u5165")
        void tc07b() {
            when(userMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(1L);
            assertThrows(BusinessException.class, () -> authService.register("e", "1", "\u6635", 1));
            verify(userMapper, never()).insert(any(User.class));
            verify(passwordEncoder, never()).encode(anyString());
        }

        @Test @DisplayName("TC08b: role=0\u65e0\u6548")
        void tc08b() {
            BusinessException ex = assertThrows(BusinessException.class, () -> authService.register("u", "1", "\u6635", 0));
            assertEquals("\u6ce8\u518c\u89d2\u8272\u65e0\u6548", ex.getMessage());
        }

        @Test @DisplayName("TC08c: role=null\u65e0\u6548")
        void tc08c() {
            BusinessException ex = assertThrows(BusinessException.class, () -> authService.register("u", "1", "\u6635", null));
            assertEquals("\u6ce8\u518c\u89d2\u8272\u65e0\u6548", ex.getMessage());
        }

        @Test @DisplayName("TC06d: insert\u8c03\u7528\u4e00\u6b21")
        void tc06d() {
            when(userMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(0L);
            when(passwordEncoder.encode("1")).thenReturn("$2a");
            when(userMapper.insert(any(User.class))).thenReturn(1);
            authService.register("u", "1", "\u6635", 1);
            verify(userMapper, times(1)).insert(any(User.class));
        }

        @Test @DisplayName("TC06e: selectCount\u8c03\u7528\u4e00\u6b21")
        void tc06e() {
            when(userMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(0L);
            when(passwordEncoder.encode("1")).thenReturn("$2a");
            when(userMapper.insert(any(User.class))).thenReturn(1);
            authService.register("u", "1", "\u6635", 1);
            verify(userMapper, times(1)).selectCount(any(LambdaQueryWrapper.class));
        }

        @Test @DisplayName("TC06f: username\u6b63\u786e\u8bbe\u7f6e")
        void tc06f() {
            when(userMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(0L);
            when(passwordEncoder.encode("1")).thenReturn("$2a");
            when(userMapper.insert(any(User.class))).thenReturn(1);
            authService.register("testUser", "1", "\u6635", 1);
            verify(userMapper).insert(argThat(u -> "testUser".equals(u.getUsername())));
        }

        @Test @DisplayName("TC06g: nickname\u6b63\u786e\u8bbe\u7f6e")
        void tc06g() {
            when(userMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(0L);
            when(passwordEncoder.encode("1")).thenReturn("$2a");
            when(userMapper.insert(any(User.class))).thenReturn(1);
            authService.register("u", "1", "\u6211\u7684\u6635\u79f0", 1);
            verify(userMapper).insert(argThat(u -> "\u6211\u7684\u6635\u79f0".equals(u.getNickname())));
        }

        @Test @DisplayName("TC08d: role=3\u65e0\u6548")
        void tc08d() {
            BusinessException ex = assertThrows(BusinessException.class, () -> authService.register("u", "1", "\u6635", 3));
            assertEquals("\u6ce8\u518c\u89d2\u8272\u65e0\u6548", ex.getMessage());
        }

        @Test @DisplayName("TC08e: role=-1\u65e0\u6548")
        void tc08e() {
            BusinessException ex = assertThrows(BusinessException.class, () -> authService.register("u", "1", "\u6635", -1));
            assertEquals("\u6ce8\u518c\u89d2\u8272\u65e0\u6548", ex.getMessage());
        }

        @Test @DisplayName("TC06h: \u6ce8\u518c\u4e0d\u8c03\u7528selectById")
        void tc06h() {
            when(userMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(0L);
            when(passwordEncoder.encode("1")).thenReturn("$2a");
            when(userMapper.insert(any(User.class))).thenReturn(1);
            authService.register("u", "1", "\u6635", 1);
            verify(userMapper, never()).selectById(any());
        }

        @Test @DisplayName("TC06i: \u6ce8\u518c\u4e0d\u8c03\u7528update")
        void tc06i() {
            when(userMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(0L);
            when(passwordEncoder.encode("1")).thenReturn("$2a");
            when(userMapper.insert(any(User.class))).thenReturn(1);
            authService.register("u", "1", "\u6635", 1);
            verify(userMapper, never()).updateById(any());
        }

        @Test @DisplayName("TC06j: \u7a7a\u7528\u6237\u540d\u6ce8\u518c")
        void tc06j() {
            when(userMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(0L);
            when(passwordEncoder.encode("1")).thenReturn("$2a");
            when(userMapper.insert(any(User.class))).thenReturn(1);
            assertDoesNotThrow(() -> authService.register("", "1", "\u6635", 1));
        }

        @Test @DisplayName("TC06k: \u7a7a\u5bc6\u7801\u6ce8\u518c")
        void tc06k() {
            when(userMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(0L);
            when(passwordEncoder.encode("")).thenReturn("$2a$hash");
            when(userMapper.insert(any(User.class))).thenReturn(1);
            assertDoesNotThrow(() -> authService.register("u", "", "\u6635", 1));
        }

        @Test @DisplayName("TC06l: \u6ce8\u518c\u65e0\u8fd4\u56de\u503c")
        void tc06l() {
            when(userMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(0L);
            when(passwordEncoder.encode("1")).thenReturn("$2a");
            when(userMapper.insert(any(User.class))).thenReturn(1);
            assertDoesNotThrow(() -> authService.register("u", "1", "\u6635", 1));
        }

        @Test @DisplayName("TC06m: \u5bc6\u7801\u957f\u5ea6\u65e0\u9650\u5236")
        void tc06m() {
            String longPw = "a".repeat(200);
            when(userMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(0L);
            when(passwordEncoder.encode(longPw)).thenReturn("$2a$hash");
            when(userMapper.insert(any(User.class))).thenReturn(1);
            assertDoesNotThrow(() -> authService.register("u", longPw, "\u6635", 1));
        }

        @Test @DisplayName("TC06n: selectCount\u8fd4\u56de0\u624d\u63d2\u5165")
        void tc06n() {
            when(userMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(0L);
            when(passwordEncoder.encode("1")).thenReturn("$2a");
            when(userMapper.insert(any(User.class))).thenReturn(1);
            authService.register("u", "1", "\u6635", 1);
            verify(userMapper).insert(any(User.class));
        }
    }

    // ========== GetCurrentUser ==========
    @Nested @DisplayName("\u83b7\u53d6\u5f53\u524d\u7528\u6237")
    class GetCurrentUserTests {
        @Test @DisplayName("TC09: \u83b7\u53d6\u6210\u529f\u5bc6\u7801\u8131\u654f")
        void tc09() {
            when(userMapper.selectById(1L)).thenReturn(testUser);
            User r = authService.getCurrentUser(1L);
            assertNotNull(r);
            assertNull(r.getPassword());
            assertEquals("student1", r.getUsername());
        }

        @Test @DisplayName("TC10: \u7528\u6237\u4e0d\u5b58\u5728")
        void tc10() {
            when(userMapper.selectById(999L)).thenReturn(null);
            BusinessException ex = assertThrows(BusinessException.class, () -> authService.getCurrentUser(999L));
            assertEquals("\u7528\u6237\u4e0d\u5b58\u5728", ex.getMessage());
        }

        @Test @DisplayName("TC09b: \u6635\u79f0\u4fdd\u7559")
        void tc09b() {
            when(userMapper.selectById(1L)).thenReturn(testUser);
            User r = authService.getCurrentUser(1L);
            assertEquals("\u5b66\u751f\u5c0f\u660e", r.getNickname());
            assertEquals(1L, r.getId());
            assertEquals(1, r.getRole());
        }

        @Test @DisplayName("TC09c: selectById\u8c03\u7528\u4e00\u6b21")
        void tc09c() {
            when(userMapper.selectById(1L)).thenReturn(testUser);
            authService.getCurrentUser(1L);
            verify(userMapper, times(1)).selectById(1L);
        }

        @Test @DisplayName("TC10b: \u4e0d\u5b58\u5728\u9a8c\u8bc1\u67e5\u8be2")
        void tc10b() {
            when(userMapper.selectById(888L)).thenReturn(null);
            assertThrows(BusinessException.class, () -> authService.getCurrentUser(888L));
            verify(userMapper).selectById(888L);
        }

        @Test @DisplayName("TC09d: \u83b7\u53d6\u7528\u6237\u4e0d\u8c03\u7528insert")
        void tc09d() {
            when(userMapper.selectById(1L)).thenReturn(testUser);
            authService.getCurrentUser(1L);
            verify(userMapper, never()).insert(any());
        }

        @Test @DisplayName("TC09e: \u83b7\u53d6\u7528\u6237\u4e0d\u8c03\u7528update")
        void tc09e() {
            when(userMapper.selectById(1L)).thenReturn(testUser);
            authService.getCurrentUser(1L);
            verify(userMapper, never()).updateById(any());
        }

        @Test @DisplayName("TC09f: \u83b7\u53d6\u7528\u6237\u4e0d\u8c03\u7528delete")
        void tc09f() {
            when(userMapper.selectById(1L)).thenReturn(testUser);
            authService.getCurrentUser(1L);
            verify(userMapper, never()).delete(any());
        }

        @Test @DisplayName("TC09g: \u83b7\u53d6\u7528\u6237\u4e0d\u8c03\u7528selectCount")
        void tc09g() {
            when(userMapper.selectById(1L)).thenReturn(testUser);
            authService.getCurrentUser(1L);
            verify(userMapper, never()).selectCount(any());
        }

        @Test @DisplayName("TC10c: \u4e0d\u5b58\u5728\u4e0d\u8c03\u7528update")
        void tc10c() {
            when(userMapper.selectById(999L)).thenReturn(null);
            assertThrows(BusinessException.class, () -> authService.getCurrentUser(999L));
            verify(userMapper, never()).updateById(any());
        }

        @Test @DisplayName("TC09h: \u8fd4\u56de\u7528\u6237id\u6b63\u786e")
        void tc09h() {
            when(userMapper.selectById(5L)).thenReturn(testUser);
            User r = authService.getCurrentUser(5L);
            assertEquals(1L, r.getId());
        }

        @Test @DisplayName("TC09i: \u83b7\u53d6\u7528\u6237\u4e0d\u8c03\u7528passwordEncoder")
        void tc09i() {
            when(userMapper.selectById(1L)).thenReturn(testUser);
            authService.getCurrentUser(1L);
            verify(passwordEncoder, never()).matches(anyString(), anyString());
            verify(passwordEncoder, never()).encode(anyString());
        }

        @Test @DisplayName("TC09j: \u83b7\u53d6\u7528\u6237\u4e0d\u8c03\u7528jwtUtil")
        void tc09j() {
            when(userMapper.selectById(1L)).thenReturn(testUser);
            authService.getCurrentUser(1L);
            verify(jwtUtil, never()).generateToken(anyLong(), anyString(), anyString());
        }

        @Test @DisplayName("TC09k: \u591a\u6b21\u83b7\u53d6\u76f8\u540c\u7528\u6237")
        void tc09k() {
            when(userMapper.selectById(1L)).thenReturn(testUser);
            authService.getCurrentUser(1L);
            authService.getCurrentUser(1L);
            verify(userMapper, times(2)).selectById(1L);
        }

        @Test @DisplayName("TC09l: role\u4fdd\u7559")
        void tc09l() {
            when(userMapper.selectById(1L)).thenReturn(testUser);
            User r = authService.getCurrentUser(1L);
            assertEquals(1, r.getRole());
        }

        @Test @DisplayName("TC09m: status\u4fdd\u7559")
        void tc09m() {
            when(userMapper.selectById(1L)).thenReturn(testUser);
            User r = authService.getCurrentUser(1L);
            assertEquals(1, r.getStatus());
        }

        @Test @DisplayName("TC09n: username\u4fdd\u7559")
        void tc09n() {
            when(userMapper.selectById(1L)).thenReturn(testUser);
            User r = authService.getCurrentUser(1L);
            assertEquals("student1", r.getUsername());
        }

        @Test @DisplayName("TC09o: \u83b7\u53d6\u7528\u6237\u65e0\u526f\u4f5c\u7528")
        void tc09o() {
            when(userMapper.selectById(1L)).thenReturn(testUser);
            assertDoesNotThrow(() -> authService.getCurrentUser(1L));
        }

        @Test @DisplayName("TC09p: \u83b7\u53d6\u7528\u6237\u8fd4\u56de\u540c\u4e00\u5bf9\u8c61")
        void tc09p() {
            when(userMapper.selectById(1L)).thenReturn(testUser);
            User r = authService.getCurrentUser(1L);
            assertSame(testUser, r);
        }

        @Test @DisplayName("TC09q: password\u8bbe\u7f6e\u4e3anull")
        void tc09q() {
            testUser.setPassword("secret");
            when(userMapper.selectById(1L)).thenReturn(testUser);
            User r = authService.getCurrentUser(1L);
            assertNull(r.getPassword());
        }
    }

    // ========== ChangePassword ==========
    @Nested @DisplayName("\u4fee\u6539\u5bc6\u7801")
    class ChangePasswordTests {
        @Test @DisplayName("TC11: \u4fee\u6539\u6210\u529f")
        void tc11() {
            when(userMapper.selectById(1L)).thenReturn(testUser);
            when(passwordEncoder.matches("old", "$2a$10$encoded")).thenReturn(true);
            when(passwordEncoder.encode("new")).thenReturn("$2a$10$newE");
            assertDoesNotThrow(() -> authService.changePassword(1L, "old", "new"));
            verify(userMapper).updateById(argThat(u -> "$2a$10$newE".equals(u.getPassword())));
        }

        @Test @DisplayName("TC12: \u539f\u5bc6\u7801\u9519\u8bef")
        void tc12() {
            when(userMapper.selectById(1L)).thenReturn(testUser);
            when(passwordEncoder.matches("bad", "$2a$10$encoded")).thenReturn(false);
            BusinessException ex = assertThrows(BusinessException.class, () -> authService.changePassword(1L, "bad", "new"));
            assertEquals("\u539f\u5bc6\u7801\u9519\u8bef", ex.getMessage());
        }

        @Test @DisplayName("TC11b: \u65b0\u5bc6\u7801\u52a0\u5bc6")
        void tc11b() {
            when(userMapper.selectById(1L)).thenReturn(testUser);
            when(passwordEncoder.matches("o", "$2a$10$encoded")).thenReturn(true);
            when(passwordEncoder.encode("bn")).thenReturn("$2a$10$bH");
            authService.changePassword(1L, "o", "bn");
            verify(passwordEncoder).encode("bn");
            verify(userMapper).updateById(argThat(u -> "$2a$10$bH".equals(u.getPassword())));
        }

        @Test @DisplayName("TC11c: updateById\u8c03\u7528\u4e00\u6b21")
        void tc11c() {
            when(userMapper.selectById(1L)).thenReturn(testUser);
            when(passwordEncoder.matches("o", "$2a$10$encoded")).thenReturn(true);
            when(passwordEncoder.encode("n")).thenReturn("$2a");
            authService.changePassword(1L, "o", "n");
            verify(userMapper, times(1)).updateById(any(User.class));
        }

        @Test @DisplayName("TC12b: \u539f\u5bc6\u7801\u9519\u4e0d\u66f4\u65b0")
        void tc12b() {
            when(userMapper.selectById(1L)).thenReturn(testUser);
            when(passwordEncoder.matches("b", "$2a$10$encoded")).thenReturn(false);
            assertThrows(BusinessException.class, () -> authService.changePassword(1L, "b", "n"));
            verify(userMapper, never()).updateById(any(User.class));
            verify(passwordEncoder, never()).encode(anyString());
        }

        @Test @DisplayName("TC11d: matches\u8c03\u7528\u4e00\u6b21")
        void tc11d() {
            when(userMapper.selectById(1L)).thenReturn(testUser);
            when(passwordEncoder.matches("o", "$2a$10$encoded")).thenReturn(true);
            when(passwordEncoder.encode("n")).thenReturn("$2a");
            authService.changePassword(1L, "o", "n");
            verify(passwordEncoder, times(1)).matches("o", "$2a$10$encoded");
        }

        @Test @DisplayName("TC11e: selectById\u8c03\u7528\u4e00\u6b21")
        void tc11e() {
            when(userMapper.selectById(1L)).thenReturn(testUser);
            when(passwordEncoder.matches("o", "$2a$10$encoded")).thenReturn(true);
            when(passwordEncoder.encode("n")).thenReturn("$2a");
            authService.changePassword(1L, "o", "n");
            verify(userMapper, times(1)).selectById(1L);
        }

        @Test @DisplayName("TC11f: \u4fee\u6539\u5bc6\u7801\u4e0d\u8c03\u7528insert")
        void tc11f() {
            when(userMapper.selectById(1L)).thenReturn(testUser);
            when(passwordEncoder.matches("o", "$2a$10$encoded")).thenReturn(true);
            when(passwordEncoder.encode("n")).thenReturn("$2a");
            authService.changePassword(1L, "o", "n");
            verify(userMapper, never()).insert(any());
        }

        @Test @DisplayName("TC11g: \u4fee\u6539\u5bc6\u7801\u4e0d\u8c03\u7528delete")
        void tc11g() {
            when(userMapper.selectById(1L)).thenReturn(testUser);
            when(passwordEncoder.matches("o", "$2a$10$encoded")).thenReturn(true);
            when(passwordEncoder.encode("n")).thenReturn("$2a");
            authService.changePassword(1L, "o", "n");
            verify(userMapper, never()).delete(any());
        }

        @Test @DisplayName("TC11h: \u4fee\u6539\u5bc6\u7801\u4e0d\u8c03\u7528selectCount")
        void tc11h() {
            when(userMapper.selectById(1L)).thenReturn(testUser);
            when(passwordEncoder.matches("o", "$2a$10$encoded")).thenReturn(true);
            when(passwordEncoder.encode("n")).thenReturn("$2a");
            authService.changePassword(1L, "o", "n");
            verify(userMapper, never()).selectCount(any());
        }

        @Test @DisplayName("TC11i: \u4fee\u6539\u5bc6\u7801\u4e0d\u8c03\u7528jwtUtil")
        void tc11i() {
            when(userMapper.selectById(1L)).thenReturn(testUser);
            when(passwordEncoder.matches("o", "$2a$10$encoded")).thenReturn(true);
            when(passwordEncoder.encode("n")).thenReturn("$2a");
            authService.changePassword(1L, "o", "n");
            verify(jwtUtil, never()).generateToken(anyLong(), anyString(), anyString());
        }

        @Test @DisplayName("TC12c: \u539f\u5bc6\u7801\u9519\u4e0d\u8c03\u7528selectCount")
        void tc12c() {
            when(userMapper.selectById(1L)).thenReturn(testUser);
            when(passwordEncoder.matches("b", "$2a$10$encoded")).thenReturn(false);
            assertThrows(BusinessException.class, () -> authService.changePassword(1L, "b", "n"));
            verify(userMapper, never()).selectCount(any());
        }

        @Test @DisplayName("TC12d: \u539f\u5bc6\u7801\u9519\u4e0d\u8c03\u7528jwtUtil")
        void tc12d() {
            when(userMapper.selectById(1L)).thenReturn(testUser);
            when(passwordEncoder.matches("b", "$2a$10$encoded")).thenReturn(false);
            assertThrows(BusinessException.class, () -> authService.changePassword(1L, "b", "n"));
            verify(jwtUtil, never()).generateToken(anyLong(), anyString(), anyString());
        }

        @Test @DisplayName("TC11j: \u65b0\u65e7\u5bc6\u7801\u76f8\u540c\u4e5f\u53ef\u4fee\u6539")
        void tc11j() {
            when(userMapper.selectById(1L)).thenReturn(testUser);
            when(passwordEncoder.matches("same", "$2a$10$encoded")).thenReturn(true);
            when(passwordEncoder.encode("same")).thenReturn("$2a$10$encoded");
            assertDoesNotThrow(() -> authService.changePassword(1L, "same", "same"));
        }

        @Test @DisplayName("TC11k: \u4fee\u6539\u540e\u5bc6\u7801\u5b57\u6bb5\u66f4\u65b0")
        void tc11k() {
            when(userMapper.selectById(1L)).thenReturn(testUser);
            when(passwordEncoder.matches("o", "$2a$10$encoded")).thenReturn(true);
            when(passwordEncoder.encode("n")).thenReturn("$2a$new");
            authService.changePassword(1L, "o", "n");
            assertEquals("$2a$new", testUser.getPassword());
        }

        @Test @DisplayName("TC11l: \u4fee\u6539\u5bc6\u7801\u65e0\u8fd4\u56de\u503c")
        void tc11l() {
            when(userMapper.selectById(1L)).thenReturn(testUser);
            when(passwordEncoder.matches("o", "$2a$10$encoded")).thenReturn(true);
            when(passwordEncoder.encode("n")).thenReturn("$2a");
            assertDoesNotThrow(() -> authService.changePassword(1L, "o", "n"));
        }

        @Test @DisplayName("TC11m: \u7a7a\u65b0\u5bc6\u7801")
        void tc11m() {
            when(userMapper.selectById(1L)).thenReturn(testUser);
            when(passwordEncoder.matches("o", "$2a$10$encoded")).thenReturn(true);
            when(passwordEncoder.encode("")).thenReturn("$2a$empty");
            assertDoesNotThrow(() -> authService.changePassword(1L, "o", ""));
        }

        @Test @DisplayName("TC11n: \u957f\u5bc6\u7801")
        void tc11n() {
            String longPw = "x".repeat(200);
            when(userMapper.selectById(1L)).thenReturn(testUser);
            when(passwordEncoder.matches("o", "$2a$10$encoded")).thenReturn(true);
            when(passwordEncoder.encode(longPw)).thenReturn("$2a$long");
            assertDoesNotThrow(() -> authService.changePassword(1L, "o", longPw));
        }

        @Test @DisplayName("TC11o: 多次修改密码")
        void tc11o() {
            when(userMapper.selectById(1L)).thenReturn(testUser);
            when(passwordEncoder.matches(eq("o"), anyString())).thenReturn(true);
            when(passwordEncoder.encode(anyString())).thenReturn("$2a$n");
            authService.changePassword(1L, "o", "n1");
            authService.changePassword(1L, "o", "n2");
            verify(userMapper, times(2)).updateById(any(User.class));
        }

        @Test @DisplayName("TC11p: \u4fee\u6539\u5bc6\u7801\u4e0d\u8c03\u7528selectOne")
        void tc11p() {
            when(userMapper.selectById(1L)).thenReturn(testUser);
            when(passwordEncoder.matches("o", "$2a$10$encoded")).thenReturn(true);
            when(passwordEncoder.encode("n")).thenReturn("$2a");
            authService.changePassword(1L, "o", "n");
            verify(userMapper, never()).selectOne(any());
        }
    }
}
