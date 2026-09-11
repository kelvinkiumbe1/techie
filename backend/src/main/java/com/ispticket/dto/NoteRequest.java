package com.ispticket.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class NoteRequest {

    private String author;

    @NotBlank(message = "Note text is required")
    private String note;

    private String photoUrl;
}
