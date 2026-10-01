package com.ispticket.controller;

import com.ispticket.dto.ProfilePhotoRequest;
import com.ispticket.dto.PasswordChangeRequest;
import com.ispticket.model.AppUser;
import com.ispticket.service.AuthService;
import com.ispticket.repository.AppUserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
public class ProfileController {
    private static final int MAX_IMAGE_LENGTH = 7_000_000;
    private final AuthService authService;
    private final AppUserRepository users;

    @GetMapping
    public Map<String, Object> get(@RequestHeader(value = "X-Auth-Token", required = false) String token) {
        return profile(authService.authenticate(token));
    }

    @PatchMapping("/photo")
    public Map<String, Object> update(@RequestHeader(value = "X-Auth-Token", required = false) String token,
                                      @Valid @RequestBody ProfilePhotoRequest request) {
        if (request.getProfileImage().length() > MAX_IMAGE_LENGTH)
            throw new IllegalArgumentException("Profile photo is too large");
        AppUser user = authService.authenticate(token);
        user.setProfileImage(request.getProfileImage());
        return profile(users.save(user));
    }

    @DeleteMapping("/photo")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@RequestHeader(value = "X-Auth-Token", required = false) String token) {
        AppUser user = authService.authenticate(token);
        user.setProfileImage(null);
        users.save(user);
    }

    @PatchMapping("/password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changePassword(@RequestHeader(value = "X-Auth-Token", required = false) String token,
                               @Valid @RequestBody PasswordChangeRequest request) {
        authService.changePassword(authService.authenticate(token), request.getCurrentPassword(), request.getNewPassword());
    }

    private Map<String, Object> profile(AppUser user) {
        return Map.of("username", user.getUsername(), "role", user.getRole(),
                "profileImage", user.getProfileImage() == null ? "" : user.getProfileImage());
    }
}
