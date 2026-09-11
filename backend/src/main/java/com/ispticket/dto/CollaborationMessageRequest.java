package com.ispticket.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class CollaborationMessageRequest {
    @NotBlank
    private String message;
}
