package com.prevenia.shared.security;

import com.prevenia.user.domain.UserRole;
import lombok.Builder;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Getter
@Builder
public class AuthenticatedUser implements UserDetails {

    private final UUID userId;
    private final String email;
    private final UserRole role;
    private final UUID organizationId;
    private final UUID companyId;

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override
    public String getPassword() {
        return null;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }

    public boolean isPlatformAdmin() {
        return role == UserRole.PLATFORM_ADMIN;
    }

    public boolean isConsultantAdmin() {
        return role == UserRole.CONSULTANT_ADMIN;
    }

    public boolean isTechnician() {
        return role == UserRole.TECHNICIAN;
    }

    public boolean isClient() {
        return role == UserRole.CLIENT;
    }
}
