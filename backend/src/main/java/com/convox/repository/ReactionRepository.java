package com.convox.repository;

import com.convox.entity.Reaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;
import java.util.Optional;

@Repository
public interface ReactionRepository extends JpaRepository<Reaction, Long> {
    Optional<Reaction> findByMessageIdAndUserIdAndEmoji(Long messageId, Long userId, String emoji);
    Optional<Reaction> findByMessageIdAndUserId(Long messageId, Long userId);
    
    @Modifying(clearAutomatically = true)
    @Transactional
    @Query("DELETE FROM Reaction r WHERE r.message.id = :messageId AND r.user.id = :userId")
    void deleteByMessageIdAndUserId(Long messageId, Long userId);
}
