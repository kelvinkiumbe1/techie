package com.ispticket.dto;

import com.ispticket.model.Ticket;
import com.ispticket.model.enums.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Duration;
import java.time.LocalDateTime;

@Getter
@Setter
public class TicketResponse {
    private Long id;
    private String customerName;
    private String customerPhone;
    private String customerLocation;
    private Channel channel;
    private Category category;
    private IssueType issueType;
    private String description;
    private Status status;
    private Priority priority;
    private Long assignedTechnicianId;
    private String assignedTechnicianName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime resolvedAt;
    private String createdBy;
    private long minutesOpen;
    private boolean escalated;
    private LocalDateTime workStartedAt;
    private LocalDateTime workEndedAt;
    private Long workDurationMinutes;

    public static TicketResponse from(Ticket t, long escalationThresholdMinutes) {
        TicketResponse r = new TicketResponse();
        r.setId(t.getId());
        r.setCustomerName(t.getCustomer().getName());
        r.setCustomerPhone(t.getCustomer().getPhone());
        r.setCustomerLocation(t.getCustomer().getLocation());
        r.setChannel(t.getChannel());
        r.setCategory(t.getCategory());
        r.setIssueType(t.getIssueType());
        r.setDescription(t.getDescription());
        r.setStatus(t.getStatus());
        r.setPriority(t.getPriority());
        if (t.getAssignedTechnician() != null) {
            r.setAssignedTechnicianId(t.getAssignedTechnician().getId());
            r.setAssignedTechnicianName(t.getAssignedTechnician().getName());
        }
        r.setCreatedAt(t.getCreatedAt());
        r.setUpdatedAt(t.getUpdatedAt());
        r.setResolvedAt(t.getResolvedAt());
        r.setCreatedBy(t.getCreatedBy());

        long minutesOpen = Duration.between(t.getCreatedAt(), LocalDateTime.now()).toMinutes();
        r.setMinutesOpen(minutesOpen);

        boolean stillOpen = t.getStatus() == Status.NEW || t.getStatus() == Status.ASSIGNED || t.getStatus() == Status.IN_PROGRESS;
        // Urgent tickets (e.g. fiber cuts) escalate at half the normal threshold — they can't wait as long.
        long threshold = t.getPriority() == Priority.URGENT ? escalationThresholdMinutes / 2 : escalationThresholdMinutes;
        r.setEscalated(stillOpen && t.getStatus() != Status.IN_PROGRESS && minutesOpen >= threshold);
        r.setWorkStartedAt(t.getWorkStartedAt());
        r.setWorkEndedAt(t.getWorkEndedAt());
        r.setWorkDurationMinutes(t.getWorkDurationMinutes());

        return r;
    }
}
