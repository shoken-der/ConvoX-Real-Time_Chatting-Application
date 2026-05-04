package com.convox.service.impl;

import com.convox.dto.request.LoginRequest;
import com.convox.dto.request.RegisterRequest;
import com.convox.dto.response.AuthResponse;
import com.convox.dto.response.UserResponse;
import com.convox.entity.User;
import com.convox.entity.OtpCode;
import com.convox.mapper.EntityMapper;
import com.convox.repository.UserRepository;
import com.convox.security.JwtTokenProvider;
import com.convox.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@org.springframework.transaction.annotation.Transactional
public class AuthServiceImpl implements AuthService {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private EntityMapper entityMapper;

    @Autowired
    private com.convox.service.EmailService emailService;

    @Autowired
    private com.convox.repository.OtpCodeRepository otpCodeRepository;

    @Override
    public AuthResponse register(RegisterRequest request) {
        // 1. Check if a fully verified user already exists
        userRepository.findByEmail(request.getEmail()).ifPresent(user -> {
            if (user.isEnabled()) {
                throw new RuntimeException("This Gmail address is already registered. Please sign in instead.");
            }
        });

        // 2. If we reach here, the user either doesn't exist OR is unverified (enabled = false)
        // Now do the slow work (Password hashing takes ~300ms-500ms)
        String encodedPassword = passwordEncoder.encode(request.getPassword());
        
        sendOtp(request.getEmail(), encodedPassword);
        
        return AuthResponse.builder()
                .message("Verification code sent to your Gmail.")
                .build();
    }

    private void saveOtp(String email, String code, String tempPassword) {
        // Find existing or create new
        OtpCode otpCode = otpCodeRepository.findTopByEmailOrderByCreatedAtDesc(email)
                .orElse(new OtpCode());
        
        otpCode.setEmail(email);
        otpCode.setCode(code);
        otpCode.setTempPassword(tempPassword);
        otpCode.setExpiresAt(java.time.LocalDateTime.now().plusMinutes(10));
        
        otpCodeRepository.save(otpCode);
    }

    @Override
    public void verifyEmail(String email, String code) {
        OtpCode otp = otpCodeRepository.findTopByEmailOrderByCreatedAtDesc(email)
                .orElseThrow(() -> new RuntimeException("We couldn't find a verification code for this email. Please try registering again."));
        
        if (otp.getExpiresAt().isBefore(java.time.LocalDateTime.now())) {
            throw new RuntimeException("Your verification code has expired. Please click 'Resend' to get a new one.");
        }
        
        if (!otp.getCode().equals(code)) {
            throw new RuntimeException("The code you entered is incorrect. Please check your Gmail and try again.");
        }
        
        // NOW we create the user officially if they don't exist
        if (!userRepository.existsByEmail(email)) {
            User user = User.builder()
                    .email(email)
                    .password(otp.getTempPassword())
                    .enabled(true)
                    .profileCompleted(false)
                    .build();
            userRepository.save(user);
        } else {
            User user = userRepository.findByEmail(email).get();
            user.setEnabled(true);
            user.setPassword(otp.getTempPassword()); // Sync password from latest registration attempt
            userRepository.save(user);
        }
        
        otpCodeRepository.deleteByEmail(email);
    }

    @Override
    public void resendOtp(String email) {
        OtpCode lastOtp = otpCodeRepository.findTopByEmailOrderByCreatedAtDesc(email)
                .orElse(null);
        
        String tempPass = (lastOtp != null) ? lastOtp.getTempPassword() : null;
        sendOtp(email, tempPass);
    }

    @Override
    public void forgotPassword(String email) {
        if (!userRepository.existsByEmail(email)) {
            throw new RuntimeException("We couldn't find an account with this Gmail address. Please check for typos or register.");
        }
        sendOtp(email, null);
    }

    private void sendOtp(String email, String tempPassword) {
        String code = String.format("%06d", new java.util.Random().nextInt(1000000));
        emailService.sendVerificationEmail(email, code);
        saveOtp(email, code, tempPassword);
    }

    @Override
    public void resetPassword(String email, String code, String newPassword) {
        OtpCode otp = otpCodeRepository.findTopByEmailOrderByCreatedAtDesc(email)
                .orElseThrow(() -> new RuntimeException("Verification session not found. Please request a new reset code."));
        
        if (otp.getExpiresAt().isBefore(java.time.LocalDateTime.now())) {
            throw new RuntimeException("Your reset code has expired. Please request a new one.");
        }
        
        if (!otp.getCode().equals(code)) {
            throw new RuntimeException("The reset code is incorrect. Please check your Gmail carefully.");
        }
        
        User user = userRepository.findByEmail(email).orElseThrow();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        
        otpCodeRepository.deleteByEmail(email);
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("We couldn't find an account with that Gmail address."));
        
        if (!user.isEnabled()) {
            throw new RuntimeException("Your account isn't verified yet. Please verify your Gmail to continue.");
        }

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = tokenProvider.generateToken(authentication);

        return AuthResponse.builder()
                .token(jwt)
                .user(entityMapper.toUserResponse(user))
                .build();
    }
}
