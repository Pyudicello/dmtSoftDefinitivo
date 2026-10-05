package com.prevenia.inspection.api.dto;

import com.prevenia.expiration.api.dto.CompanySummaryDto;
import com.prevenia.expiration.domain.ExpirationDeadlineStatus;
import com.prevenia.inspection.domain.InspectionType;
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
public class InspectionResponse {

    private UUID id;
    private UUID organizationId;
    private CompanySummaryDto company;
    private InspectionType type;
    private String typeLabel;
    private LocalDate visitDate;
    private String authority;
    private String contactName;
    private String contactPhone;
    private String contactEmail;
    private String result;
    private String notes;
    private LocalDate nextVisitDate;
    private String documentReference;
    private UUID expirationId;
    private ExpirationDeadlineStatus nextVisitDeadlineStatus;
    private Long nextVisitDaysRemaining;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
