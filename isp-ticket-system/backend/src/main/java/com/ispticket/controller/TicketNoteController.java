package com.ispticket.controller;

import com.ispticket.dto.NoteRequest;
import com.ispticket.model.TicketNote;
import com.ispticket.repository.TicketNoteRepository;
import com.ispticket.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tickets/{ticketId}/notes")
@RequiredArgsConstructor
public class TicketNoteController {
    private final AuthService auth;
    private final TicketNoteRepository noteRepository;

    @GetMapping
    public List<TicketNote> list(@RequestHeader(value = "X-Auth-Token", required = false) String token,
                                 @PathVariable Long ticketId) {
        var user = auth.authenticate(token);
        // Return all notes for staff, only non-internal notes for customers
        return user.getRole() != null
            ? noteRepository.findByTicketIdOrderByCreatedAtAsc(ticketId)
            : noteRepository.findByTicketIdAndInternalFalseOrderByCreatedAtAsc(ticketId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TicketNote create(@RequestHeader(value = "X-Auth-Token", required = false) String token,
                            @PathVariable Long ticketId,
                            @Valid @RequestBody NoteRequest request) {
        var user = auth.authenticate(token);
        TicketNote note = new TicketNote(ticketId, user.getUsername(), request.getNote(), request.isInternal());
        return noteRepository.save(note);
    }

    @DeleteMapping("/{noteId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@RequestHeader(value = "X-Auth-Token", required = false) String token,
                      @PathVariable Long noteId) {
        auth.authenticate(token);
        noteRepository.deleteById(noteId);
    }
}
