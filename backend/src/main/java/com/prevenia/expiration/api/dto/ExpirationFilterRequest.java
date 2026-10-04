package com.prevenia.expiration.api.dto;

import com.prevenia.expiration.domain.ExpirationDeadlineStatus;
import com.prevenia.expiration.domain.ExpirationLifecycleStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExpirationFilterRequest {

    private UUID companyId;
    private UUID categoryId;
    private ExpirationLifecycleStatus lifecycleStatus;
    private ExpirationDeadlineStatus deadlineStatus;
    private UUID responsibleUserId;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate from;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate to;

    private String search;
}
