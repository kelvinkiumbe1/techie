package com.ispticket.dto;

import com.ispticket.model.enums.Category;
import com.ispticket.model.enums.TechStatus;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TechnicianUpdateRequest {
    private String name;
    private String phone;
    private Category teamCategory;
    private TechStatus status;
    private String username;
}
