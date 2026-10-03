package com.prevenia.organization.application;

import com.prevenia.organization.api.dto.OrganizationResponse;
import com.prevenia.organization.domain.Organization;
import com.prevenia.organization.domain.OrganizationRepository;
import com.prevenia.shared.domain.ForbiddenException;
import com.prevenia.shared.domain.ResourceNotFoundException;
import com.prevenia.shared.security.AuthenticatedUser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrganizationService {

    private final OrganizationRepository organizationRepository;

    @Transactional(readOnly = true)
    public OrganizationResponse getOrganizationById(UUID id, AuthenticatedUser caller) {
        log.debug("Fetching organization {} by {}", id, caller.getEmail());

        if (!caller.isPlatformAdmin() && !id.equals(caller.getOrganizationId())) {
            throw new ResourceNotFoundException("Organization", id);
        }

        Organization org = organizationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Organization", id));

        return OrganizationResponse.fromEntity(org);
    }

    @Transactional(readOnly = true)
    public Page<OrganizationResponse> listOrganizations(Pageable pageable, AuthenticatedUser caller) {
        log.debug("Listing organizations by {}", caller.getEmail());

        if (!caller.isPlatformAdmin()) {
            throw new ForbiddenException("Only platform administrators can list all organizations");
        }

        return organizationRepository.findAll(pageable).map(OrganizationResponse::fromEntity);
    }
}
