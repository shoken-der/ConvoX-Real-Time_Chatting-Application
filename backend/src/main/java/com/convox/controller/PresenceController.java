package com.convox.controller;

import com.convox.service.PresenceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Set;

@RestController
@RequestMapping("/api/presence")
public class PresenceController {

    @Autowired
    private PresenceService presenceService;

    @Autowired
    private org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate;

    @GetMapping("/online")
    public ResponseEntity<Set<Long>> getOnlineUsers() {
        return ResponseEntity.ok(presenceService.getOnlineUsers());
    }

    @org.springframework.web.bind.annotation.PostMapping("/offline")
    public ResponseEntity<Void> markOffline(@org.springframework.security.core.annotation.AuthenticationPrincipal com.convox.security.UserPrincipal principal) {
        if (principal != null) {
            presenceService.markOffline(principal.getId());
            // Broadcast offline status via WebSocket
            java.util.Map<String, Object> payload = new java.util.HashMap<>();
            payload.put("userId", principal.getId());
            payload.put("online", false);
            payload.put("lastSeen", java.time.LocalDateTime.now());
            messagingTemplate.convertAndSend("/topic/presence", payload);
        }
        return ResponseEntity.ok().build();
    }
}
