package com.ispticket.repository;

import com.ispticket.model.Technician;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TechnicianRepository extends JpaRepository<Technician, Long> {
    List<Technician> findByTeamId(Long teamId);
}
