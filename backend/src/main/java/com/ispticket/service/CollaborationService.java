package com.ispticket.service;

import com.ispticket.exception.NotFoundException;
import com.ispticket.model.*;
import com.ispticket.repository.TicketNoteRepository;
import com.ispticket.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CollaborationService {
    private final TicketRepository tickets;
    private final TicketNoteRepository notes;
    private final TicketService ticketService;
    @org.springframework.beans.factory.annotation.Value("${uploads.directory:uploads}")
    private String uploadDirectory;

    public boolean canAccess(Long id, AppUser user) {
        if (user.getRole() == com.ispticket.model.enums.Role.ADMIN) return tickets.existsById(id);
        return tickets.findById(id).map(t -> t.getCategory() == user.getTeamCategory()
                && (t.getAssignedTechnician() == null || t.getAssignedTechnician().getId().equals(user.getTechnicianId()))).orElse(false);
    }

    @Transactional
    public TicketNote add(Long id, AppUser user, String message, MultipartFile file) throws IOException {
        if (!canAccess(id, user)) throw new IllegalArgumentException("Not authorized to access this ticket");
        Ticket ticket = tickets.findById(id).orElseThrow(() -> new NotFoundException("Ticket " + id + " not found"));
        TicketNote note = new TicketNote();
        note.setTicket(ticket);
        note.setAuthor(user.getUsername());
        note.setNote(message == null ? "" : message.trim());
        if (file != null && !file.isEmpty()) {
            if (file.getSize() > 25 * 1024 * 1024) throw new IllegalArgumentException("Attachment exceeds 25 MB");
            String safeName = UUID.randomUUID() + "-" + Paths.get(file.getOriginalFilename() == null ? "attachment" : file.getOriginalFilename()).getFileName();
            Path dir = Paths.get(uploadDirectory).toAbsolutePath().normalize();
            Files.createDirectories(dir);
            Files.copy(file.getInputStream(), dir.resolve(safeName), StandardCopyOption.REPLACE_EXISTING);
            note.setAttachmentName(file.getOriginalFilename());
            note.setAttachmentContentType(file.getContentType());
            note.setAttachmentUrl("/api/files/" + safeName);
        }
        return notes.save(note);
    }

    public List<TicketNote> list(Long id, AppUser user) {
        if (!canAccess(id, user)) throw new IllegalArgumentException("Not authorized to access this ticket");
        if (!tickets.existsById(id)) throw new NotFoundException("Ticket " + id + " not found");
        return notes.findByTicketIdOrderByCreatedAtAsc(id);
    }

    public boolean canAccessAttachment(String fileName, AppUser user) {
        return notes.findByAttachmentUrl("/api/files/" + fileName)
                .map(note -> canAccess(note.getTicket().getId(), user))
                .orElse(false);
    }
}
