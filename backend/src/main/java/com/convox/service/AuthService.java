package com.convox.service;

import com.convox.dto.request.LoginRequest;
import com.convox.dto.request.RegisterRequest;
import com.convox.dto.response.AuthResponse;

public interface AuthService {
    AuthResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
    AuthResponse verifyEmail(String email, String code);
    void resendOtp(String email);
    void forgotPassword(String email);
    void resetPassword(String email, String code, String newPassword);
}
