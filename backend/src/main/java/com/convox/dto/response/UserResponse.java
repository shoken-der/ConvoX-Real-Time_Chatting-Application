package com.convox.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserResponse {
    private Long id;
    private String email;
    private String displayName;
    private String photoUrl;
    private boolean profileCompleted;
    private LocalDateTime lastSeen;
    private boolean online;
    private boolean enabled;
    private LocalDateTime createdAt;
}
