package com.convox.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @org.springframework.beans.factory.annotation.Value("${spring.mail.username}")
    private String fromEmail;

    @Async
    public void sendVerificationEmail(String to, String code) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("ConvoX Team <" + fromEmail + ">");
            message.setTo(to);
            message.setSubject("Verify your ConvoX Account");
            message.setText("Welcome to ConvoX!\n\n" +
                    "Your verification code is: " + code + "\n\n" +
                    "This code will expire in 10 minutes.\n\n" +
                    "If you did not request this code, please ignore this email.");
            
            mailSender.send(message);
        } catch (Exception e) {
            throw new RuntimeException("We couldn't send the code to your Gmail. Please check your connection or try again later.");
        }
    }
}
