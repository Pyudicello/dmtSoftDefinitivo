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
public class CategorySummaryDto {
    private UUID id;
    private String code;
    private String name;
    private String icon;
    private String colorCode;
    private boolean isSystem;
}
