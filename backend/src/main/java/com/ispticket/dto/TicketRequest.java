package com.ispticket.dto;

import com.ispticket.model.enums.Channel;
import com.ispticket.model.enums.IssueType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TicketRequest {

    @NotBlank(message = "Customer name is required")
    private String customerName;

    @NotBlank(message = "Customer phone is required")
    private String customerPhone;

    private String customerLocation;

    @NotNull(message = "Channel is required")
    private Channel channel;

    @NotNull(message = "Issue type is required")
    private IssueType issueType;

    private String description;

    private String createdBy;
}
