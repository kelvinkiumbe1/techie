package com.ispticket.controller;

import com.ispticket.dto.*;
import com.ispticket.model.TicketNote;
import com.ispticket.model.enums.Category;
import com.ispticket.model.enums.Status;
import com.ispticket.service.TicketService;
import com.ispticket.service.AuthService;
import com.ispticket.model.AppUser;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;
    private final AuthService authService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TicketResponse create(@RequestHeader(value = "X-Auth-Token", required = false) String token,
                                 @Valid @RequestBody TicketRequest request) {
        authService.authenticate(token);
        return ticketService.createTicket(request);
    }

    @GetMapping
    public List<TicketResponse> getAll(@RequestHeader(value = "X-Auth-Token", required = false) String token) {
        return ticketService.getVisibleFor(authService.authenticate(token));
    }

    @GetMapping("/queue/{category}")
    public List<TicketResponse> getQueue(@PathVariable Category category) {
        return ticketService.getQueue(category);
    }

    @GetMapping("/escalated")
    public List<TicketResponse> getEscalated(@RequestHeader(value = "X-Auth-Token", required = false) String token) {
        return ticketService.getVisibleFor(authService.authenticate(token)).stream()
                .filter(TicketResponse::isEscalated).toList();
    }

    @PatchMapping("/{id}/assign")
    public TicketResponse assign(@RequestHeader(value = "X-Auth-Token", required = false) String token,
                                 @PathVariable Long id, @Valid @RequestBody AssignRequest request) {
        if (authService.authenticate(token).getRole() != com.ispticket.model.enums.Role.ADMIN)
            throw new IllegalArgumentException("Only admins can assign tickets");
        return ticketService.assign(id, request.getTechnicianId());
    }

    @PatchMapping("/{id}")
    public TicketResponse adminUpdate(@RequestHeader(value = "X-Auth-Token", required = false) String token,
                                      @PathVariable Long id, @RequestBody TicketUpdateRequest request) {
        if (authService.authenticate(token).getRole() != com.ispticket.model.enums.Role.ADMIN)
            throw new IllegalArgumentException("Only admins can edit tickets");
        return ticketService.updateForAdmin(id, request);
    }

    @PatchMapping("/{id}/status")
    public TicketResponse updateStatus(@RequestHeader(value = "X-Auth-Token", required = false) String token,
                                       @PathVariable Long id, @RequestParam Status status) {
        return ticketService.updateStatusForUser(id, status, authService.authenticate(token));
    }

    @PostMapping("/{id}/work/start")
    public TicketResponse startWork(@RequestHeader(value = "X-Auth-Token", required = false) String token,
                                    @PathVariable Long id) {
        return ticketService.startWork(id, authService.authenticate(token));
    }

    @PostMapping("/{id}/work/stop")
    public TicketResponse stopWork(@RequestHeader(value = "X-Auth-Token", required = false) String token,
                                   @PathVariable Long id) {
        return ticketService.stopWork(id, authService.authenticate(token));
    }

    @PatchMapping("/{id}/field-update")
    public TicketResponse fieldUpdate(@RequestHeader(value = "X-Auth-Token", required = false) String token,
                                      @PathVariable Long id, @RequestBody FieldUpdateRequest request) {
        return ticketService.fieldUpdate(id, request, authService.authenticate(token));
    }

    @PostMapping("/{id}/notes")
    @ResponseStatus(HttpStatus.CREATED)
    public void addNote(@PathVariable Long id, @Valid @RequestBody NoteRequest request) {
        ticketService.addNote(id, request);
    }

    @GetMapping("/{id}/notes")
    public List<TicketNote> getNotes(@PathVariable Long id) {
        return ticketService.getNotes(id);
    }
}
