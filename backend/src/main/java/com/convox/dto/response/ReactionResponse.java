package com.convox.dto.response;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReactionResponse {
    private Long id;
    private Long userId;
    private String emoji;
}
