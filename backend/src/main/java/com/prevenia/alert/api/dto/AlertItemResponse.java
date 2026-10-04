package com.prevenia.alert.api.dto;

import com.prevenia.expiration.domain.ExpirationDeadlineStatus;
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
public class AlertItemResponse {

    private UUID expirationId;
    private UUID companyId;
    private String companyName;
    private UUID categoryId;
    private String categoryName;
    private String title;
    private String description;
    private LocalDate expirationDate;
    private ExpirationDeadlineStatus deadlineStatus;
    private Long daysUntilExpiration;
    private String priority; // CRITICAL, HIGH, MEDIUM
    private UUID responsibleUserId;
    private String responsibleUserName;
}
