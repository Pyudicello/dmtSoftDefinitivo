package com.prevenia.expiration.api.dto;

import com.prevenia.auth.api.dto.UserSummaryDto;
import com.prevenia.expiration.domain.ExpirationDeadlineStatus;
import com.prevenia.expiration.domain.ExpirationLifecycleStatus;
import com.prevenia.expiration.domain.RecurrenceType;
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
public class ExpirationResponse {

    private UUID id;
    private UUID organizationId;
    private CompanySummaryDto company;
    private CategorySummaryDto category;
    private String title;
    private String description;
    private LocalDate issueDate;
    private LocalDate expirationDate;
    private ExpirationLifecycleStatus lifecycleStatus;
    private ExpirationDeadlineStatus deadlineStatus;
    private Long daysUntilExpiration;
    private UserSummaryDto responsible;
    private RecurrenceType recurrenceType;
    private int notificationDaysBefore;
    private String notes;
    private OffsetDateTime completedAt;
    private String completionNotes;
    private OffsetDateTime cancelledAt;
    private String cancelReason;
    private Long version;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
