package com.prevenia.shared.infrastructure.bootstrap;

import com.prevenia.organization.domain.Organization;
import com.prevenia.organization.domain.OrganizationRepository;
import com.prevenia.organization.domain.OrganizationStatus;
import com.prevenia.user.domain.User;
import com.prevenia.user.domain.UserRepository;
import com.prevenia.user.domain.UserRole;
import com.prevenia.user.domain.UserStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@RequiredArgsConstructor
public class AdminBootstrapRunner implements CommandLineRunner {

    private final UserRepository userRepository;
    private final OrganizationRepository organizationRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.bootstrap.admin.enabled:false}")
    private boolean bootstrapEnabled;

    @Value("${app.bootstrap.admin.email:}")
    private String adminEmail;

    @Value("${app.bootstrap.admin.password:}")
    private String adminPassword;

    @Value("${app.bootstrap.admin.first-name:Admin}")
    private String adminFirstName;

    @Value("${app.bootstrap.admin.last-name:Prevenia}")
    private String adminLastName;

    @Value("${app.bootstrap.admin.org-name:Consultora Principal}")
    private String orgName;

    @Value("${app.bootstrap.admin.role:CONSULTANT_ADMIN}")
    private String adminRole;

    @Override
    @Transactional
    public void run(String... args) {
        if (!bootstrapEnabled && (adminEmail == null || adminEmail.isBlank())) {
            log.debug("Admin bootstrap is disabled or no email specified. Skipping.");
            return;
        }

        String normalizedEmail = adminEmail.trim().toLowerCase();
        if (normalizedEmail.isBlank() || adminPassword == null || adminPassword.isBlank()) {
            log.warn("Admin bootstrap enabled but email or password was empty. Skipping.");
            return;
        }

        if (userRepository.existsByEmail(normalizedEmail)) {
            log.info("Admin bootstrap: user with email {} already exists. Skipping bootstrap creation.", normalizedEmail);
            return;
        }

        log.info("Admin bootstrap: initializing primary organization and root admin user for {}", normalizedEmail);

        // Find existing organization or create root organization
        Organization rootOrg = organizationRepository.findAll().stream().findFirst()
                .orElseGet(() -> {
                    Organization newOrg = Organization.builder()
                            .name(orgName.trim())
                            .email(normalizedEmail)
                            .status(OrganizationStatus.ACTIVE)
                            .build();
                    Organization saved = organizationRepository.save(newOrg);
                    log.info("Admin bootstrap: created root organization '{}' [id={}]", saved.getName(), saved.getId());
                    return saved;
                });

        UserRole role;
        try {
            role = UserRole.valueOf(adminRole.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            log.warn("Invalid BOOTSTRAP_ADMIN_ROLE '{}', defaulting to CONSULTANT_ADMIN", adminRole);
            role = UserRole.CONSULTANT_ADMIN;
        }

        User rootAdmin = User.builder()
                .organizationId(role == UserRole.PLATFORM_ADMIN ? null : rootOrg.getId())
                .firstName(adminFirstName.trim())
                .lastName(adminLastName.trim())
                .email(normalizedEmail)
                .passwordHash(passwordEncoder.encode(adminPassword))
                .role(role)
                .status(UserStatus.ACTIVE)
                .build();

        User savedUser = userRepository.save(rootAdmin);
        log.info("Admin bootstrap: successfully created root user {} with role {} [orgId={}]",
                savedUser.getEmail(), savedUser.getRole(), savedUser.getOrganizationId());
    }
}
