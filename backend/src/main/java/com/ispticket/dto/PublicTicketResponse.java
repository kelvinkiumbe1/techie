package com.ispticket.dto;

import com.ispticket.model.Ticket;
import com.ispticket.model.enums.Priority;
import com.ispticket.model.enums.Status;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class PublicTicketResponse {
    private final Long id;
    private final Status status;
    private final Priority priority;
    private final String category;
    private final String issueType;
    private final String description;
    private final LocalDateTime createdAt;
    private final LocalDateTime updatedAt;
    private final LocalDateTime resolvedAt;

    private PublicTicketResponse(Ticket ticket) {
        id = ticket.getId();
        status = ticket.getStatus();
        priority = ticket.getPriority();
        category = ticket.getCategory().name();
        issueType = ticket.getIssueType().name();
        description = ticket.getDescription();
        createdAt = ticket.getCreatedAt();
        updatedAt = ticket.getUpdatedAt();
        resolvedAt = ticket.getResolvedAt();
    }

    public static PublicTicketResponse from(Ticket ticket) {
        return new PublicTicketResponse(ticket);
    }
}
