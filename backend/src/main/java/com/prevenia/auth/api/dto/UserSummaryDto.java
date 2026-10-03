package com.prevenia.auth.api.dto;

import com.prevenia.user.domain.UserRole;
import lombok.Builder;
import lombok.Getter;

import java.util.UUID;

@Getter
@Builder
public class UserSummaryDto {

    private final UUID id;
    private final String email;
    private final String firstName;
    private final String lastName;
    private final UserRole role;
    private final UUID organizationId;
    private final UUID companyId;
}
