package com.ispticket.service;

import com.ispticket.dto.AuthResponse;
import com.ispticket.dto.LoginRequest;
import com.ispticket.exception.NotFoundException;
import com.ispticket.model.AppUser;
import com.ispticket.model.enums.Role;
import com.ispticket.repository.AppUserRepository;
import com.ispticket.repository.AppSessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Value;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.UUID;

@Service @RequiredArgsConstructor
public class AuthService {
    private final AppUserRepository users;
    private final AppSessionRepository sessions;
    private BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
    @Value("${app.admin.username:admin}")
    private String adminUsername;
    @Value("${app.admin.password:admin123}")
    private String adminPassword;
    private static final long SESSION_HOURS = 12;

    public AuthResponse login(LoginRequest request) {
        AppUser user = users.findByUsernameIgnoreCase(request.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("Invalid username or password"));
        if (!encoder.matches(request.getPassword(), user.getPasswordHash()))
            throw new IllegalArgumentException("Invalid username or password");
        String token = UUID.randomUUID().toString();
        sessions.save(new com.ispticket.model.AppSession(hashToken(token), user,
                LocalDateTime.now().plusHours(SESSION_HOURS)));
        return new AuthResponse(token, user.getUsername(), user.getRole(), user.getTechnicianId(), user.getTeamCategory());
    }

    @Transactional(readOnly = true)
    public AppUser authenticate(String token) {
        if (token == null) throw new IllegalArgumentException("Authentication required");
        return sessions.findByTokenHashAndExpiresAtAfter(hashToken(token), LocalDateTime.now())
                .map(com.ispticket.model.AppSession::getUser)
                .orElseThrow(() -> new IllegalArgumentException("Authentication required"));
    }

    @Transactional
    public void logout(String token) {
        if (token != null) sessions.deleteByTokenHash(hashToken(token));
    }
    public AppUser createTechnicianAccount(String username, String password, Long technicianId,
                                           com.ispticket.model.enums.Category category) {
        if (users.findByUsernameIgnoreCase(username).isPresent()) throw new IllegalArgumentException("Username already exists");
        AppUser user = new AppUser(username, encoder.encode(password), Role.TECHNICIAN);
        user.setTechnicianId(technicianId); user.setTeamCategory(category);
        return users.save(user);
    }
    public void resetTechnicianPassword(Long technicianId, String password) {
        AppUser user = users.findAll().stream()
                .filter(candidate -> technicianId.equals(candidate.getTechnicianId()))
                .findFirst()
                .orElseThrow(() -> new NotFoundException("Technician account not found"));
        user.setPasswordHash(encoder.encode(password));
        users.save(user);
    }
    public void updateTechnicianUsername(Long technicianId, String username) {
        AppUser user = users.findAll().stream()
                .filter(candidate -> technicianId.equals(candidate.getTechnicianId()))
                .findFirst()
                .orElseThrow(() -> new NotFoundException("Technician account not found"));
        users.findByUsernameIgnoreCase(username).filter(existing -> !existing.getId().equals(user.getId()))
                .ifPresent(existing -> { throw new IllegalArgumentException("Username already exists"); });
        user.setUsername(username.trim());
        users.save(user);
    }
    public String usernameForTechnician(Long technicianId) {
        return users.findAll().stream()
                .filter(candidate -> technicianId.equals(candidate.getTechnicianId()))
                .map(AppUser::getUsername)
                .findFirst()
                .orElse(null);
    }
    public void deleteTechnicianAccount(Long technicianId) {
        AppUser user = users.findAll().stream()
                .filter(candidate -> technicianId.equals(candidate.getTechnicianId()))
                .findFirst()
                .orElseThrow(() -> new NotFoundException("Technician account not found"));
        sessions.deleteByUserId(user.getId());
        users.delete(user);
    }
    public void ensureAdmin() {
        if (users.findByUsernameIgnoreCase(adminUsername).isEmpty())
            users.save(new AppUser(adminUsername, encoder.encode(adminPassword), Role.ADMIN));
    }

    private String hashToken(String token) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(token.getBytes(StandardCharsets.UTF_8));
            StringBuilder result = new StringBuilder(digest.length * 2);
            for (byte value : digest) result.append(String.format("%02x", value));
            return result.toString();
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 is unavailable", ex);
        }
    }
}
