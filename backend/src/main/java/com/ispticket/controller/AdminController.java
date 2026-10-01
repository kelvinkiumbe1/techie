package com.ispticket.controller;
import com.ispticket.model.enums.Role;
import com.ispticket.repository.TicketRepository;
import com.ispticket.repository.TechnicianRepository;
import com.ispticket.model.Technician;
import com.ispticket.model.Ticket;
import com.ispticket.model.enums.Category;
import com.ispticket.model.enums.Status;
import com.ispticket.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.List;
import java.nio.charset.StandardCharsets;
import com.ispticket.dto.BulkTicketRequest;
import com.ispticket.dto.AdminAccountRequest;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import com.ispticket.service.TicketService;
@RestController @RequestMapping("/api/admin") @RequiredArgsConstructor
public class AdminController {
    private final AuthService authService; private final TicketRepository tickets;
    private final TechnicianRepository technicians;
    private final TicketService ticketService;
    @GetMapping("/accounts")
    public List<Map<String, Object>> accounts(@RequestHeader(value="X-Auth-Token", required=false) String token) {
        requireAdmin(token);
        return authService.adminAccounts();
    }
    @PostMapping("/accounts")
    @ResponseStatus(org.springframework.http.HttpStatus.CREATED)
    public Map<String, Object> createAdminAccount(
            @RequestHeader(value="X-Auth-Token", required=false) String token,
            @Valid @RequestBody AdminAccountRequest request) {
        requireAdmin(token);
        var account = authService.createAdminAccount(request.getUsername(), request.getPassword());
        return Map.of("username", account.getUsername(), "role", account.getRole());
    }

    @PatchMapping("/accounts/{id}/status")
    public void updateAccountStatus(@RequestHeader(value="X-Auth-Token", required=false) String token,
                                    @PathVariable Long id, @RequestParam boolean enabled) {
        var current = authService.authenticate(token);
        if (current.getRole() != Role.ADMIN) throw new IllegalArgumentException("Admin access required");
        authService.setUserEnabled(id, enabled, current.getId());
    }

    @DeleteMapping("/accounts/{id}")
    @ResponseStatus(org.springframework.http.HttpStatus.NO_CONTENT)
    public void deleteAccount(@RequestHeader(value="X-Auth-Token", required=false) String token,
                              @PathVariable Long id) {
        var current = authService.authenticate(token);
        if (current.getRole() != Role.ADMIN) throw new IllegalArgumentException("Admin access required");
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

    @PostMapping("/tickets/bulk")
    public java.util.List<Map<String, Object>> bulkUpdate(
            @RequestHeader(value="X-Auth-Token", required=false) String token,
            @Valid @RequestBody BulkTicketRequest request) {
        requireAdmin(token);
        return request.getTicketIds().stream().map(id -> {
            if (request.getTechnicianId() != null) ticketService.assign(id, request.getTechnicianId());
            if (request.getStatus() != null) ticketService.updateStatus(id, request.getStatus());
            Ticket ticket = tickets.findById(id).orElseThrow();
            return Map.<String, Object>of("id", ticket.getId(), "status", ticket.getStatus());
        }).toList();
    }

    @GetMapping(value = "/tickets/export", produces = "text/csv")
    public ResponseEntity<byte[]> export(@RequestHeader(value="X-Auth-Token", required=false) String token) {
        requireAdmin(token);
        StringBuilder csv = new StringBuilder("id,customer,phone,category,issue,status,priority,technician,createdAt,resolvedAt\n");
        tickets.findAll().forEach(ticket -> csv.append(csv(ticket.getId())).append(',')
                .append(csv(ticket.getCustomer().getName())).append(',')
                .append(csv(ticket.getCustomer().getPhone())).append(',')
                .append(csv(ticket.getCategory())).append(',')
                .append(csv(ticket.getIssueType())).append(',')
                .append(csv(ticket.getStatus())).append(',')
                .append(csv(ticket.getPriority())).append(',')
                .append(csv(ticket.getAssignedTechnician() == null ? "" : ticket.getAssignedTechnician().getName())).append(',')
                .append(csv(ticket.getCreatedAt())).append(',')
                .append(csv(ticket.getResolvedAt())).append('\n'));
        return ResponseEntity.ok().contentType(MediaType.parseMediaType("text/csv"))
                .header("Content-Disposition", "attachment; filename=tickets.csv")
                .body(csv.toString().getBytes(StandardCharsets.UTF_8));
    }

    private void requireAdmin(String token) {
        if (authService.authenticate(token).getRole() != Role.ADMIN)
            throw new IllegalArgumentException("Admin access required");
    }

    private String csv(Object value) {
        if (value == null) return "";
        return "\"" + String.valueOf(value).replace("\"", "\"\"") + "\"";
    }
}
