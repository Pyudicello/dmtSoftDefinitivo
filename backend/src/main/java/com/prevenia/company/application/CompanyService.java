package com.prevenia.company.application;

import com.prevenia.assignment.domain.UserCompanyAssignment;
import com.prevenia.assignment.domain.UserCompanyAssignmentRepository;
import com.prevenia.company.api.dto.CreateCompanyRequest;
import com.prevenia.company.api.dto.CompanyResponse;
import com.prevenia.company.domain.Company;
import com.prevenia.company.domain.CompanyRepository;
import com.prevenia.company.domain.CompanyStatus;
import com.prevenia.organization.domain.OrganizationRepository;
import com.prevenia.shared.domain.DuplicateResourceException;
import com.prevenia.shared.domain.ForbiddenException;
import com.prevenia.shared.domain.ResourceNotFoundException;
import com.prevenia.shared.security.AuthenticatedUser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class CompanyService {

    private final CompanyRepository companyRepository;
    private final OrganizationRepository organizationRepository;
    private final UserCompanyAssignmentRepository assignmentRepository;

    @Transactional
    public CompanyResponse createCompany(CreateCompanyRequest request, AuthenticatedUser caller) {
        log.debug("Creating company '{}' requested by {}", request.getBusinessName(), caller.getEmail());

        if (caller.isTechnician() || caller.isClient()) {
            throw new ForbiddenException("Technicians and clients are not allowed to create companies");
        }

        UUID targetOrganizationId;

        if (caller.isConsultantAdmin()) {
            targetOrganizationId = caller.getOrganizationId();
        } else {
            // PLATFORM_ADMIN
            if (request.getOrganizationId() == null) {
                throw new ForbiddenException("Organization ID is required when creating a company as platform admin");
            }
            if (!organizationRepository.existsById(request.getOrganizationId())) {
                throw new ResourceNotFoundException("Organization", request.getOrganizationId());
            }
            targetOrganizationId = request.getOrganizationId();
        }

        if (StringUtils.hasText(request.getTaxId())) {
            String trimmedTaxId = request.getTaxId().trim();
            if (companyRepository.existsByTaxIdAndOrganizationId(trimmedTaxId, targetOrganizationId)) {
                throw new DuplicateResourceException("Company", "taxId", trimmedTaxId);
            }
        }

        Company company = Company.builder()
                .organizationId(targetOrganizationId)
                .businessName(request.getBusinessName().trim())
                .legalName(StringUtils.hasText(request.getLegalName()) ? request.getLegalName().trim() : null)
                .taxId(StringUtils.hasText(request.getTaxId()) ? request.getTaxId().trim() : null)
                .address(StringUtils.hasText(request.getAddress()) ? request.getAddress().trim() : null)
                .city(StringUtils.hasText(request.getCity()) ? request.getCity().trim() : null)
                .province(StringUtils.hasText(request.getProvince()) ? request.getProvince().trim() : null)
                .country(StringUtils.hasText(request.getCountry()) ? request.getCountry().trim() : "AR")
                .email(StringUtils.hasText(request.getEmail()) ? request.getEmail().trim().toLowerCase() : null)
                .phone(StringUtils.hasText(request.getPhone()) ? request.getPhone().trim() : null)
                .status(CompanyStatus.ACTIVE)
                .build();

        Company savedCompany = companyRepository.save(company);

        log.info("Company '{}' (ID: {}) created in org {} by {}",
                savedCompany.getBusinessName(), savedCompany.getId(), targetOrganizationId, caller.getEmail());

        return CompanyResponse.fromEntity(savedCompany);
    }

    @Transactional(readOnly = true)
    public Page<CompanyResponse> listCompanies(Pageable pageable, AuthenticatedUser caller) {
        log.debug("Listing companies requested by {} with role {}", caller.getEmail(), caller.getRole());

        if (caller.isPlatformAdmin()) {
            return companyRepository.findAll(pageable).map(CompanyResponse::fromEntity);
        }

        if (caller.isConsultantAdmin()) {
            return companyRepository.findAllByOrganizationId(caller.getOrganizationId(), pageable)
                    .map(CompanyResponse::fromEntity);
        }

        if (caller.isTechnician()) {
            List<UserCompanyAssignment> assignments = assignmentRepository
                    .findAllByOrganizationIdAndUserIdAndActiveTrue(caller.getOrganizationId(), caller.getUserId());

            if (assignments.isEmpty()) {
                return Page.empty(pageable);
            }

            List<UUID> assignedCompanyIds = assignments.stream()
                    .map(UserCompanyAssignment::getCompanyId)
                    .toList();

            return companyRepository.findAllByIdInAndOrganizationId(assignedCompanyIds, caller.getOrganizationId(), pageable)
                    .map(CompanyResponse::fromEntity);
        }

        if (caller.isClient()) {
            if (caller.getCompanyId() == null) {
                return Page.empty(pageable);
            }
            return companyRepository.findAllByIdInAndOrganizationId(
                    Collections.singletonList(caller.getCompanyId()),
                    caller.getOrganizationId(),
                    pageable
            ).map(CompanyResponse::fromEntity);
        }

        throw new ForbiddenException("Invalid role permissions");
    }

    @Transactional(readOnly = true)
    public CompanyResponse getCompanyById(UUID id, AuthenticatedUser caller) {
        log.debug("Fetching company {} requested by {} with role {}", id, caller.getEmail(), caller.getRole());

        if (caller.isPlatformAdmin()) {
            Company company = companyRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Company", id));
            return CompanyResponse.fromEntity(company);
        }

        if (caller.isConsultantAdmin()) {
            Company company = companyRepository.findByIdAndOrganizationId(id, caller.getOrganizationId())
                    .orElseThrow(() -> new ResourceNotFoundException("Company", id));
            return CompanyResponse.fromEntity(company);
        }

        if (caller.isTechnician()) {
            boolean isAssigned = assignmentRepository
                    .existsByOrganizationIdAndUserIdAndCompanyIdAndActiveTrue(caller.getOrganizationId(), caller.getUserId(), id);

            if (!isAssigned) {
                // Return 404 (ResourceNotFoundException) for anti-enumeration & IDOR prevention
                log.warn("Technician {} tried to access unassigned or foreign company {}", caller.getEmail(), id);
                throw new ResourceNotFoundException("Company", id);
            }

            Company company = companyRepository.findByIdAndOrganizationId(id, caller.getOrganizationId())
                    .orElseThrow(() -> new ResourceNotFoundException("Company", id));
            return CompanyResponse.fromEntity(company);
        }

        if (caller.isClient()) {
            if (caller.getCompanyId() == null || !caller.getCompanyId().equals(id)) {
                log.warn("Client {} tried to access company {} (assigned: {})", caller.getEmail(), id, caller.getCompanyId());
                throw new ResourceNotFoundException("Company", id);
            }

            Company company = companyRepository.findByIdAndOrganizationId(id, caller.getOrganizationId())
                    .orElseThrow(() -> new ResourceNotFoundException("Company", id));
            return CompanyResponse.fromEntity(company);
        }

        throw new ForbiddenException("Invalid role permissions");
    }
}
