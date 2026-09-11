package com.ispticket.model;

import com.ispticket.model.enums.Category;
import com.ispticket.model.enums.Role;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "app_users")
@Getter @Setter @NoArgsConstructor
public class AppUser {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true) private String username;
    @JsonIgnore @Column(nullable = false) private String passwordHash;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private Role role;
    private Long technicianId;
    @Enumerated(EnumType.STRING) private Category teamCategory;

    public AppUser(String username, String passwordHash, Role role) {
        this.username = username; this.passwordHash = passwordHash; this.role = role;
    }
}
