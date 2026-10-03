package com.prevenia.company.api.dto;

import com.prevenia.company.domain.Company;
import com.prevenia.company.domain.CompanyStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Builder
public class CompanyResponse {

    private final UUID id;
    private final UUID organizationId;
    private final String businessName;
    private final String legalName;
    private final String taxId;
    private final String address;
    private final String city;
    private final String province;
    private final String country;
    private final String email;
    private final String phone;
    private final CompanyStatus status;
    private final OffsetDateTime createdAt;
    private final OffsetDateTime updatedAt;

    public static CompanyResponse fromEntity(Company company) {
        return CompanyResponse.builder()
                .id(company.getId())
                .organizationId(company.getOrganizationId())
                .businessName(company.getBusinessName())
                .legalName(company.getLegalName())
                .taxId(company.getTaxId())
                .address(company.getAddress())
                .city(company.getCity())
                .province(company.getProvince())
                .country(company.getCountry())
                .email(company.getEmail())
                .phone(company.getPhone())
                .status(company.getStatus())
                .createdAt(company.getCreatedAt())
                .updatedAt(company.getUpdatedAt())
                .build();
    }
}
