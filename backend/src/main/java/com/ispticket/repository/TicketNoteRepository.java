package com.ispticket.repository;

import com.ispticket.model.TicketNote;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TicketNoteRepository extends JpaRepository<TicketNote, Long> {
    List<TicketNote> findByTicketIdOrderByCreatedAtAsc(Long ticketId);
    Optional<TicketNote> findByAttachmentUrl(String attachmentUrl);
}
