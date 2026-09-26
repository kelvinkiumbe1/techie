package com.ispticket.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "ticket_notes")
@Getter @Setter @NoArgsConstructor
public class TicketNote {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "ticket_id", nullable = false)
    private Ticket ticket;

    @Column(nullable = false)
    private String author;

    @Column(nullable = false, length = 2000)
    private String note;

    private String photoUrl;
    private String attachmentName;
    private String attachmentContentType;
    private String attachmentUrl;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
