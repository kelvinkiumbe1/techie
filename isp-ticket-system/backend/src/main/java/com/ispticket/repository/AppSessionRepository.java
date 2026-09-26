package com.ispticket.repository;

import com.ispticket.model.AppSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.Optional;

public interface AppSessionRepository extends JpaRepository<AppSession, Long> {
    Optional<AppSession> findByTokenHashAndExpiresAtAfter(String tokenHash, LocalDateTime now);
    void deleteByTokenHash(String tokenHash);
    void deleteByUserId(Long userId);
}
