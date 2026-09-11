package com.ispticket.model;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "ticket_notes")
@Getter
@Setter
@NoArgsConstructor
public class TicketNote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ticket_id", nullable = false)
    @JsonIgnore
    private Ticket ticket;

    private String author;

    @Column(length = 2000)
    private String note;

    private String photoUrl;

    private String attachmentName;
    private String attachmentUrl;
    private String attachmentContentType;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
