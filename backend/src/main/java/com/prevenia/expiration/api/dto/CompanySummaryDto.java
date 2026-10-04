package com.prevenia.expiration.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompanySummaryDto {
    private UUID id;
    private String businessName;
    private String legalName;
    private String taxId;
}
