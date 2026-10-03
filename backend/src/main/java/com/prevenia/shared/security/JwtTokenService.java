package com.prevenia.shared.security;

import com.prevenia.user.domain.User;
import com.prevenia.user.domain.UserRole;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
public class JwtTokenService {

    @Value("${app.security.jwt.secret:404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970}")
    private String jwtSecret;

    @Value("${app.security.jwt.expiration-minutes:1440}")
    private long expirationMinutes;

    private SecretKey signingKey;

    @PostConstruct
    public void init() {
        byte[] keyBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);
        if (keyBytes.length < 32) {
            String padded = String.format("%-32s", jwtSecret).replace(' ', '0');
            keyBytes = padded.getBytes(StandardCharsets.UTF_8);
        }
        this.signingKey = Keys.hmacShaKeyFor(keyBytes);
    }

    public String generateToken(User user) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + (expirationMinutes * 60 * 1000));

        var builder = Jwts.builder()
                .subject(user.getId().toString())
                .claim("email", user.getEmail())
                .claim("role", user.getRole().name())
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(signingKey);

        if (user.getOrganizationId() != null) {
            builder.claim("organizationId", user.getOrganizationId().toString());
        }
        if (user.getCompanyId() != null) {
            builder.claim("companyId", user.getCompanyId().toString());
        }

        return builder.compact();
    }

    public long getExpirationSeconds() {
        return expirationMinutes * 60;
    }

    public Optional<Claims> extractClaims(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(signingKey)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            return Optional.of(claims);
        } catch (JwtException | IllegalArgumentException e) {
            log.debug("JWT validation error: {}", e.getMessage());
            return Optional.empty();
        }
    }

    public Optional<AuthenticatedUser> parseToken(String token) {
        return extractClaims(token).map(claims -> {
            UUID userId = UUID.fromString(claims.getSubject());
            String email = claims.get("email", String.class);
            String roleStr = claims.get("role", String.class);
            UserRole role = UserRole.valueOf(roleStr);

            String orgIdStr = claims.get("organizationId", String.class);
            UUID orgId = orgIdStr != null ? UUID.fromString(orgIdStr) : null;

            String compIdStr = claims.get("companyId", String.class);
            UUID compId = compIdStr != null ? UUID.fromString(compIdStr) : null;

            return AuthenticatedUser.builder()
                    .userId(userId)
                    .email(email)
                    .role(role)
                    .organizationId(orgId)
                    .companyId(compId)
                    .build();
        });
    }
}
