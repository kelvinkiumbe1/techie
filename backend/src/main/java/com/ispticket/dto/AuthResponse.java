package com.ispticket.dto;
import com.ispticket.model.enums.Category;
import com.ispticket.model.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Getter;
@Getter @AllArgsConstructor
public class AuthResponse {
    private String token; private String username; private Role role;
    private Long technicianId; private Category teamCategory;
}
