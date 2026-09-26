package com.ispticket.dto;

import com.ispticket.model.AppUser;

public record AdminAccountResponse(Long id, String username, boolean enabled) {
    public static AdminAccountResponse from(AppUser user) {
        return new AdminAccountResponse(user.getId(), user.getUsername(), user.getEnabled() == null || user.getEnabled());
    }
}
