package com.ispticket.dto;

import com.ispticket.model.enums.IssueType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PublicTicketRequest {
    @NotBlank private String customerName;
    @NotBlank private String customerPhone;
    private String customerLocation;
    @NotNull private IssueType issueType;
    private String description;
}
