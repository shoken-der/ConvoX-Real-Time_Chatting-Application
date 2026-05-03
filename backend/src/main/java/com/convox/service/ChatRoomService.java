package com.convox.service;

import com.convox.dto.request.ChatRoomRequest;
import com.convox.dto.response.ChatRoomResponse;
import java.util.List;

public interface ChatRoomService {
    ChatRoomResponse createChatRoom(ChatRoomRequest request);
    List<ChatRoomResponse> getChatRoomsOfUser(Long userId);
    ChatRoomResponse getChatRoomOfUsers(Long firstUserId, Long secondUserId);
    void deleteChatRoom(Long id);
    void hideChatRoom(Long roomId, Long userId);
    void unhideChatRoomForAll(Long roomId);
}
