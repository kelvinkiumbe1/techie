package com.ispticket.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class NoteRequest {
    @NotBlank
    private String author;
    @NotBlank
    private String note;
    private String photoUrl;
}
