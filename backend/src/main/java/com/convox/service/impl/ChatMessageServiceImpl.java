package com.convox.service.impl;

import com.convox.dto.request.MessageRequest;
import com.convox.dto.response.MessageResponse;
import com.convox.entity.*;
import com.convox.mapper.EntityMapper;
import com.convox.repository.*;
import com.convox.service.ChatMessageService;
import com.convox.service.ChatRoomService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ChatMessageServiceImpl implements ChatMessageService {

    @Autowired
    private ChatMessageRepository messageRepository;

    @Autowired
    private ChatRoomRepository chatRoomRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ReactionRepository reactionRepository;

    @Autowired
    private ChatRoomService chatRoomService;

    @Autowired
    private EntityMapper entityMapper;

    @Override
    public MessageResponse createMessage(MessageRequest request) {
        ChatRoom room = chatRoomRepository.findById(request.getChatRoomId()).orElseThrow();
        User sender = userRepository.findById(request.getSenderId()).orElseThrow();

        // Unhide for everyone when a new message is sent
        chatRoomService.unhideChatRoomForAll(room.getId());

        ChatMessage message = ChatMessage.builder()
                .chatRoom(room)
                .sender(sender)
                .content(request.getContent())
                .imageUrl(request.getImageUrl())
                .fileType(request.getFileType())
                .fileSize(request.getFileSize())
                .isEdited(false)
                .isDeleted(false)
                .build();

        if (request.getReplyToId() != null) {
            message.setReplyTo(messageRepository.findById(request.getReplyToId()).orElse(null));
        }

        ChatMessage saved = messageRepository.save(message);
        MessageResponse response = entityMapper.toMessageResponse(saved);
        response.setTempId(request.getTempId());
        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public List<MessageResponse> getMessages(Long chatRoomId, int page, int limit) {
        return messageRepository.findAllByChatRoomIdOrderByCreatedAtDesc(chatRoomId, PageRequest.of(page, limit))
                .getContent().stream()
                .map(entityMapper::toMessageResponse)
                .collect(Collectors.toList());
    }

    @Autowired
    private jakarta.persistence.EntityManager entityManager;

    @Override
    @Transactional
    public MessageResponse toggleReaction(Long messageId, Long userId, String emoji) {
        Optional<Reaction> existing = reactionRepository.findByMessageIdAndUserId(messageId, userId);

        if (existing.isPresent()) {
            Reaction oldReaction = existing.get();
            boolean isSameEmoji = oldReaction.getEmoji().equals(emoji);
            
            // In both cases (swap or remove), we delete the existing one
            reactionRepository.deleteByMessageIdAndUserId(messageId, userId);
            
            // If it was a different emoji, add the new one
            if (!isSameEmoji) {
                createNewReaction(messageId, userId, emoji);
            }
        } else {
            // No existing reaction, just add the new one
            createNewReaction(messageId, userId, emoji);
        }
        
        reactionRepository.flush();
        // Force reload with reactions to ensure we have the absolute latest state from DB
        ChatMessage updated = messageRepository.findByIdWithReactions(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found after update"));
        
        MessageResponse response = entityMapper.toMessageResponse(updated);

        return response;
    }

    @Override
    public MessageResponse editMessage(Long messageId, String text) {
        ChatMessage message = messageRepository.findById(messageId).orElseThrow();
        message.setContent(text);
        message.setEdited(true);
        return entityMapper.toMessageResponse(messageRepository.save(message));
    }

    @Override
    public MessageResponse deleteMessage(Long messageId, Long userId) {
        ChatMessage message = messageRepository.findById(messageId).orElseThrow();
        
        // Security check: only the sender can delete their message
        if (!message.getSender().getId().equals(userId)) {
            throw new RuntimeException("You are not authorized to delete this message");
        }
        
        message.setDeleted(true);
        message.setContent("This message was deleted");
        message.setImageUrl(null);
        return entityMapper.toMessageResponse(messageRepository.save(message));
    }

    @Override
    @Transactional
    public MessageResponse markMessageSeen(Long messageId, Long userId) {
        ChatMessage message = messageRepository.findById(messageId).orElseThrow();
        User user = userRepository.findById(userId).orElseThrow();
        message.getSeenBy().add(user);
        return entityMapper.toMessageResponse(messageRepository.save(message));
    }

    private void createNewReaction(Long messageId, Long userId, String emoji) {
        ChatMessage message = messageRepository.findById(messageId).orElseThrow(() -> new RuntimeException("Message not found"));
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        Reaction reaction = Reaction.builder()
                .message(message)
                .user(user)
                .emoji(emoji)
                .build();
        reactionRepository.save(reaction);
    }
}
