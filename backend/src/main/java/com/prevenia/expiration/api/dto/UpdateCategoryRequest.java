package com.prevenia.expiration.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateCategoryRequest {

    @NotBlank(message = "Category name is required")
    @Size(max = 100, message = "Category name must not exceed 100 characters")
    private String name;

    private String description;

    @Size(max = 50, message = "Icon identifier must not exceed 50 characters")
    private String icon;

    @Size(max = 20, message = "Color code must not exceed 20 characters")
    private String colorCode;
}
