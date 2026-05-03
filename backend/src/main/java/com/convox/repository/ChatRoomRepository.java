package com.convox.repository;

import com.convox.entity.ChatRoom;
import com.convox.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChatRoomRepository extends JpaRepository<ChatRoom, Long> {
    
    @Query("SELECT r FROM ChatRoom r JOIN r.members m WHERE m.id = :userId")
    List<ChatRoom> findAllByUserId(@Param("userId") Long userId);

    @Query("SELECT r FROM ChatRoom r JOIN r.members m1 JOIN r.members m2 " +
           "WHERE m1.id = :userId1 AND m2.id = :userId2 AND size(r.members) = 2 " +
           "ORDER BY r.updatedAt DESC")
    List<ChatRoom> findByMembers(@Param("userId1") Long userId1, @Param("userId2") Long userId2);
}
