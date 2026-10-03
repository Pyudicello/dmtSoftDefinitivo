package com.prevenia.auth.api.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class LoginResponse {

    private final String accessToken;
    @Builder.Default
    private final String tokenType = "Bearer";
    private final long expiresIn;
    private final UserSummaryDto user;
}
