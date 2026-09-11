package com.ispticket.repository;

import com.ispticket.model.Ticket;
import com.ispticket.model.enums.Category;
import com.ispticket.model.enums.Status;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TicketRepository extends JpaRepository<Ticket, Long> {

    List<Ticket> findByCategoryOrderByPriorityDescCreatedAtAsc(Category category);

    List<Ticket> findByStatusNotOrderByCreatedAtDesc(Status excludedStatus);

    List<Ticket> findByAssignedTechnicianIdAndStatusNotOrderByCreatedAtAsc(Long technicianId, Status excludedStatus);
    List<Ticket> findByAssignedTechnicianId(Long technicianId);
}
