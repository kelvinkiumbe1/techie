package com.ispticket.repository;

import com.ispticket.model.DirectMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DirectMessageRepository extends JpaRepository<DirectMessage, Long> {
    List<DirectMessage> findByRecipientTechnicianIdOrderByCreatedAtAsc(Long technicianId);
}
