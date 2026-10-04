package com.prevenia.user.application;

import com.prevenia.company.domain.CompanyRepository;
import com.prevenia.organization.domain.OrganizationRepository;
import com.prevenia.shared.domain.DuplicateResourceException;
import com.prevenia.shared.domain.ForbiddenException;
import com.prevenia.shared.domain.ResourceNotFoundException;
import com.prevenia.shared.security.AuthenticatedUser;
import com.prevenia.user.api.dto.CreateUserRequest;
import com.prevenia.user.api.dto.UserResponse;
import com.prevenia.user.domain.User;
import com.prevenia.user.domain.UserRepository;
import com.prevenia.user.domain.UserRole;
import com.prevenia.user.domain.UserStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final OrganizationRepository organizationRepository;
    private final CompanyRepository companyRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public UserResponse createUser(CreateUserRequest request, AuthenticatedUser caller) {
        log.debug("Creating user with email {} requested by {}", request.getEmail(), caller.getEmail());

        if (caller.isTechnician() || caller.isClient()) {
            throw new ForbiddenException("Technicians and clients are not allowed to create users");
        }

        UUID targetOrganizationId;

        if (caller.isConsultantAdmin()) {
            if (request.getRole() == UserRole.PLATFORM_ADMIN) {
                throw new ForbiddenException("Consultant admin cannot create platform admins");
            }
            targetOrganizationId = caller.getOrganizationId();
        } else {
            // PLATFORM_ADMIN
            if (request.getRole() == UserRole.PLATFORM_ADMIN) {
                targetOrganizationId = null;
            } else {
                if (request.getOrganizationId() == null) {
                    throw new ForbiddenException("Organization ID is required when creating a non-platform admin user");
                }
                if (!organizationRepository.existsById(request.getOrganizationId())) {
                    throw new ResourceNotFoundException("Organization", request.getOrganizationId());
                }
                targetOrganizationId = request.getOrganizationId();
            }
        }

        // Validate client association
        UUID targetCompanyId = null;
        if (request.getRole() == UserRole.CLIENT) {
            if (request.getCompanyId() != null) {
                if (targetOrganizationId != null && !companyRepository.existsByIdAndOrganizationId(request.getCompanyId(), targetOrganizationId)) {
                    throw new ResourceNotFoundException("Company", request.getCompanyId());
                }
                targetCompanyId = request.getCompanyId();
            }
        }

        String normalizedEmail = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new DuplicateResourceException("User", "email", normalizedEmail);
        }

        User user = User.builder()
                .organizationId(targetOrganizationId)
                .companyId(targetCompanyId)
                .firstName(request.getFirstName().trim())
                .lastName(request.getLastName().trim())
                .email(normalizedEmail)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .status(UserStatus.ACTIVE)
                .build();

        User savedUser = userRepository.save(user);

        log.info("User {} [role={}, org={}] created successfully by {}",
                savedUser.getEmail(), savedUser.getRole(), savedUser.getOrganizationId(), caller.getEmail());

        return UserResponse.fromEntity(savedUser);
    }

    @Transactional(readOnly = true)
    public Page<UserResponse> listUsers(UserRole role, Pageable pageable, AuthenticatedUser caller) {
        log.debug("Listing users [role={}] requested by {}", role, caller.getEmail());

        if (caller.isPlatformAdmin()) {
            if (role != null) {
                return userRepository.findAllByRole(role, pageable).map(UserResponse::fromEntity);
            }
            return userRepository.findAll(pageable).map(UserResponse::fromEntity);
        }

        if (caller.isConsultantAdmin()) {
            if (role != null) {
                return userRepository.findAllByOrganizationIdAndRole(caller.getOrganizationId(), role, pageable)
                        .map(UserResponse::fromEntity);
            }
            return userRepository.findAllByOrganizationId(caller.getOrganizationId(), pageable)
                    .map(UserResponse::fromEntity);
        }

        throw new ForbiddenException("You do not have permission to list users");
    }
}
