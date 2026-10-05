package com.prevenia.inspection.api.dto;

import com.prevenia.inspection.domain.InspectionType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateInspectionRequest {

    @NotNull(message = "Company ID is required")
    private UUID companyId;

    @NotNull(message = "Inspection type is required")
    private InspectionType type;

    @NotNull(message = "Visit date is required")
    private LocalDate visitDate;

    @NotBlank(message = "Authority / Organization name is required")
    @Size(max = 255, message = "Authority cannot exceed 255 characters")
    private String authority;

    @Size(max = 150, message = "Contact name cannot exceed 150 characters")
    private String contactName;

    @Size(max = 50, message = "Contact phone cannot exceed 50 characters")
    private String contactPhone;

    @Size(max = 255, message = "Contact email cannot exceed 255 characters")
    private String contactEmail;

    private String result;

    private String notes;

    private LocalDate nextVisitDate;

    @Size(max = 255, message = "Document reference cannot exceed 255 characters")
    private String documentReference;
}
