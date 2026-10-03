package com.prevenia.organization.api;

import com.prevenia.organization.api.dto.OrganizationResponse;
import com.prevenia.organization.application.OrganizationService;
import com.prevenia.shared.security.AuthenticatedUser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/organizations")
@RequiredArgsConstructor
public class OrganizationController {

    private final OrganizationService organizationService;

    @GetMapping("/{id}")
    public ResponseEntity<OrganizationResponse> getOrganizationById(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthenticatedUser caller
    ) {
        log.debug("GET /api/v1/organizations/{} by {}", id, caller.getEmail());
        OrganizationResponse response = organizationService.getOrganizationById(id, caller);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    @PreAuthorize("hasRole('PLATFORM_ADMIN')")
    public ResponseEntity<Page<OrganizationResponse>> listOrganizations(
            @PageableDefault(size = 20) Pageable pageable,
            @AuthenticationPrincipal AuthenticatedUser caller
    ) {
        log.debug("GET /api/v1/organizations by {}", caller.getEmail());
        Page<OrganizationResponse> response = organizationService.listOrganizations(pageable, caller);
        return ResponseEntity.ok(response);
    }
}
