package com.ispticket.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.ispticket.model.*;
import com.ispticket.service.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tickets/{ticketId}/collaboration")
@RequiredArgsConstructor
public class CollaborationController {
    private final AuthService auth;
    private final CollaborationService collaboration;
    private final CallSignalingService signaling;

    @GetMapping("/messages")
    public List<TicketNote> messages(@RequestHeader(value="X-Auth-Token", required=false) String token, @PathVariable Long ticketId) {
        return collaboration.list(ticketId, auth.authenticate(token));
    }
    @PostMapping(value="/messages", consumes=MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public TicketNote message(@RequestHeader(value="X-Auth-Token", required=false) String token, @PathVariable Long ticketId,
                              @RequestPart(value="message", required=false) String message,
                              @RequestPart(value="file", required=false) MultipartFile file) throws IOException {
        return collaboration.add(ticketId, auth.authenticate(token), message, file);
    }
    @PostMapping("/signals")
    public Map<String,Object> signal(@RequestHeader(value="X-Auth-Token", required=false) String token, @PathVariable Long ticketId,
                                     @RequestBody JsonNode payload) {
        AppUser user = auth.authenticate(token);
        if (!collaboration.canAccess(ticketId, user)) throw new IllegalArgumentException("Not authorized to access this ticket");
        return signaling.signal(ticketId, user.getUsername(), payload);
    }
    @GetMapping("/signals")
    public List<Map<String,Object>> signals(@RequestHeader(value="X-Auth-Token", required=false) String token, @PathVariable Long ticketId) {
        AppUser user = auth.authenticate(token);
        if (!collaboration.canAccess(ticketId, user)) throw new IllegalArgumentException("Not authorized to access this ticket");
        return signaling.events(ticketId, user.getUsername());
    }
}
