package com.ispticket.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "direct_messages")
@Getter @Setter @NoArgsConstructor
public class DirectMessage {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false) private String sender;
    private Long senderTechnicianId;
    @Column(nullable = false) private Long recipientTechnicianId;
    @Column(nullable = false, length = 2000) private String message;
    @Column(nullable = false) private LocalDateTime createdAt = LocalDateTime.now();

    public DirectMessage(String sender, Long recipientTechnicianId, String message) {
        this.sender = sender;
        this.recipientTechnicianId = recipientTechnicianId;
        this.message = message;
    }
}
