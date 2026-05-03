package com.convox.mapper;

import com.convox.dto.response.*;
import com.convox.entity.*;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.stream.Collectors;

@Component
public class EntityMapper {

    public UserResponse toUserResponse(User user) {
        if (user == null) return null;
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .displayName(user.getDisplayName())
                .photoUrl(user.getPhotoUrl())
                .profileCompleted(user.isProfileCompleted())
                .enabled(user.isEnabled())
                .lastSeen(user.getLastSeen())
                .createdAt(user.getCreatedAt())
                .build();
    }

    public MessageResponse toMessageResponse(ChatMessage message) {
        if (message == null) return null;
        return MessageResponse.builder()
                .id(message.getId())
                .chatRoomId(message.getChatRoom().getId())
                .sender(message.getSender().getId())
                .senderName(message.getSender().getDisplayName())
                .content(message.getContent())
                .imageUrl(message.getImageUrl())
                .fileType(message.getFileType())
                .fileSize(message.getFileSize())
                .replyTo(toMessageResponse(message.getReplyTo()))
                .reactions(message.getReactions() != null ? 
                    message.getReactions().stream().map(this::toReactionResponse).collect(Collectors.toSet()) : 
                    Collections.emptySet())
                .seenBy(message.getSeenBy() != null ? 
                    message.getSeenBy().stream().map(User::getId).collect(Collectors.toSet()) : 
                    Collections.emptySet())
                .isEdited(message.isEdited())
                .isDeleted(message.isDeleted())
                .createdAt(message.getCreatedAt())
                .build();
    }

    public ReactionResponse toReactionResponse(Reaction reaction) {
        if (reaction == null) return null;
        return ReactionResponse.builder()
                .id(reaction.getId())
                .userId(reaction.getUser().getId())
                .emoji(reaction.getEmoji())
                .build();
    }

    public ChatRoomResponse toChatRoomResponse(ChatRoom room) {
        if (room == null) return null;
        return ChatRoomResponse.builder()
                .id(room.getId())
                .members(room.getMembers().stream().map(this::toUserResponse).collect(Collectors.toSet()))
                .createdAt(room.getCreatedAt())
                .updatedAt(room.getUpdatedAt())
                .build();
    }
}
