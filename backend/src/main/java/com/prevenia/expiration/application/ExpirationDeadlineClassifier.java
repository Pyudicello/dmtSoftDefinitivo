package com.prevenia.expiration.application;

import com.prevenia.expiration.domain.ExpirationDeadlineStatus;
import com.prevenia.expiration.domain.ExpirationLifecycleStatus;
import com.prevenia.expiration.infrastructure.config.ExpirationProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

@Component
@RequiredArgsConstructor
public class ExpirationDeadlineClassifier {

    private final Clock clock;
    private final ExpirationProperties properties;

    public record ClassificationResult(
            ExpirationDeadlineStatus deadlineStatus,
            Long daysUntilExpiration
    ) {}

    public ClassificationResult classify(LocalDate expirationDate, ExpirationLifecycleStatus lifecycleStatus) {
        if (expirationDate == null) {
            return new ClassificationResult(null, null);
        }

        LocalDate today = LocalDate.now(clock);
        long daysUntil = ChronoUnit.DAYS.between(today, expirationDate);

        // For non-active states (COMPLETED, CANCELLED), deadline status does not apply
        if (lifecycleStatus != ExpirationLifecycleStatus.ACTIVE) {
            return new ClassificationResult(null, daysUntil);
        }

        ExpirationDeadlineStatus deadlineStatus;
        if (expirationDate.isBefore(today)) {
            deadlineStatus = ExpirationDeadlineStatus.EXPIRED;
        } else if (daysUntil <= properties.getUrgentDays()) {
            // e.g. 0 to 7 days inclusive -> URGENT
            deadlineStatus = ExpirationDeadlineStatus.URGENT;
        } else if (daysUntil <= properties.getUpcomingDays()) {
            // e.g. 8 to 30 days inclusive -> UPCOMING
            deadlineStatus = ExpirationDeadlineStatus.UPCOMING;
        } else {
            // e.g. > 30 days -> CURRENT / VIGENTE
            deadlineStatus = ExpirationDeadlineStatus.CURRENT;
        }

        return new ClassificationResult(deadlineStatus, daysUntil);
    }

    public LocalDate getToday() {
        return LocalDate.now(clock);
    }
}
