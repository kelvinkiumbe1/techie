package com.ispticket.repository;

import com.ispticket.model.TicketRating;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TicketRatingRepository extends JpaRepository<TicketRating, Long> {
    Optional<TicketRating> findByTicketId(Long ticketId);
}
