package com.ispticket.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "customers")
@Getter
@Setter
@NoArgsConstructor
public class Customer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String phone;

    private String altPhone;

    private String location;

    @Column(length = 1000)
    private String notes;

    public Customer(String name, String phone, String location) {
        this.name = name;
        this.phone = phone;
        this.location = location;
    }
}
