package com.prevenia.permit.api.dto;

import com.prevenia.expiration.api.dto.CompanySummaryDto;
import com.prevenia.expiration.domain.ExpirationDeadlineStatus;
import com.prevenia.permit.domain.PermitStatus;
import com.prevenia.permit.domain.PermitType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PermitResponse {

    private UUID id;
    private UUID organizationId;
    private CompanySummaryDto company;
    private PermitType type;
    private String typeLabel;
    private String issuingAuthority;
    private String permitNumber;
    private LocalDate issueDate;
    private LocalDate expirationDate;
    private PermitStatus status;
    private String statusLabel;
    private String contactName;
    private String contactPhone;
    private String contactEmail;
    private String notes;
    private String documentReference;
    private UUID previousPermitId;
    private String previousPermitNumber;
    private UUID expirationId;
    private ExpirationDeadlineStatus deadlineStatus;
    private Long daysUntilExpiration;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
