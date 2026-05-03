package com.convox.controller;

import com.convox.dto.request.ChatRoomRequest;
import com.convox.dto.response.ChatRoomResponse;
import com.convox.service.ChatRoomService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/room")
public class ChatRoomController {

    @Autowired
    private ChatRoomService chatRoomService;

    @PostMapping
    public ResponseEntity<ChatRoomResponse> createChatRoom(@RequestBody ChatRoomRequest request) {
        return ResponseEntity.status(201).body(chatRoomService.createChatRoom(request));
    }

    @GetMapping("/{userId}")
    public ResponseEntity<List<ChatRoomResponse>> getChatRooms(@PathVariable Long userId) {
        return ResponseEntity.ok(chatRoomService.getChatRoomsOfUser(userId));
    }

    @GetMapping("/{firstUserId}/{secondUserId}")
    public ResponseEntity<ChatRoomResponse> getChatRoomOfUsers(
            @PathVariable Long firstUserId, @PathVariable Long secondUserId) {
        return ResponseEntity.ok(chatRoomService.getChatRoomOfUsers(firstUserId, secondUserId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteChatRoom(@PathVariable Long id) {
        chatRoomService.deleteChatRoom(id);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{id}/hide")
    public ResponseEntity<Void> hideChatRoom(@PathVariable Long id, @RequestParam Long userId) {
        chatRoomService.hideChatRoom(id, userId);
        return ResponseEntity.ok().build();
    }
}
