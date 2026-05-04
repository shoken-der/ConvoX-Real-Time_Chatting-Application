package com.convox.controller;

import com.convox.dto.request.MessageRequest;
import com.convox.dto.response.MessageResponse;
import com.convox.service.ChatMessageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/message")
public class MessageController {

    @Autowired
    private ChatMessageService messageService;

    @Autowired
    private org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate;

    @PostMapping
    public ResponseEntity<MessageResponse> createMessage(@RequestBody MessageRequest request) {
        MessageResponse response = messageService.createMessage(request);
        
        // Broadcast to chat room for real-time message delivery
        messagingTemplate.convertAndSend("/topic/chat/" + response.getChatRoomId(), response);
        
        // Broadcast to specific user for sidebar/unread updates
        if (request.getReceiverId() != null) {
            messagingTemplate.convertAndSend("/topic/user/" + request.getReceiverId(), response);
        }
        
        return ResponseEntity.status(201).body(response);
    }

    @GetMapping("/{chatRoomId}")
    public ResponseEntity<List<MessageResponse>> getMessages(
            @PathVariable Long chatRoomId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int limit) {
        return ResponseEntity.ok(messageService.getMessages(chatRoomId, page, limit));
    }

    @PostMapping("/{messageId}/react")
    public ResponseEntity<MessageResponse> toggleReaction(
            @PathVariable Long messageId, @RequestBody Map<String, Object> payload) {
        Long userId = Long.valueOf(payload.get("userId").toString());
        String emoji = payload.get("emoji").toString();
        return ResponseEntity.ok(messageService.toggleReaction(messageId, userId, emoji));
    }

    @PutMapping("/{messageId}")
    public ResponseEntity<MessageResponse> editMessage(
            @PathVariable Long messageId, @RequestBody Map<String, String> payload) {
        return ResponseEntity.ok(messageService.editMessage(messageId, payload.get("text")));
    }

    @DeleteMapping("/{messageId}")
    public ResponseEntity<MessageResponse> deleteMessage(
            @PathVariable Long messageId, @RequestParam Long userId) {
        return ResponseEntity.ok(messageService.deleteMessage(messageId, userId));
    }

    @PatchMapping("/{messageId}/seen")
    public ResponseEntity<MessageResponse> markSeen(
            @PathVariable Long messageId, @RequestBody Map<String, Object> payload) {
        Long userId = Long.valueOf(payload.get("userId").toString());
        MessageResponse response = messageService.markMessageSeen(messageId, userId);
        
        // Broadcast seen status
        response.setType("SEEN");
        response.setMessageId(messageId);
        messagingTemplate.convertAndSend("/topic/chat/" + response.getChatRoomId(), response);
        
        return ResponseEntity.ok(response);
    }
}
