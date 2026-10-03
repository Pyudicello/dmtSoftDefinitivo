package com.prevenia.expiration.domain;

import com.prevenia.shared.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "expirations")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Expiration extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "company_id", nullable = false)
    private UUID companyId;

    @Column(name = "category_id", nullable = false)
    private UUID categoryId;

    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "issue_date")
    private LocalDate issueDate;

    @Column(name = "expiration_date", nullable = false)
    private LocalDate expirationDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private ExpirationStatus status = ExpirationStatus.PENDING;

    @Column(name = "responsible_user_id")
    private UUID responsibleUserId;

    @Enumerated(EnumType.STRING)
    @Column(name = "recurrence_type", nullable = false, length = 30)
    @Builder.Default
    private RecurrenceType recurrenceType = RecurrenceType.NONE;

    @Column(name = "notification_days_before", nullable = false)
    @Builder.Default
    private int notificationDaysBefore = 30;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_by")
    private UUID createdBy;

    @Column(name = "updated_by")
    private UUID updatedBy;
}
