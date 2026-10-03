package com.prevenia.assignment.api.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Builder
public class TechnicianSummaryDto {

    private final UUID userId;
    private final String firstName;
    private final String lastName;
    private final String email;
    private final OffsetDateTime assignedAt;
    private final boolean active;
}
