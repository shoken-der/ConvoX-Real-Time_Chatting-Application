package com.convox.controller;

import com.convox.dto.response.MessageResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.Map;

@Controller
public class ChatWebSocketController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/chat.sendMessage")
    public void sendMessage(@Payload Map<String, Object> message) {
        messagingTemplate.convertAndSend("/topic/chat/" + message.get("chatRoomId"), message);
        if (message.containsKey("receiverId")) {
            messagingTemplate.convertAndSend("/topic/user/" + message.get("receiverId"), message);
        }
    }

    @MessageMapping("/chat.typing")
    public void typing(@Payload Map<String, Object> payload) {
        messagingTemplate.convertAndSend("/topic/chat/" + payload.get("chatRoomId") + "/typing", payload);
    }

    @MessageMapping("/chat.stopTyping")
    public void stopTyping(@Payload Map<String, Object> payload) {
        messagingTemplate.convertAndSend("/topic/chat/" + payload.get("chatRoomId") + "/typing", payload);
    }

    @MessageMapping("/chat.reaction")
    public void reaction(@Payload Map<String, Object> payload) {
        messagingTemplate.convertAndSend("/topic/chat/" + payload.get("chatRoomId"), payload);
    }

    @MessageMapping("/chat.editMessage")
    public void editMessage(@Payload Map<String, Object> payload) {
        messagingTemplate.convertAndSend("/topic/chat/" + payload.get("chatRoomId"), payload);
    }

    @MessageMapping("/chat.deleteMessage")
    public void deleteMessage(@Payload Map<String, Object> payload) {
        messagingTemplate.convertAndSend("/topic/chat/" + payload.get("chatRoomId"), payload);
    }

    @MessageMapping("/chat.markSeen")
    public void markSeen(@Payload Map<String, Object> payload) {
        messagingTemplate.convertAndSend("/topic/chat/" + payload.get("chatRoomId"), payload);
    }
}
