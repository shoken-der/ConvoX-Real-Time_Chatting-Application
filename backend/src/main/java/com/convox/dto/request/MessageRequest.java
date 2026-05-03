package com.convox.dto.request;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MessageRequest {
    private String tempId;
    private Long receiverId;
    private Long chatRoomId;
    private Long senderId;
    private String content;
    private String imageUrl;
    private String fileType;
    private Long fileSize;
    private Long replyToId;
}
