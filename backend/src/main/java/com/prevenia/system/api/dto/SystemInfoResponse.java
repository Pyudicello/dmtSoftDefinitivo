package com.prevenia.system.api.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.OffsetDateTime;

@Getter
@Builder
public class SystemInfoResponse {

    private final String application;
    private final String version;
    private final String environment;
    private final String status;
    private final OffsetDateTime timestamp;
}
