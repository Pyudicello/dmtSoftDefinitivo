package com.prevenia.user.api.dto;

import com.prevenia.user.domain.User;
import com.prevenia.user.domain.UserRole;
import com.prevenia.user.domain.UserStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Builder
public class UserResponse {

    private final UUID id;
    private final UUID organizationId;
    private final UUID companyId;
    private final String firstName;
    private final String lastName;
    private final String email;
    private final UserRole role;
    private final UserStatus status;
    private final OffsetDateTime createdAt;
    private final OffsetDateTime updatedAt;

    public static UserResponse fromEntity(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .organizationId(user.getOrganizationId())
                .companyId(user.getCompanyId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .role(user.getRole())
                .status(user.getStatus())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
