package com.ispticket.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RatingRequest {
    @Min(1) @Max(5)
    private int rating;
    private String feedback;
    @NotBlank
    private String customerPhone;
}
