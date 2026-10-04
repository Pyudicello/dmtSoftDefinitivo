package com.prevenia.expiration.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExpirationCategoryResponse {
    private UUID id;
    private UUID organizationId;
    private String code;
    private String name;
    private String description;
    private String icon;
    private String colorCode;
    private boolean isSystem;
    private boolean active;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
