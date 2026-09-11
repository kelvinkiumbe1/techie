package com.ispticket.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AssignRequest {

    @NotNull(message = "Technician id is required")
    private Long technicianId;
}
