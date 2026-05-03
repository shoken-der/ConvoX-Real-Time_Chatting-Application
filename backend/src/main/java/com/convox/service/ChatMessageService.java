package com.convox.service;

import com.convox.dto.request.MessageRequest;
import com.convox.dto.response.MessageResponse;
import java.util.List;

public interface ChatMessageService {
    MessageResponse createMessage(MessageRequest request);
    List<MessageResponse> getMessages(Long chatRoomId, int page, int limit);
    MessageResponse toggleReaction(Long messageId, Long userId, String emoji);
    MessageResponse editMessage(Long messageId, String text);
    MessageResponse deleteMessage(Long messageId, Long userId);
    MessageResponse markMessageSeen(Long messageId, Long userId);
}
