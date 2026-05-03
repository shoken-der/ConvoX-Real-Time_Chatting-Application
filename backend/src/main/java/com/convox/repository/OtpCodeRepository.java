package com.convox.repository;

import com.convox.entity.OtpCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.jpa.repository.Modifying;
import java.util.Optional;

@Repository
public interface OtpCodeRepository extends JpaRepository<OtpCode, Long> {
    Optional<OtpCode> findByEmail(String email);
    Optional<OtpCode> findTopByEmailOrderByCreatedAtDesc(String email);

    @Transactional
    @Modifying
    void deleteByEmail(String email);
}
