package com.prevenia.permit.api.dto;

import com.prevenia.permit.domain.PermitType;
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
public class CreatePermitRequest {

    @NotNull(message = "Company ID is required")
    private UUID companyId;

    @NotNull(message = "Permit type is required")
    private PermitType type;

    @NotBlank(message = "Issuing authority is required")
    @Size(max = 255, message = "Issuing authority cannot exceed 255 characters")
    private String issuingAuthority;

    @NotBlank(message = "Permit number or expediente is required")
    @Size(max = 100, message = "Permit number cannot exceed 100 characters")
    private String permitNumber;

    @NotNull(message = "Issue date is required")
    private LocalDate issueDate;

    @NotNull(message = "Expiration date (vencimiento de habilitación / visado) is required")
    private LocalDate expirationDate;

    @Size(max = 150, message = "Contact name cannot exceed 150 characters")
    private String contactName;

    @Size(max = 50, message = "Contact phone cannot exceed 50 characters")
    private String contactPhone;

    @Size(max = 255, message = "Contact email cannot exceed 255 characters")
    private String contactEmail;

    private String notes;

    @Size(max = 255, message = "Document reference cannot exceed 255 characters")
    private String documentReference;

    private UUID previousPermitId;
}
