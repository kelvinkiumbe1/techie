package com.ispticket.service;

import com.ispticket.dto.NoteRequest;
import com.ispticket.dto.FieldUpdateRequest;
import com.ispticket.dto.TicketRequest;
import com.ispticket.dto.TicketResponse;
import com.ispticket.exception.NotFoundException;
import com.ispticket.model.*;
import com.ispticket.model.enums.Category;
import com.ispticket.model.enums.Status;
import com.ispticket.model.enums.TechStatus;
import com.ispticket.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TicketService {

    private final TicketRepository ticketRepository;
    private final CustomerRepository customerRepository;
    private final TechnicianRepository technicianRepository;
    private final TicketNoteRepository ticketNoteRepository;

    @Value("${ticket.escalation.unassigned-minutes:60}")
    private long escalationThresholdMinutes;

    /**
     * Intake: log a new request. Category + starting priority are derived
     * automatically from the issue type, so whoever answers the phone/social/
     * walk-in doesn't have to know the routing rules — this is the "auto-route
     * to the right team" behaviour.
     */
    @Transactional
    public TicketResponse createTicket(TicketRequest req) {
        Customer customer = customerRepository.findFirstByPhone(req.getCustomerPhone())
                .orElseGet(() -> new Customer(req.getCustomerName(), req.getCustomerPhone(), req.getCustomerLocation()));
        // keep latest known name/location even for a returning customer
        customer.setName(req.getCustomerName());
        if (req.getCustomerLocation() != null && !req.getCustomerLocation().isBlank()) {
            customer.setLocation(req.getCustomerLocation());
        }
        customer = customerRepository.save(customer);

        Ticket ticket = new Ticket();
        ticket.setCustomer(customer);
        ticket.setChannel(req.getChannel());
        ticket.setIssueType(req.getIssueType());
        ticket.setCategory(req.getIssueType().getDefaultCategory());
        ticket.setPriority(req.getIssueType().getDefaultPriority());
        ticket.setDescription(req.getDescription());
        ticket.setStatus(Status.NEW);
        ticket.setCreatedBy(req.getCreatedBy());
        ticket.setCreatedAt(LocalDateTime.now());
        ticket.setUpdatedAt(LocalDateTime.now());

        ticket = ticketRepository.save(ticket);
        return TicketResponse.from(ticket, escalationThresholdMinutes);
    }

    public List<TicketResponse> getQueue(Category category) {
        return ticketRepository.findByCategoryOrderByPriorityDescCreatedAtAsc(category)
                .stream()
                .filter(t -> t.getStatus() != Status.RESOLVED && t.getStatus() != Status.CANCELLED)
                .map(t -> TicketResponse.from(t, escalationThresholdMinutes))
                .collect(Collectors.toList());
    }

    public List<TicketResponse> getAllActive() {
        return ticketRepository.findByStatusNotOrderByCreatedAtDesc(Status.CANCELLED)
                .stream()
                .map(t -> TicketResponse.from(t, escalationThresholdMinutes))
                // escalated + urgent first, so the dashboard's "what's about to be forgotten" view leads
                .sorted(Comparator.comparing((TicketResponse t) -> !t.isEscalated())
                        .thenComparing(t -> t.getCreatedAt()))
                .collect(Collectors.toList());
    }

    public List<TicketResponse> getVisibleFor(com.ispticket.model.AppUser user) {
        if (user.getRole() == com.ispticket.model.enums.Role.ADMIN) return getAllActive();
        if (user.getTechnicianId() == null) return List.of();
        return ticketRepository.findByCategoryOrderByPriorityDescCreatedAtAsc(user.getTeamCategory()).stream()
                .filter(t -> t.getStatus() != Status.CANCELLED &&
                        (t.getAssignedTechnician() == null || t.getAssignedTechnician().getId().equals(user.getTechnicianId())))
                .map(t -> TicketResponse.from(t, escalationThresholdMinutes)).collect(Collectors.toList());
    }

    public List<TicketResponse> getEscalated() {
        return getAllActive().stream().filter(TicketResponse::isEscalated).collect(Collectors.toList());
    }

    @Transactional
    public TicketResponse assign(Long ticketId, Long technicianId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new NotFoundException("Ticket " + ticketId + " not found"));
        Technician tech = technicianRepository.findById(technicianId)
                .orElseThrow(() -> new NotFoundException("Technician " + technicianId + " not found"));

        if (!tech.getTeam().getCategory().equals(ticket.getCategory())) {
            throw new IllegalArgumentException(
                    "Technician is on " + tech.getTeam().getCategory() + " team, ticket needs " + ticket.getCategory());
        }
        if (tech.getStatus() == TechStatus.OFF) {
            throw new IllegalArgumentException("Technician is disabled and cannot receive tasks");
        }

        ticket.setAssignedTechnician(tech);
        ticket.setStatus(Status.ASSIGNED);
        tech.setStatus(TechStatus.BUSY);
        technicianRepository.save(tech);
        ticket = ticketRepository.save(ticket);
        return TicketResponse.from(ticket, escalationThresholdMinutes);
    }

    @Transactional
    public TicketResponse updateForAdmin(Long ticketId, com.ispticket.dto.TicketUpdateRequest request) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new NotFoundException("Ticket " + ticketId + " not found"));
        if (request.getDescription() != null) ticket.setDescription(request.getDescription().trim());
        if (request.getPriority() != null) ticket.setPriority(request.getPriority());
        if (request.getTechnicianId() != null) {
            if (request.getTechnicianId() == 0) {
                ticket.setAssignedTechnician(null);
            } else {
                assign(ticketId, request.getTechnicianId());
                ticket = ticketRepository.findById(ticketId).orElseThrow();
            }
        }
        if (request.getStatus() != null) updateStatus(ticketId, request.getStatus());
        return TicketResponse.from(ticketRepository.save(ticket), escalationThresholdMinutes);
    }

    @Transactional
    public TicketResponse updateStatus(Long ticketId, Status newStatus) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new NotFoundException("Ticket " + ticketId + " not found"));
        ticket.setStatus(newStatus);
        if (newStatus == Status.RESOLVED) {
            ticket.setResolvedAt(LocalDateTime.now());
            if (ticket.getAssignedTechnician() != null) {
                Technician tech = ticket.getAssignedTechnician();
                tech.setStatus(TechStatus.AVAILABLE);
                technicianRepository.save(tech);
            }

        }
        ticket = ticketRepository.save(ticket);
        return TicketResponse.from(ticket, escalationThresholdMinutes);
    }

    @Transactional
    public TicketResponse updateStatusForUser(Long ticketId, Status status, com.ispticket.model.AppUser user) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new NotFoundException("Ticket " + ticketId + " not found"));
        if (user.getRole() != com.ispticket.model.enums.Role.ADMIN &&
                (ticket.getAssignedTechnician() == null || !ticket.getAssignedTechnician().getId().equals(user.getTechnicianId())))
            throw new IllegalArgumentException("Technicians may only update assigned tickets");
        return updateStatus(ticketId, status);
    }

    @Transactional
    public TicketResponse startWork(Long ticketId, AppUser user) {
        Ticket ticket = assignedTicket(ticketId, user);
        if (ticket.getWorkStartedAt() == null) ticket.setWorkStartedAt(LocalDateTime.now());
        if (ticket.getStatus() == Status.ASSIGNED) ticket.setStatus(Status.IN_PROGRESS);
        return TicketResponse.from(ticketRepository.save(ticket), escalationThresholdMinutes);
    }

    @Transactional
    public TicketResponse stopWork(Long ticketId, AppUser user) {
        Ticket ticket = assignedTicket(ticketId, user);
        if (ticket.getWorkStartedAt() == null) throw new IllegalArgumentException("Work has not been started");
        if (ticket.getWorkEndedAt() == null) {
            ticket.setWorkEndedAt(LocalDateTime.now());
            ticket.setWorkDurationMinutes(java.time.Duration.between(ticket.getWorkStartedAt(), ticket.getWorkEndedAt()).toMinutes());
        }
        return TicketResponse.from(ticketRepository.save(ticket), escalationThresholdMinutes);
    }

    @Transactional
    public TicketResponse fieldUpdate(Long ticketId, FieldUpdateRequest request, AppUser user) {
        Ticket ticket = assignedTicket(ticketId, user);
        if (request.getDescription() != null) ticket.setDescription(request.getDescription().trim());
        if (request.getStatus() != null) updateStatus(ticketId, request.getStatus());
        if (request.getNote() != null && !request.getNote().isBlank()) {
            TicketNote note = new TicketNote();
            note.setTicket(ticket);
            note.setAuthor(user.getUsername());
            note.setNote(request.getNote().trim());
            ticketNoteRepository.save(note);
        }
        return TicketResponse.from(ticketRepository.findById(ticketId).orElseThrow(), escalationThresholdMinutes);
    }

    private Ticket assignedTicket(Long ticketId, AppUser user) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new NotFoundException("Ticket " + ticketId + " not found"));
        if (user.getRole() != com.ispticket.model.enums.Role.ADMIN &&
                (ticket.getAssignedTechnician() == null || !ticket.getAssignedTechnician().getId().equals(user.getTechnicianId())))
            throw new IllegalArgumentException("Technicians may only update assigned tickets");
        return ticket;
    }

    @Transactional
    public void addNote(Long ticketId, NoteRequest req) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new NotFoundException("Ticket " + ticketId + " not found"));
        TicketNote note = new TicketNote();
        note.setTicket(ticket);
        note.setAuthor(req.getAuthor());
        note.setNote(req.getNote());
        note.setPhotoUrl(req.getPhotoUrl());
        ticketNoteRepository.save(note);
    }

    public List<TicketNote> getNotes(Long ticketId) {
        return ticketNoteRepository.findByTicketIdOrderByCreatedAtAsc(ticketId);
    }
}
