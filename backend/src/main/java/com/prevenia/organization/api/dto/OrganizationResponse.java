package com.prevenia.organization.api.dto;

import com.prevenia.organization.domain.Organization;
import com.prevenia.organization.domain.OrganizationStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Builder
public class OrganizationResponse {

    private final UUID id;
    private final String name;
    private final String legalName;
    private final String taxId;
    private final String email;
    private final String phone;
    private final OrganizationStatus status;
    private final OffsetDateTime createdAt;
    private final OffsetDateTime updatedAt;

    public static OrganizationResponse fromEntity(Organization org) {
        return OrganizationResponse.builder()
                .id(org.getId())
                .name(org.getName())
                .legalName(org.getLegalName())
                .taxId(org.getTaxId())
                .email(org.getEmail())
                .phone(org.getPhone())
                .status(org.getStatus())
                .createdAt(org.getCreatedAt())
                .updatedAt(org.getUpdatedAt())
                .build();
    }
}
