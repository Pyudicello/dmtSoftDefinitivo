package com.prevenia.assignment.domain;

import com.prevenia.shared.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.UUID;

@Entity
@Table(
        name = "user_company_assignments",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_assignments_user_company", columnNames = {"organization_id", "user_id", "company_id"})
        }
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserCompanyAssignment extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "company_id", nullable = false)
    private UUID companyId;

    @Column(name = "assigned_at", nullable = false)
    @Builder.Default
    private OffsetDateTime assignedAt = OffsetDateTime.now(ZoneOffset.UTC);

    @Column(name = "active", nullable = false)
    @Builder.Default
    private boolean active = true;
}
