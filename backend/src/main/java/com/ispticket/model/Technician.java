package com.ispticket.model;

import com.ispticket.model.enums.TechStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "technicians")
@Getter
@Setter
@NoArgsConstructor
public class Technician {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String phone;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id", nullable = false)
    private Team team;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TechStatus status = TechStatus.AVAILABLE;

    public Technician(String name, String phone, Team team) {
        this.name = name;
        this.phone = phone;
        this.team = team;
        this.status = TechStatus.AVAILABLE;
    }
}
