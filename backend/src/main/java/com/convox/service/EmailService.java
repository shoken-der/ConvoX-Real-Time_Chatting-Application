package com.convox.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import java.net.HttpURLConnection;
import java.net.URL;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

@Service
public class EmailService {

    @Value("${BREVO_API_KEY:}")
    private String brevoApiKey;

    @Value("${MAIL_USERNAME:}")
    private String fromEmail;

    @Async
    public void sendVerificationEmail(String to, String code) {
        if (brevoApiKey == null || brevoApiKey.isEmpty()) {
            System.err.println("BREVO_API_KEY is missing! Cannot send email.");
            return;
        }

        try {
            URL url = new URL("https://api.brevo.com/v3/smtp/email");
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("api-key", brevoApiKey);
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setDoOutput(true);

            String jsonPayload = "{"
                + "\"sender\":{\"name\":\"ConvoX Team\",\"email\":\"" + fromEmail + "\"},"
                + "\"to\":[{\"email\":\"" + to + "\"}],"
                + "\"subject\":\"Verify your ConvoX Account\","
                + "\"textContent\":\"Welcome to ConvoX! Your verification code is: " + code + "\""
                + "}";

            try (OutputStream os = conn.getOutputStream()) {
                byte[] input = jsonPayload.getBytes(StandardCharsets.UTF_8);
                os.write(input, 0, input.length);
            }

            int responseCode = conn.getResponseCode();
            if (responseCode >= 200 && responseCode < 300) {
                System.out.println("Email sent successfully via Brevo API!");
            } else {
                java.util.Scanner s = new java.util.Scanner(conn.getErrorStream()).useDelimiter("\\A");
                String errorBody = s.hasNext() ? s.next() : "";
                System.err.println("Brevo API error: " + responseCode + " - Body: " + errorBody);
            }
        } catch (Exception e) {
            System.err.println("REST EMAIL ERROR: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
