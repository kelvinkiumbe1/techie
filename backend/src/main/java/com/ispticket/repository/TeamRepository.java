package com.ispticket.repository;

import com.ispticket.model.Team;
import com.ispticket.model.enums.Category;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TeamRepository extends JpaRepository<Team, Long> {
    Optional<Team> findByCategory(Category category);
}
