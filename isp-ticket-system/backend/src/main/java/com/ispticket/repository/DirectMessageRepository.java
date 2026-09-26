package com.ispticket.repository;

import com.ispticket.model.DirectMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface DirectMessageRepository extends JpaRepository<DirectMessage, Long> {
    List<DirectMessage> findByRecipientTechnicianIdOrderByCreatedAtAsc(Long technicianId);
    List<DirectMessage> findByRecipientTechnicianIdAndDeletedFalseOrderByCreatedAtAsc(Long technicianId);
    @Query("""
        select m from DirectMessage m
        where (m.recipientTechnicianId = :target and (m.senderTechnicianId = :current or m.senderTechnicianId is null))
           or (m.recipientTechnicianId = :current and m.senderTechnicianId = :target)
        order by m.createdAt asc
        """)
    List<DirectMessage> findConversation(@Param("target") Long target, @Param("current") Long current);
    @Query("""
        select m from DirectMessage m
        where m.deleted = false and ((m.recipientTechnicianId = :target and (m.senderTechnicianId = :current or m.senderTechnicianId is null))
           or (m.recipientTechnicianId = :current and m.senderTechnicianId = :target))
        order by m.createdAt asc
        """)
    List<DirectMessage> findConversationNotDeleted(@Param("target") Long target, @Param("current") Long current);
    long countByReadFalseAndSenderTechnicianIdIsNotNull();
    long countByReadFalseAndRecipientTechnicianIdAndSenderTechnicianIdNot(Long recipientTechnicianId, Long senderTechnicianId);
    List<DirectMessage> findByRecipientTechnicianIdAndReadFalse(Long recipientTechnicianId);
}
