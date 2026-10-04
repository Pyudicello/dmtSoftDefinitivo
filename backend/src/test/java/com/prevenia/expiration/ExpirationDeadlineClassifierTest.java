package com.prevenia.expiration;

import com.prevenia.expiration.application.ExpirationDeadlineClassifier;
import com.prevenia.expiration.domain.ExpirationDeadlineStatus;
import com.prevenia.expiration.domain.ExpirationLifecycleStatus;
import com.prevenia.expiration.infrastructure.config.ExpirationProperties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class ExpirationDeadlineClassifierTest {

    private ExpirationDeadlineClassifier classifier;
    private final ZoneId zoneId = ZoneId.of("America/Argentina/Buenos_Aires");
    // Reference fixed date: 2026-09-09
    private final Instant fixedInstant = Instant.parse("2026-09-09T15:00:00Z");

    @BeforeEach
    void setUp() {
        Clock fixedClock = Clock.fixed(fixedInstant, zoneId);
        ExpirationProperties properties = new ExpirationProperties();
        properties.setUrgentDays(7);
        properties.setUpcomingDays(30);
        classifier = new ExpirationDeadlineClassifier(fixedClock, properties);
    }

    @Test
    @DisplayName("Should classify yesterday (2026-09-08) as EXPIRED with -1 days until expiration")
    void testExpiredYesterday() {
        LocalDate yesterday = LocalDate.of(2026, 9, 8);
        var result = classifier.classify(yesterday, ExpirationLifecycleStatus.ACTIVE);

        assertEquals(ExpirationDeadlineStatus.EXPIRED, result.deadlineStatus());
        assertEquals(-1L, result.daysUntilExpiration());
    }

    @Test
    @DisplayName("Should classify today (2026-09-09) as URGENT (not EXPIRED) with 0 days until expiration")
    void testUrgentToday() {
        LocalDate today = LocalDate.of(2026, 9, 9);
        var result = classifier.classify(today, ExpirationLifecycleStatus.ACTIVE);

        assertEquals(ExpirationDeadlineStatus.URGENT, result.deadlineStatus());
        assertEquals(0L, result.daysUntilExpiration());
    }

    @Test
    @DisplayName("Should classify tomorrow (2026-09-10) as URGENT with 1 day until expiration")
    void testUrgentTomorrow() {
        LocalDate tomorrow = LocalDate.of(2026, 9, 10);
        var result = classifier.classify(tomorrow, ExpirationLifecycleStatus.ACTIVE);

        assertEquals(ExpirationDeadlineStatus.URGENT, result.deadlineStatus());
        assertEquals(1L, result.daysUntilExpiration());
    }

    @Test
    @DisplayName("Should classify +7 days boundary (2026-09-16) as URGENT")
    void testUrgentBoundary7Days() {
        LocalDate sevenDaysLater = LocalDate.of(2026, 9, 16);
        var result = classifier.classify(sevenDaysLater, ExpirationLifecycleStatus.ACTIVE);

        assertEquals(ExpirationDeadlineStatus.URGENT, result.deadlineStatus());
        assertEquals(7L, result.daysUntilExpiration());
    }

    @Test
    @DisplayName("Should classify +8 days boundary (2026-09-17) as UPCOMING")
    void testUpcomingBoundary8Days() {
        LocalDate eightDaysLater = LocalDate.of(2026, 9, 17);
        var result = classifier.classify(eightDaysLater, ExpirationLifecycleStatus.ACTIVE);

        assertEquals(ExpirationDeadlineStatus.UPCOMING, result.deadlineStatus());
        assertEquals(8L, result.daysUntilExpiration());
    }

    @Test
    @DisplayName("Should classify +30 days boundary (2026-10-09) as UPCOMING")
    void testUpcomingBoundary30Days() {
        LocalDate thirtyDaysLater = LocalDate.of(2026, 10, 9);
        var result = classifier.classify(thirtyDaysLater, ExpirationLifecycleStatus.ACTIVE);

        assertEquals(ExpirationDeadlineStatus.UPCOMING, result.deadlineStatus());
        assertEquals(30L, result.daysUntilExpiration());
    }

    @Test
    @DisplayName("Should classify +31 days boundary (2026-10-10) as CURRENT (VIGENTE)")
    void testCurrentBoundary31Days() {
        LocalDate thirtyOneDaysLater = LocalDate.of(2026, 10, 10);
        var result = classifier.classify(thirtyOneDaysLater, ExpirationLifecycleStatus.ACTIVE);

        assertEquals(ExpirationDeadlineStatus.CURRENT, result.deadlineStatus());
        assertEquals(31L, result.daysUntilExpiration());
    }

    @Test
    @DisplayName("Should return null deadline status when lifecycleStatus is COMPLETED even if past date")
    void testCompletedExpirationHasNoDeadlineStatus() {
        LocalDate pastDate = LocalDate.of(2026, 9, 1);
        var result = classifier.classify(pastDate, ExpirationLifecycleStatus.COMPLETED);

        assertNull(result.deadlineStatus());
        assertEquals(-8L, result.daysUntilExpiration());
    }

    @Test
    @DisplayName("Should return null deadline status when lifecycleStatus is CANCELLED")
    void testCancelledExpirationHasNoDeadlineStatus() {
        LocalDate futureDate = LocalDate.of(2026, 9, 20);
        var result = classifier.classify(futureDate, ExpirationLifecycleStatus.CANCELLED);

        assertNull(result.deadlineStatus());
        assertEquals(11L, result.daysUntilExpiration());
    }
}
