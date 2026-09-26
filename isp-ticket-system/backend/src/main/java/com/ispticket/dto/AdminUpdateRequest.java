package com.ispticket.dto;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminUpdateRequest {
    private String username;
    private Boolean enabled;

    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;
}
