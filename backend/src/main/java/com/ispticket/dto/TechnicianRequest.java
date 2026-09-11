package com.ispticket.dto;

import com.ispticket.model.enums.Category;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TechnicianRequest {

    @NotBlank(message = "Name is required")
    private String name;

    private String phone;

    @NotBlank(message = "Username is required")
    private String username;

    @NotBlank(message = "Password is required")
    private String password;

    @NotNull(message = "Team category is required")
    private Category teamCategory;
}
