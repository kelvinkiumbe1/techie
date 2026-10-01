package com.ispticket.dto;

import com.ispticket.model.enums.Status;
import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class BulkTicketRequest {
    @NotEmpty
    private List<Long> ticketIds;
    private Long technicianId;
    private Status status;
}
