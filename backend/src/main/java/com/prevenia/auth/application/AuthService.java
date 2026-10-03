package com.prevenia.auth.application;

import com.prevenia.auth.api.dto.LoginRequest;
import com.prevenia.auth.api.dto.LoginResponse;
import com.prevenia.auth.api.dto.UserSummaryDto;
import com.prevenia.shared.domain.UnauthorizedException;
import com.prevenia.shared.security.JwtTokenService;
import com.prevenia.user.domain.User;
import com.prevenia.user.domain.UserRepository;
import com.prevenia.user.domain.UserStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenService jwtTokenService;

    @Transactional(readOnly = true)
    public LoginResponse authenticate(LoginRequest request) {
        log.debug("Authentication attempt for email: {}", request.getEmail());

        User user = userRepository.findByEmail(request.getEmail().trim().toLowerCase())
                .orElseThrow(() -> {
                    log.warn("Authentication failed: user with email {} not found", request.getEmail());
                    return new UnauthorizedException("Invalid email or password");
                });

        if (user.getStatus() != UserStatus.ACTIVE) {
            log.warn("Authentication failed: user {} is not active (status: {})", user.getEmail(), user.getStatus());
            throw new UnauthorizedException("User account is inactive or blocked");
        }

        if (user.getPasswordHash() == null || !passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            log.warn("Authentication failed: invalid password for user {}", user.getEmail());
            throw new UnauthorizedException("Invalid email or password");
        }

        String token = jwtTokenService.generateToken(user);
        long expiresInSeconds = jwtTokenService.getExpirationSeconds();

        log.info("User {} authenticated successfully with role {} [orgId: {}]",
                user.getEmail(), user.getRole(), user.getOrganizationId());

        UserSummaryDto userSummary = UserSummaryDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .role(user.getRole())
                .organizationId(user.getOrganizationId())
                .companyId(user.getCompanyId())
                .build();

        return LoginResponse.builder()
                .accessToken(token)
                .tokenType("Bearer")
                .expiresIn(expiresInSeconds)
                .user(userSummary)
                .build();
    }
}
