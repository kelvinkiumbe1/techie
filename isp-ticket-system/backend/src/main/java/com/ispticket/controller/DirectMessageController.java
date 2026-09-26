package com.ispticket.controller;

import com.ispticket.dto.DirectMessageRequest;
import com.ispticket.model.*;
import com.ispticket.model.enums.Role;
import com.ispticket.repository.DirectMessageRepository;
import com.ispticket.repository.TechnicianRepository;
import com.ispticket.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/direct-messages")
@RequiredArgsConstructor
public class DirectMessageController {
    private final AuthService auth;
    private final DirectMessageRepository messages;
    private final TechnicianRepository technicians;

    @GetMapping("/{technicianId}")
    public List<DirectMessage> list(@RequestHeader(value = "X-Auth-Token", required = false) String token,
                                    @PathVariable Long technicianId) {
        AppUser user = auth.authenticate(token);
        requireAccess(user, technicianId);
        List<DirectMessage> result = user.getRole() == Role.ADMIN
                ? messages.findByRecipientTechnicianIdAndDeletedFalseOrderByCreatedAtAsc(technicianId)
                : messages.findConversationNotDeleted(technicianId, user.getTechnicianId());
        result.stream().filter(message -> user.getRole() == Role.ADMIN
                ? technicianId.equals(message.getRecipientTechnicianId())
                : !user.getTechnicianId().equals(message.getSenderTechnicianId()))
                .forEach(message -> message.setRead(true));
        messages.saveAll(result);
        return result;
    }

    @PostMapping("/{technicianId}")
    @ResponseStatus(HttpStatus.CREATED)
    public DirectMessage send(@RequestHeader(value = "X-Auth-Token", required = false) String token,
                              @PathVariable Long technicianId,
                              @Valid @RequestBody DirectMessageRequest request) {
        AppUser user = auth.authenticate(token);
        requireAccess(user, technicianId);
        DirectMessage message = new DirectMessage(user.getUsername(), technicianId, request.getMessage().trim());
        // Only set senderTechnicianId if user is a technician (not admin)
        if (user.getTechnicianId() != null) {
            message.setSenderTechnicianId(user.getTechnicianId());
        }
        if (request.getMessageType() != null) {
            message.setMessageType(request.getMessageType());
        }
        if (request.getMediaUrl() != null) {
            message.setMediaUrl(request.getMediaUrl());
        }
        return messages.save(message);
    }

    @PutMapping("/{messageId}")
    public DirectMessage edit(@RequestHeader(value = "X-Auth-Token", required = false) String token,
                              @PathVariable Long messageId,
                              @Valid @RequestBody DirectMessageRequest request) {
        AppUser user = auth.authenticate(token);
        DirectMessage message = messages.findById(messageId)
                .orElseThrow(() -> new IllegalArgumentException("Message not found"));
        // Allow editing if user is admin (no senderTechnicianId) or if technician owns the message
        boolean canEdit = (user.getRole() == Role.ADMIN && message.getSenderTechnicianId() == null) ||
                         (user.getTechnicianId() != null && user.getTechnicianId().equals(message.getSenderTechnicianId()));
        if (!canEdit) {
            throw new IllegalArgumentException("You can only edit your own messages");
        }
        message.setMessage(request.getMessage().trim());
        message.setEditedAt(java.time.LocalDateTime.now());
        return messages.save(message);
    }

    @DeleteMapping("/{messageId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@RequestHeader(value = "X-Auth-Token", required = false) String token,
                       @PathVariable Long messageId) {
        AppUser user = auth.authenticate(token);
        DirectMessage message = messages.findById(messageId)
                .orElseThrow(() -> new IllegalArgumentException("Message not found"));
        // Allow deleting if user is admin (no senderTechnicianId) or if technician owns the message
        boolean canDelete = (user.getRole() == Role.ADMIN && message.getSenderTechnicianId() == null) ||
                           (user.getTechnicianId() != null && user.getTechnicianId().equals(message.getSenderTechnicianId()));
        if (!canDelete) {
            throw new IllegalArgumentException("You can only delete your own messages");
        }
        message.setDeleted(true);
        messages.save(message);
    }

    @GetMapping("/unread-count")
    public Map<String, Long> unreadCount(@RequestHeader(value = "X-Auth-Token", required = false) String token) {
        AppUser user = auth.authenticate(token);
        long count = user.getRole() == Role.ADMIN
                ? messages.countByReadFalseAndSenderTechnicianIdIsNotNull()
                : messages.countByReadFalseAndRecipientTechnicianIdAndSenderTechnicianIdNot(user.getTechnicianId(), user.getTechnicianId());
        return Map.of("count", count);
    }

    private void requireAccess(AppUser user, Long technicianId) {
        if (technicians.findById(technicianId).isEmpty())
            throw new IllegalArgumentException("Not authorized to access this conversation");
    }
}
