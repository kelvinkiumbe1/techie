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
@RestController @RequestMapping("/api/admin") @RequiredArgsConstructor
public class AdminController {
    private final AuthService authService; private final TicketRepository tickets;
    private final TechnicianRepository technicians;
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
}
