package com.convox.service.impl;

import com.convox.dto.request.ChatRoomRequest;
import com.convox.dto.response.ChatRoomResponse;
import com.convox.dto.response.MessageResponse;
import com.convox.entity.ChatMessage;
import com.convox.entity.ChatRoom;
import com.convox.entity.User;
import com.convox.mapper.EntityMapper;
import com.convox.repository.ChatMessageRepository;
import com.convox.repository.ChatRoomRepository;
import com.convox.repository.UserRepository;
import com.convox.service.ChatRoomService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional
public class ChatRoomServiceImpl implements ChatRoomService {

    @Autowired
    private ChatRoomRepository chatRoomRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ChatMessageRepository messageRepository;

    @Autowired
    private EntityMapper entityMapper;

    @Override
    public ChatRoomResponse createChatRoom(ChatRoomRequest request) {
        List<ChatRoom> existing = chatRoomRepository.findByMembers(request.getSenderId(), request.getReceiverId());
        if (!existing.isEmpty()) {
            return enrichRoom(existing.get(0), request.getSenderId());
        }

        User sender = userRepository.findById(request.getSenderId()).orElseThrow();
        User receiver = userRepository.findById(request.getReceiverId()).orElseThrow();

        Set<User> members = new HashSet<>();
        members.add(sender);
        members.add(receiver);

        ChatRoom room = ChatRoom.builder().members(members).build();
        ChatRoom saved = chatRoomRepository.save(room);

        return enrichRoom(saved, request.getSenderId());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ChatRoomResponse> getChatRoomsOfUser(Long userId) {
        List<ChatRoom> rooms = chatRoomRepository.findAllByUserId(userId);

        
        List<ChatRoom> visibleRooms = rooms.stream()
                .filter(room -> room.getHiddenByUsers() == null || !room.getHiddenByUsers().contains(userId))
                .collect(Collectors.toList());

        if (visibleRooms.isEmpty()) {

            return new java.util.ArrayList<>();
        }

        List<Long> roomIds = visibleRooms.stream().map(ChatRoom::getId).collect(Collectors.toList());

        List<ChatMessage> lastMessages = messageRepository.findLastMessagesForRooms(roomIds);
        java.util.Map<Long, ChatMessage> lastMessageMap = lastMessages.stream()
                .collect(Collectors.toMap(m -> m.getChatRoom().getId(), m -> m));

        List<Object[]> unreadCounts = messageRepository.countUnreadMessagesForRooms(roomIds, userId);
        java.util.Map<Long, Long> unreadCountMap = unreadCounts.stream()
                .collect(Collectors.toMap(
                        obj -> (Long) obj[0],
                        obj -> (Long) obj[1]
                ));

        List<ChatRoomResponse> filtered = visibleRooms.stream()
                .map(room -> {
                    ChatRoomResponse response = entityMapper.toChatRoomResponse(room);
                    ChatMessage lastMsg = lastMessageMap.get(room.getId());
                    response.setLastMessage(lastMsg != null ? entityMapper.toMessageResponse(lastMsg) : null);
                    response.setUnreadCount(unreadCountMap.getOrDefault(room.getId(), 0L));
                    return response;
                })
                .sorted((r1, r2) -> {
                    java.time.LocalDateTime date1 = r1.getLastMessage() != null ? r1.getLastMessage().getCreatedAt() : r1.getUpdatedAt();
                    java.time.LocalDateTime date2 = r2.getLastMessage() != null ? r2.getLastMessage().getCreatedAt() : r2.getUpdatedAt();
                    if (date1 == null && date2 == null) return 0;
                    if (date1 == null) return 1;
                    if (date2 == null) return -1;
                    return date2.compareTo(date1);
                })
                .collect(Collectors.toList());
        

        return filtered;
    }

    @Override
    @Transactional(readOnly = true)
    public ChatRoomResponse getChatRoomOfUsers(Long firstUserId, Long secondUserId) {
        List<ChatRoom> existing = chatRoomRepository.findByMembers(firstUserId, secondUserId);
        if (existing.isEmpty()) {
            throw new RuntimeException("Chat room not found");
        }
        return enrichRoom(existing.get(0), firstUserId);
    }

    @Override
    @Transactional
    public void deleteChatRoom(Long id) {
        // Manually delete messages first to avoid FK constraint issues
        messageRepository.deleteAllByChatRoomId(id);
        chatRoomRepository.deleteById(id);
    }

    @Override
    public void hideChatRoom(Long roomId, Long userId) {
        ChatRoom room = chatRoomRepository.findById(roomId).orElseThrow();
        if (room.getHiddenByUsers() == null) {
            room.setHiddenByUsers(new HashSet<>());
        }
        room.getHiddenByUsers().add(userId);
        chatRoomRepository.save(room);
    }

    @Override
    public void unhideChatRoomForAll(Long roomId) {
        ChatRoom room = chatRoomRepository.findById(roomId).orElseThrow();
        if (room.getHiddenByUsers() != null && !room.getHiddenByUsers().isEmpty()) {
            room.getHiddenByUsers().clear();
            chatRoomRepository.save(room);
        }
    }

    private ChatRoomResponse enrichRoom(ChatRoom room, Long userId) {
        ChatRoomResponse response = entityMapper.toChatRoomResponse(room);
        
        List<ChatMessage> lastMsgs = messageRepository.findFirstByChatRoomId(room.getId(), org.springframework.data.domain.PageRequest.of(0, 1));
        MessageResponse lastMessage = lastMsgs.isEmpty() ? null : entityMapper.toMessageResponse(lastMsgs.get(0));
        response.setLastMessage(lastMessage);
        
        long unreadCount = messageRepository.countUnreadMessages(room.getId(), userId);
        response.setUnreadCount(unreadCount);
        
        return response;
    }
}
