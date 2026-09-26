package com.ispticket.controller;
import com.ispticket.dto.*;
import com.ispticket.model.AppUser;
import com.ispticket.model.enums.Role;
import com.ispticket.repository.AppUserRepository;
import com.ispticket.repository.TicketRepository;
import com.ispticket.repository.TechnicianRepository;
import com.ispticket.model.Technician;
import com.ispticket.model.Ticket;
import com.ispticket.model.enums.Category;
import com.ispticket.model.enums.Status;
import com.ispticket.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
@RestController @RequestMapping("/api/admin") @RequiredArgsConstructor
public class AdminController {
    private final AuthService authService; private final TicketRepository tickets;
    private final TechnicianRepository technicians;
    private final AppUserRepository users;

    @GetMapping("/accounts")
    public java.util.List<AdminAccountResponse> accounts(@RequestHeader(value="X-Auth-Token", required=false) String token) {
        requireAdmin(token);
        return users.findByRoleOrderByUsername(Role.ADMIN).stream().map(AdminAccountResponse::from).toList();
    }

    @PostMapping("/accounts")
    @ResponseStatus(org.springframework.http.HttpStatus.CREATED)
    public AdminAccountResponse createAccount(@RequestHeader(value="X-Auth-Token", required=false) String token,
                                              @Valid @RequestBody AdminRequest request) {
        requireAdmin(token);
        return AdminAccountResponse.from(authService.createAdminAccount(request.getUsername(), request.getPassword()));
    }

    @PatchMapping("/accounts/{id}")
    public AdminAccountResponse updateAccount(@RequestHeader(value="X-Auth-Token", required=false) String token,
                                              @PathVariable Long id, @Valid @RequestBody AdminUpdateRequest request) {
        requireAdmin(token);
        return AdminAccountResponse.from(authService.updateAdminAccount(id, request.getUsername(), request.getPassword(), request.getEnabled()));
    }

    @DeleteMapping("/accounts/{id}")
    @ResponseStatus(org.springframework.http.HttpStatus.NO_CONTENT)
    public void deleteAccount(@RequestHeader(value="X-Auth-Token", required=false) String token, @PathVariable Long id) {
        AppUser current = requireAdmin(token);
        authService.deleteAdminAccount(id, current.getId());
    }
    @GetMapping("/work-rate")
    public Map<String, Object> workRate(@RequestHeader(value="X-Auth-Token", required=false) String token,
                                        @RequestParam(required = false) Category category,
                                        @RequestParam(required = false) Long technicianId,
                                        @RequestParam(required = false) Status status) {
        if (authService.authenticate(token).getRole() != Role.ADMIN) throw new IllegalArgumentException("Admin access required");
        var filtered = tickets.findAll().stream()
                .filter(t -> category == null || t.getCategory() == category)
                .filter(t -> technicianId == null || (t.getAssignedTechnician() != null &&
                        technicianId.equals(t.getAssignedTechnician().getId())))
                .filter(t -> status == null || t.getStatus() == status)
                .toList();
        long total = filtered.size();
        long pending = filtered.stream().filter(t -> t.getStatus() != Status.CANCELLED && t.getStatus() != Status.RESOLVED).count();
        long resolved = filtered.stream().filter(t -> t.getStatus() == Status.RESOLVED).count();
        var metrics = technicians.findAll().stream()
                .filter(t -> category == null || t.getTeam().getCategory() == category)
                .map(t -> technicianMetric(t, filtered))
                .toList();
        return Map.of("totalTickets", total, "pendingTickets", pending, "resolvedTickets", resolved,
                "cancelledTickets", filtered.stream().filter(t -> t.getStatus() == Status.CANCELLED).count(),
                "resolutionRate", total == 0 ? 0 : Math.round(resolved * 10000.0 / total) / 100.0,
                "technicianMetrics", metrics);
    }

    private Map<String, Object> technicianMetric(Technician tech, java.util.List<Ticket> filtered) {
        var own = filtered.stream().filter(t -> t.getAssignedTechnician() != null &&
                tech.getId().equals(t.getAssignedTechnician().getId())).toList();
        long resolved = own.stream().filter(t -> t.getStatus() == Status.RESOLVED).count();
        return Map.of("technicianId", tech.getId(), "name", tech.getName(), "teamCategory",
                tech.getTeam().getCategory(), "status", tech.getStatus(), "assignedTickets", own.size(),
                "pendingTickets", own.stream().filter(t -> t.getStatus() != Status.RESOLVED && t.getStatus() != Status.CANCELLED).count(),
                "resolvedTickets", resolved, "resolutionRate",
                own.isEmpty() ? 0 : Math.round(resolved * 10000.0 / own.size()) / 100.0);
    }

    private AppUser requireAdmin(String token) {
        AppUser user = authService.authenticate(token);
        if (user.getRole() != Role.ADMIN) throw new IllegalArgumentException("Admin access required");
        return user;
    }
}
