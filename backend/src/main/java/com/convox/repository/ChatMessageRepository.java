package com.convox.repository;

import com.convox.entity.ChatMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    @Query("SELECT m FROM ChatMessage m JOIN FETCH m.sender JOIN FETCH m.chatRoom WHERE m.chatRoom.id = :chatRoomId ORDER BY m.createdAt DESC")
    Page<ChatMessage> findAllByChatRoomIdOrderByCreatedAtDesc(@Param("chatRoomId") Long chatRoomId, Pageable pageable);
    
    @Query("SELECT m FROM ChatMessage m JOIN FETCH m.sender JOIN FETCH m.chatRoom WHERE m.chatRoom.id = :chatRoomId ORDER BY m.createdAt DESC")
    List<ChatMessage> findFirstByChatRoomId(@Param("chatRoomId") Long chatRoomId, Pageable pageable);

    @Query("SELECT COUNT(m) FROM ChatMessage m WHERE m.chatRoom.id = :roomId " +
           "AND m.sender.id != :userId AND NOT EXISTS (SELECT 1 FROM m.seenBy s WHERE s.id = :userId) AND m.isDeleted = false")
    long countUnreadMessages(@Param("roomId") Long roomId, @Param("userId") Long userId);

    @Query("SELECT m FROM ChatMessage m LEFT JOIN FETCH m.reactions WHERE m.id = :id")
    java.util.Optional<ChatMessage> findByIdWithReactions(@Param("id") Long id);

    @Query("SELECT m FROM ChatMessage m JOIN FETCH m.sender JOIN FETCH m.chatRoom WHERE m.id IN (" +
           "SELECT MAX(m2.id) FROM ChatMessage m2 WHERE m2.chatRoom.id IN :roomIds GROUP BY m2.chatRoom.id" +
           ")")
    List<ChatMessage> findLastMessagesForRooms(@Param("roomIds") List<Long> roomIds);

    @Query("SELECT m.chatRoom.id, COUNT(m) FROM ChatMessage m WHERE m.chatRoom.id IN :roomIds " +
           "AND m.sender.id != :userId AND NOT EXISTS (SELECT 1 FROM m.seenBy s WHERE s.id = :userId) AND m.isDeleted = false " +
           "GROUP BY m.chatRoom.id")
    List<Object[]> countUnreadMessagesForRooms(@Param("roomIds") List<Long> roomIds, @Param("userId") Long userId);

    void deleteAllByChatRoomId(Long chatRoomId);
}
