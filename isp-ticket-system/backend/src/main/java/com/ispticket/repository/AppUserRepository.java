package com.ispticket.repository;

import com.ispticket.model.AppUser;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;

public interface AppUserRepository extends JpaRepository<AppUser, Long> {
    Optional<AppUser> findByUsernameIgnoreCase(String username);
    List<AppUser> findByRoleOrderByUsername(com.ispticket.model.enums.Role role);
    long countByRole(com.ispticket.model.enums.Role role);
}
