package com.ispticket.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "ticket_ratings", uniqueConstraints = @UniqueConstraint(columnNames = {"ticket_id"}))
@Getter
@Setter
@NoArgsConstructor
public class TicketRating {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ticket_id", nullable = false)
    private Ticket ticket;
    @Column(nullable = false)
    private int rating;
    @Column(length = 2000)
    private String feedback;
    @Column(nullable = false)
    private String customerPhone;
    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
