package com.ispticket.controller;

import com.ispticket.dto.DirectMessageRequest;
import com.ispticket.model.*;
import com.ispticket.model.enums.Role;
import com.ispticket.repository.DirectMessageRepository;
import com.ispticket.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/direct-messages")
@RequiredArgsConstructor
public class DirectMessageController {
    private final AuthService auth;
    private final DirectMessageRepository messages;

    @GetMapping("/{technicianId}")
    public List<DirectMessage> list(@RequestHeader(value = "X-Auth-Token", required = false) String token,
                                    @PathVariable Long technicianId) {
        AppUser user = auth.authenticate(token);
        requireAccess(user, technicianId);
        return messages.findByRecipientTechnicianIdOrderByCreatedAtAsc(technicianId);
    }

    @PostMapping("/{technicianId}")
    @ResponseStatus(HttpStatus.CREATED)
    public DirectMessage send(@RequestHeader(value = "X-Auth-Token", required = false) String token,
                              @PathVariable Long technicianId,
                              @Valid @RequestBody DirectMessageRequest request) {
        AppUser user = auth.authenticate(token);
        requireAccess(user, technicianId);
        DirectMessage message = new DirectMessage(user.getUsername(), technicianId, request.getMessage().trim());
        message.setSenderTechnicianId(user.getTechnicianId());
        return messages.save(message);
    }

    private void requireAccess(AppUser user, Long technicianId) {
        if (user.getRole() != Role.ADMIN && !technicianId.equals(user.getTechnicianId()))
            throw new IllegalArgumentException("Not authorized to access this conversation");
    }
}
