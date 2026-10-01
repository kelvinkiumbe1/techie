package com.ispticket.controller;

import com.ispticket.dto.*;
import com.ispticket.model.Ticket;
import com.ispticket.model.TicketRating;
import com.ispticket.model.enums.Channel;
import com.ispticket.model.enums.Status;
import com.ispticket.repository.CustomerRepository;
import com.ispticket.repository.TicketRatingRepository;
import com.ispticket.repository.TicketRepository;
import com.ispticket.service.TicketService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
public class PublicTicketController {
    private final TicketService ticketService;
    private final TicketRepository tickets;
    private final CustomerRepository customers;
    private final TicketRatingRepository ratings;

    @PostMapping("/tickets")
    @ResponseStatus(HttpStatus.CREATED)
    public PublicTicketResponse submit(@Valid @RequestBody PublicTicketRequest request) {
        TicketRequest internal = new TicketRequest();
        internal.setCustomerName(request.getCustomerName().trim());
        internal.setCustomerPhone(request.getCustomerPhone().trim());
        internal.setCustomerLocation(request.getCustomerLocation());
        internal.setIssueType(request.getIssueType());
        internal.setDescription(request.getDescription());
        internal.setChannel(Channel.SOCIAL);
        internal.setCreatedBy("customer-portal");
        TicketResponse created = ticketService.createTicket(internal);
        Ticket ticket = tickets.findById(created.getId())
                .orElseThrow(() -> new IllegalStateException("Created ticket could not be retrieved"));
        return PublicTicketResponse.from(ticket);
    }

    @GetMapping("/tickets/track")
    public List<PublicTicketResponse> track(@RequestParam String phone) {
        String normalizedPhone = phone.trim();
        if (normalizedPhone.isBlank()) throw new IllegalArgumentException("Phone number is required");
        return customers.findFirstByPhone(normalizedPhone)
                .map(customer -> tickets.findByCustomerIdOrderByCreatedAtDesc(customer.getId()).stream()
                        .map(PublicTicketResponse::from).toList())
                .orElse(List.of());
    }

    @PostMapping("/tickets/{id}/rate")
    public TicketRating rate(@PathVariable Long id, @Valid @RequestBody RatingRequest request) {
        Ticket ticket = tickets.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Ticket not found"));
        if (!ticket.getCustomer().getPhone().equals(request.getCustomerPhone().trim()))
            throw new IllegalArgumentException("Phone number does not match ticket customer");
        if (ticket.getStatus() != Status.RESOLVED)
            throw new IllegalArgumentException("Only resolved tickets can be rated");
        if (ratings.findByTicketId(id).isPresent())
            throw new IllegalArgumentException("This ticket has already been rated");
        TicketRating rating = new TicketRating();
        rating.setTicket(ticket);
        rating.setRating(request.getRating());
        rating.setFeedback(request.getFeedback());
        rating.setCustomerPhone(request.getCustomerPhone().trim());
        return ratings.save(rating);
    }

    @GetMapping("/tickets/{id}/rating")
    public TicketRating getRating(@PathVariable Long id, @RequestParam String phone) {
        TicketRating rating = ratings.findByTicketId(id)
                .orElseThrow(() -> new IllegalArgumentException("Rating not found"));
        if (!rating.getCustomerPhone().equals(phone.trim()))
            throw new IllegalArgumentException("Phone number does not match rating");
        return rating;
    }
}
