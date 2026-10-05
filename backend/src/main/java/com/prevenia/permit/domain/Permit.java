package com.prevenia.permit.domain;

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
@Table(name = "permits")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Permit extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "company_id", nullable = false)
    private UUID companyId;

    @Column(name = "expiration_id")
    private UUID expirationId;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 50)
    private PermitType type;

    @Column(name = "issuing_authority", nullable = false, length = 255)
    private String issuingAuthority;

    @Column(name = "permit_number", nullable = false, length = 100)
    private String permitNumber;

    @Column(name = "issue_date", nullable = false)
    private LocalDate issueDate;

    @Column(name = "expiration_date", nullable = false)
    private LocalDate expirationDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private PermitStatus status = PermitStatus.ACTIVE;

    @Column(name = "contact_name", length = 150)
    private String contactName;

    @Column(name = "contact_phone", length = 50)
    private String contactPhone;

    @Column(name = "contact_email", length = 255)
    private String contactEmail;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "document_reference", length = 255)
    private String documentReference;

    @Column(name = "previous_permit_id")
    private UUID previousPermitId;

    @Column(name = "created_by")
    private UUID createdBy;

    @Column(name = "updated_by")
    private UUID updatedBy;

    public boolean isActive() {
        return this.status == PermitStatus.ACTIVE;
    }
}
