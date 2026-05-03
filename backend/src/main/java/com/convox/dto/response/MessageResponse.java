package com.convox.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import java.time.LocalDateTime;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MessageResponse {
    private Long id;
    private String tempId;
    private Long chatRoomId;
    private Long sender;
    private String senderName;
    private String content;
    private String imageUrl;
    private String fileType;
    private Long fileSize;
    private MessageResponse replyTo;
    private Set<Long> seenBy;
    
    @JsonProperty("isEdited")
    private boolean isEdited;
    
    @JsonProperty("isDeleted")
    private boolean isDeleted;
    
    private LocalDateTime createdAt;
    private Set<ReactionResponse> reactions;
}
