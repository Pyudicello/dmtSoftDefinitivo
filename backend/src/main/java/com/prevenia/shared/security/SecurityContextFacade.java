package com.prevenia.shared.security;

import com.prevenia.shared.domain.ForbiddenException;
import com.prevenia.shared.domain.UnauthorizedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.UUID;

@Component
public class SecurityContextFacade {

    public Optional<AuthenticatedUser> getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof AuthenticatedUser user) {
            return Optional.of(user);
        }
        return Optional.empty();
    }

    public AuthenticatedUser getRequiredUser() {
        return getCurrentUser()
                .orElseThrow(() -> new UnauthorizedException("User is not authenticated"));
    }

    public UUID getRequiredUserId() {
        return getRequiredUser().getUserId();
    }

    public UUID getRequiredOrganizationId() {
        AuthenticatedUser user = getRequiredUser();
        if (user.getOrganizationId() == null && !user.isPlatformAdmin()) {
            throw new ForbiddenException("User does not belong to any organization");
        }
        return user.getOrganizationId();
    }
}
