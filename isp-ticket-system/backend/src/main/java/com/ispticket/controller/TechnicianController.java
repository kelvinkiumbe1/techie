package com.ispticket.controller;

import com.ispticket.dto.*;
import com.ispticket.exception.NotFoundException;
import com.ispticket.model.Team;
import com.ispticket.model.Technician;
import com.ispticket.repository.TeamRepository;
import com.ispticket.repository.TicketRepository;
import com.ispticket.repository.TechnicianRepository;
import com.ispticket.model.AppUser;
import com.ispticket.model.enums.Role;
import com.ispticket.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/technicians")
@RequiredArgsConstructor
public class TechnicianController {

    private final TechnicianRepository technicianRepository;
    private final TeamRepository teamRepository;
    private final AuthService authService;
    private final TicketRepository ticketRepository;

    @GetMapping
    public List<Technician> getAll(@RequestHeader(value = "X-Auth-Token", required = false) String token) {
        authService.authenticate(token);
        return technicianRepository.findAll().stream().peek(tech -> {
            tech.setUsername(authService.usernameForTechnician(tech.getId()));
            tech.setOnline(tech.getLastSeen() != null && tech.getLastSeen().isAfter(java.time.LocalDateTime.now().minusMinutes(3)));
        }).toList();
    }

    @GetMapping("/me")
    public Technician me(@RequestHeader(value = "X-Auth-Token", required = false) String token) {
        AppUser user = authService.authenticate(token);
        if (user.getTechnicianId() == null) throw new IllegalArgumentException("Only technicians have a technician profile");
        return technicianRepository.findById(user.getTechnicianId())
                .orElseThrow(() -> new NotFoundException("Technician profile not found"));
    }

    @PatchMapping("/me/status")
    public Technician updateMyStatus(@RequestHeader(value = "X-Auth-Token", required = false) String token,
                                     @RequestParam com.ispticket.model.enums.TechStatus status) {
        AppUser user = authService.authenticate(token);
        if (user.getTechnicianId() == null) throw new IllegalArgumentException("Only technicians have a technician profile");
        Technician tech = technicianRepository.findById(user.getTechnicianId())
                .orElseThrow(() -> new NotFoundException("Technician profile not found"));
        tech.setStatus(status);
        tech.setLastSeen(java.time.LocalDateTime.now());
        return technicianRepository.save(tech);
    }

    @PatchMapping("/me/profile")
    public Technician updateMyProfile(@RequestHeader(value = "X-Auth-Token", required = false) String token,
                                      @RequestBody TechnicianUpdateRequest request) {
        AppUser user = authService.authenticate(token);
        if (user.getTechnicianId() == null) throw new IllegalArgumentException("Only technicians have a profile");
        Technician tech = technicianRepository.findById(user.getTechnicianId())
                .orElseThrow(() -> new NotFoundException("Technician profile not found"));
        if (request.getAvatar() != null) tech.setAvatar(request.getAvatar());
        tech.setLastSeen(java.time.LocalDateTime.now());
        return technicianRepository.save(tech);
    }

    @PostMapping("/me/presence")
    public Technician heartbeat(@RequestHeader(value = "X-Auth-Token", required = false) String token) {
        AppUser user = authService.authenticate(token);
        if (user.getTechnicianId() == null) throw new IllegalArgumentException("Only technicians have presence");
        Technician tech = technicianRepository.findById(user.getTechnicianId())
                .orElseThrow(() -> new NotFoundException("Technician profile not found"));
        tech.setLastSeen(java.time.LocalDateTime.now());
        return technicianRepository.save(tech);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Technician create(@RequestHeader(value = "X-Auth-Token", required = false) String token,
                             @Valid @RequestBody TechnicianRequest request) {
        if (authService.authenticate(token).getRole() != Role.ADMIN)
            throw new IllegalArgumentException("Only admins can create technician accounts");
        Team team = teamRepository.findByCategory(request.getTeamCategory())
                .orElseThrow(() -> new NotFoundException("No team for category " + request.getTeamCategory()));
        Technician tech = new Technician(request.getName(), request.getPhone(), team);
        tech = technicianRepository.save(tech);
        authService.createTechnicianAccount(request.getUsername(), request.getPassword(), tech.getId(), request.getTeamCategory());
        return tech;
    }

    @PatchMapping("/{id}")
    public Technician update(@RequestHeader(value = "X-Auth-Token", required = false) String token,
                             @PathVariable Long id, @RequestBody TechnicianUpdateRequest request) {
        requireAdmin(token);
        Technician tech = technicianRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Technician " + id + " not found"));
        if (request.getName() != null && !request.getName().isBlank()) tech.setName(request.getName().trim());
        if (request.getPhone() != null) tech.setPhone(request.getPhone().trim());
        if (request.getStatus() != null) tech.setStatus(request.getStatus());
        if (request.getUsername() != null && !request.getUsername().isBlank())
            authService.updateTechnicianUsername(id, request.getUsername());
        if (request.getTeamCategory() != null) {
            Team team = teamRepository.findByCategory(request.getTeamCategory())
                    .orElseThrow(() -> new NotFoundException("No team for category " + request.getTeamCategory()));
            tech.setTeam(team);
        }
        return technicianRepository.save(tech);
    }

    @PostMapping("/{id}/reset-password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void resetPassword(@RequestHeader(value = "X-Auth-Token", required = false) String token,
                              @PathVariable Long id, @Valid @RequestBody PasswordResetRequest request) {
        requireAdmin(token);
        if (technicianRepository.findById(id).isEmpty()) throw new NotFoundException("Technician " + id + " not found");
        authService.resetTechnicianPassword(id, request.getPassword());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@RequestHeader(value = "X-Auth-Token", required = false) String token,
                       @PathVariable Long id) {
        requireAdmin(token);
        Technician tech = technicianRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Technician " + id + " not found"));
        var assignedTickets = ticketRepository.findByAssignedTechnicianId(id);
        assignedTickets.forEach(ticket -> ticket.setAssignedTechnician(null));
        ticketRepository.saveAll(assignedTickets);
        authService.deleteTechnicianAccount(id);
        technicianRepository.delete(tech);
    }

    private void requireAdmin(String token) {
        if (authService.authenticate(token).getRole() != Role.ADMIN)
            throw new IllegalArgumentException("Only admins can manage technician accounts");
    }
}
