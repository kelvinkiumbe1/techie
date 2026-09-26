package com.ispticket.dto;

import com.ispticket.model.enums.Status;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class FieldUpdateRequest {
    private String description;
    private Status status;
    private String note;
}
