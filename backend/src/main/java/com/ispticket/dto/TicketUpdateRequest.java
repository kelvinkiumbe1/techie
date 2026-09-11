package com.ispticket.dto;

import com.ispticket.model.enums.Priority;
import com.ispticket.model.enums.Status;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TicketUpdateRequest {
    private String description;
    private Priority priority;
    private Status status;
    private Long technicianId;
}
