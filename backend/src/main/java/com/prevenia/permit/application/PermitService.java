package com.prevenia.permit.application;

import com.prevenia.assignment.domain.UserCompanyAssignment;
import com.prevenia.assignment.domain.UserCompanyAssignmentRepository;
import com.prevenia.company.domain.Company;
import com.prevenia.company.domain.CompanyRepository;
import com.prevenia.expiration.api.dto.CompanySummaryDto;
import com.prevenia.expiration.application.ExpirationDeadlineClassifier;
import com.prevenia.expiration.domain.Expiration;
import com.prevenia.expiration.domain.ExpirationCategory;
import com.prevenia.expiration.domain.ExpirationCategoryRepository;
import com.prevenia.expiration.domain.ExpirationDeadlineStatus;
import com.prevenia.expiration.domain.ExpirationLifecycleStatus;
import com.prevenia.expiration.domain.ExpirationRepository;
import com.prevenia.expiration.domain.RecurrenceType;
import com.prevenia.expiration.domain.exception.InvalidExpirationDateException;
import com.prevenia.permit.api.dto.CancelPermitRequest;
import com.prevenia.permit.api.dto.CreatePermitRequest;
import com.prevenia.permit.api.dto.PermitFilterRequest;
import com.prevenia.permit.api.dto.PermitResponse;
import com.prevenia.permit.api.dto.RenewPermitRequest;
import com.prevenia.permit.api.dto.UpdatePermitRequest;
import com.prevenia.permit.domain.Permit;
import com.prevenia.permit.domain.PermitRepository;
import com.prevenia.permit.domain.PermitStatus;
import com.prevenia.shared.domain.ForbiddenException;
import com.prevenia.shared.domain.ResourceNotFoundException;
import com.prevenia.shared.security.AuthenticatedUser;
import com.prevenia.shared.security.SecurityContextFacade;
import com.prevenia.user.domain.UserRole;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PermitService {

    private static final UUID SYSTEM_DOCUMENTATION_CATEGORY_ID = UUID.fromString("a0000000-0000-0000-0000-000000000009");
    private static final String CATEGORY_CODE_DOCUMENTATION = "DOCUMENTACION";

    private final PermitRepository permitRepository;
    private final CompanyRepository companyRepository;
    private final ExpirationRepository expirationRepository;
    private final ExpirationCategoryRepository categoryRepository;
    private final UserCompanyAssignmentRepository assignmentRepository;
    private final SecurityContextFacade securityContextFacade;
    private final ExpirationDeadlineClassifier deadlineClassifier;
    private final Clock clock;

    @Transactional(readOnly = true)
    public Page<PermitResponse> listPermits(PermitFilterRequest filters, Pageable pageable) {
        AuthenticatedUser currentUser = securityContextFacade.getRequiredUser();
        Set<UUID> assignedCompanyIds = getTechnicianAssignedCompanyIds(currentUser);

        if (filters != null && filters.getCompanyId() != null) {
            validateCompanyAccess(currentUser, filters.getCompanyId(), assignedCompanyIds);
        }

        Pageable effectivePageable = pageable;
        if (pageable.getSort().isUnsorted()) {
            effectivePageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(),
                    Sort.by(Sort.Direction.ASC, "expirationDate").and(Sort.by(Sort.Direction.DESC, "createdAt")));
        }

        Specification<Permit> spec = PermitSpecification.buildSpecification(currentUser, assignedCompanyIds, filters);
        Page<Permit> page = permitRepository.findAll(spec, effectivePageable);
        return enrichAndMapPage(page);
    }

    @Transactional(readOnly = true)
    public Page<PermitResponse> listCompanyPermits(UUID companyId, PermitFilterRequest filters, Pageable pageable) {
        AuthenticatedUser currentUser = securityContextFacade.getRequiredUser();
        Set<UUID> assignedCompanyIds = getTechnicianAssignedCompanyIds(currentUser);
        validateCompanyAccess(currentUser, companyId, assignedCompanyIds);

        PermitFilterRequest effectiveFilters = filters != null ? filters : new PermitFilterRequest();
        effectiveFilters.setCompanyId(companyId);
        return listPermits(effectiveFilters, pageable);
    }

    @Transactional(readOnly = true)
    public Page<PermitResponse> getCompanyPermitHistory(UUID companyId, Pageable pageable) {
        AuthenticatedUser currentUser = securityContextFacade.getRequiredUser();
        Set<UUID> assignedCompanyIds = getTechnicianAssignedCompanyIds(currentUser);
        validateCompanyAccess(currentUser, companyId, assignedCompanyIds);

        Pageable effectivePageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(),
                Sort.by(Sort.Direction.DESC, "issueDate").and(Sort.by(Sort.Direction.DESC, "createdAt")));

        PermitFilterRequest filters = PermitFilterRequest.builder()
                .companyId(companyId)
                .build();

        Specification<Permit> spec = PermitSpecification.buildSpecification(currentUser, assignedCompanyIds, filters);
        Page<Permit> page = permitRepository.findAll(spec, effectivePageable);
        return enrichAndMapPage(page);
    }

    @Transactional(readOnly = true)
    public PermitResponse getPermitById(UUID id) {
        AuthenticatedUser currentUser = securityContextFacade.getRequiredUser();
        Permit permit = permitRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Permit", id));

        Set<UUID> assignedCompanyIds = getTechnicianAssignedCompanyIds(currentUser);
        validatePermitAccess(currentUser, permit, assignedCompanyIds);

        return enrichAndMapSingle(permit);
    }

    @Transactional
    public PermitResponse createPermit(CreatePermitRequest request) {
        AuthenticatedUser currentUser = securityContextFacade.getRequiredUser();

        if (currentUser.getRole() == UserRole.CLIENT) {
            throw new ForbiddenException("Client users cannot create permits/habilitaciones");
        }

        if (request.getIssueDate().isAfter(request.getExpirationDate())) {
            throw new InvalidExpirationDateException("Issue date (" + request.getIssueDate() + ") cannot be after expiration date (" + request.getExpirationDate() + ")");
        }

        Set<UUID> assignedCompanyIds = getTechnicianAssignedCompanyIds(currentUser);
        Company company = validateAndGetCompanyForWrite(currentUser, request.getCompanyId(), assignedCompanyIds);

        Permit permit = Permit.builder()
                .organizationId(company.getOrganizationId())
                .companyId(company.getId())
                .type(request.getType())
                .issuingAuthority(request.getIssuingAuthority().trim())
                .permitNumber(request.getPermitNumber().trim())
                .issueDate(request.getIssueDate())
                .expirationDate(request.getExpirationDate())
                .status(PermitStatus.ACTIVE)
                .contactName(request.getContactName())
                .contactPhone(request.getContactPhone())
                .contactEmail(request.getContactEmail())
                .notes(request.getNotes())
                .documentReference(request.getDocumentReference())
                .previousPermitId(request.getPreviousPermitId())
                .createdBy(currentUser.getUserId())
                .build();

        // Synchronize with the Expiration engine
        Expiration expiration = createLinkedExpiration(company, permit, currentUser);
        permit.setExpirationId(expiration.getId());

        Permit saved = permitRepository.save(permit);
        log.info("Permit '{}' ({}) created for company '{}' by user {}",
                saved.getPermitNumber(), saved.getId(), company.getBusinessName(), currentUser.getEmail());

        return enrichAndMapSingle(saved);
    }

    @Transactional
    public PermitResponse renewPermit(UUID previousPermitId, RenewPermitRequest request) {
        AuthenticatedUser currentUser = securityContextFacade.getRequiredUser();

        if (currentUser.getRole() == UserRole.CLIENT) {
            throw new ForbiddenException("Client users cannot renew permits");
        }

        if (request.getIssueDate().isAfter(request.getExpirationDate())) {
            throw new InvalidExpirationDateException("Issue date (" + request.getIssueDate() + ") cannot be after expiration date (" + request.getExpirationDate() + ")");
        }

        Permit previousPermit = permitRepository.findById(previousPermitId)
                .orElseThrow(() -> new ResourceNotFoundException("Permit", previousPermitId));

        Set<UUID> assignedCompanyIds = getTechnicianAssignedCompanyIds(currentUser);
        validatePermitAccess(currentUser, previousPermit, assignedCompanyIds);

        Company company = companyRepository.findById(previousPermit.getCompanyId())
                .orElseThrow(() -> new ResourceNotFoundException("Company", previousPermit.getCompanyId()));

        // 1. Archive previous permit (mark RENEWED)
        previousPermit.setStatus(PermitStatus.RENEWED);
        previousPermit.setUpdatedBy(currentUser.getUserId());
        permitRepository.save(previousPermit);

        // 2. Complete previous permit's expiration in the core engine
        if (previousPermit.getExpirationId() != null) {
            completeLinkedExpiration(previousPermit.getExpirationId(), "Renovado mediante trámite N° " + request.getPermitNumber(), currentUser);
        }

        // 3. Create the new renewed permit
        String authority = (request.getIssuingAuthority() != null && !request.getIssuingAuthority().trim().isEmpty())
                ? request.getIssuingAuthority().trim()
                : previousPermit.getIssuingAuthority();

        Permit newPermit = Permit.builder()
                .organizationId(company.getOrganizationId())
                .companyId(company.getId())
                .type(previousPermit.getType())
                .issuingAuthority(authority)
                .permitNumber(request.getPermitNumber().trim())
                .issueDate(request.getIssueDate())
                .expirationDate(request.getExpirationDate())
                .status(PermitStatus.ACTIVE)
                .contactName(request.getContactName() != null ? request.getContactName() : previousPermit.getContactName())
                .contactPhone(request.getContactPhone() != null ? request.getContactPhone() : previousPermit.getContactPhone())
                .contactEmail(request.getContactEmail() != null ? request.getContactEmail() : previousPermit.getContactEmail())
                .notes(request.getNotes())
                .documentReference(request.getDocumentReference())
                .previousPermitId(previousPermit.getId())
                .createdBy(currentUser.getUserId())
                .build();

        // 4. Create new linked expiration in the Expiration engine
        Expiration newExpiration = createLinkedExpiration(company, newPermit, currentUser);
        newPermit.setExpirationId(newExpiration.getId());

        Permit savedNewPermit = permitRepository.save(newPermit);
        log.info("Permit ({}) renewed into new permit ({}) by user {}",
                previousPermit.getId(), savedNewPermit.getId(), currentUser.getEmail());

        return enrichAndMapSingle(savedNewPermit);
    }

    @Transactional
    public PermitResponse updatePermit(UUID id, UpdatePermitRequest request) {
        AuthenticatedUser currentUser = securityContextFacade.getRequiredUser();

        if (currentUser.getRole() == UserRole.CLIENT) {
            throw new ForbiddenException("Client users cannot edit permits");
        }

        if (request.getIssueDate().isAfter(request.getExpirationDate())) {
            throw new InvalidExpirationDateException("Issue date cannot be after expiration date");
        }

        Permit permit = permitRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Permit", id));

        Set<UUID> assignedCompanyIds = getTechnicianAssignedCompanyIds(currentUser);
        validatePermitAccess(currentUser, permit, assignedCompanyIds);

        Company company = companyRepository.findById(permit.getCompanyId())
                .orElseThrow(() -> new ResourceNotFoundException("Company", permit.getCompanyId()));

        permit.setType(request.getType());
        permit.setIssuingAuthority(request.getIssuingAuthority().trim());
        permit.setPermitNumber(request.getPermitNumber().trim());
        permit.setIssueDate(request.getIssueDate());
        permit.setExpirationDate(request.getExpirationDate());
        if (request.getStatus() != null) {
            permit.setStatus(request.getStatus());
        }
        permit.setContactName(request.getContactName());
        permit.setContactPhone(request.getContactPhone());
        permit.setContactEmail(request.getContactEmail());
        permit.setNotes(request.getNotes());
        permit.setDocumentReference(request.getDocumentReference());
        permit.setUpdatedBy(currentUser.getUserId());

        // Update or create linked expiration
        if (permit.getExpirationId() != null) {
            updateLinkedExpiration(permit.getExpirationId(), permit, currentUser);
        } else {
            Expiration expiration = createLinkedExpiration(company, permit, currentUser);
            permit.setExpirationId(expiration.getId());
        }

        Permit saved = permitRepository.save(permit);
        log.info("Permit ({}) updated by user {}", saved.getId(), currentUser.getEmail());
        return enrichAndMapSingle(saved);
    }

    @Transactional
    public PermitResponse cancelPermit(UUID id, CancelPermitRequest request) {
        AuthenticatedUser currentUser = securityContextFacade.getRequiredUser();

        if (currentUser.getRole() == UserRole.CLIENT) {
            throw new ForbiddenException("Client users cannot cancel permits");
        }

        Permit permit = permitRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Permit", id));

        Set<UUID> assignedCompanyIds = getTechnicianAssignedCompanyIds(currentUser);
        validatePermitAccess(currentUser, permit, assignedCompanyIds);

        permit.setStatus(PermitStatus.CANCELLED);
        permit.setUpdatedBy(currentUser.getUserId());

        if (permit.getExpirationId() != null) {
            String reason = request != null && request.getReason() != null ? request.getReason() : "Permit cancelled";
            cancelLinkedExpiration(permit.getExpirationId(), reason, currentUser);
        }

        Permit saved = permitRepository.save(permit);
        log.info("Permit ({}) cancelled by user {}", saved.getId(), currentUser.getEmail());
        return enrichAndMapSingle(saved);
    }

    @Transactional
    public void deletePermit(UUID id) {
        AuthenticatedUser currentUser = securityContextFacade.getRequiredUser();

        if (currentUser.getRole() == UserRole.CLIENT) {
            throw new ForbiddenException("Client users cannot delete permits");
        }

        Permit permit = permitRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Permit", id));

        Set<UUID> assignedCompanyIds = getTechnicianAssignedCompanyIds(currentUser);
        validatePermitAccess(currentUser, permit, assignedCompanyIds);

        if (permit.getExpirationId() != null) {
            cancelLinkedExpiration(permit.getExpirationId(), "Permit deleted", currentUser);
        }

        permitRepository.delete(permit);
        log.info("Permit ({}) deleted by user {}", id, currentUser.getEmail());
    }

    // --- Linked Expiration Sync Helpers ---

    private Expiration createLinkedExpiration(Company company, Permit permit, AuthenticatedUser currentUser) {
        UUID categoryId = resolveDocumentationCategoryId(company.getOrganizationId());

        String title = "Habilitación/Visado: " + permit.getIssuingAuthority() + " (" + permit.getPermitNumber() + ")";
        String description = "Habilitación oficial (" + permit.getType().getLabel() + ") emitida por " + permit.getIssuingAuthority() +
                ". Expediente/N°: " + permit.getPermitNumber() +
                (permit.getDocumentReference() != null ? ". Ref: " + permit.getDocumentReference() : "");

        Expiration expiration = Expiration.builder()
                .organizationId(company.getOrganizationId())
                .companyId(company.getId())
                .categoryId(categoryId)
                .title(title.length() > 200 ? title.substring(0, 200) : title)
                .description(description)
                .issueDate(permit.getIssueDate())
                .expirationDate(permit.getExpirationDate())
                .lifecycleStatus(permit.getStatus() == PermitStatus.ACTIVE ? ExpirationLifecycleStatus.ACTIVE : ExpirationLifecycleStatus.CANCELLED)
                .recurrenceType(RecurrenceType.NONE)
                .notificationDaysBefore(30)
                .notes("Vencimiento de habilitación / visado registrado en módulo de Habilitaciones.")
                .createdBy(currentUser.getUserId())
                .build();

        return expirationRepository.save(expiration);
    }

    private void updateLinkedExpiration(UUID expirationId, Permit permit, AuthenticatedUser currentUser) {
        expirationRepository.findById(expirationId).ifPresent(expiration -> {
            String title = "Habilitación/Visado: " + permit.getIssuingAuthority() + " (" + permit.getPermitNumber() + ")";
            expiration.setTitle(title.length() > 200 ? title.substring(0, 200) : title);
            expiration.setIssueDate(permit.getIssueDate());
            expiration.setExpirationDate(permit.getExpirationDate());
            if (permit.getStatus() == PermitStatus.ACTIVE) {
                expiration.setLifecycleStatus(ExpirationLifecycleStatus.ACTIVE);
            } else if (permit.getStatus() == PermitStatus.RENEWED) {
                expiration.setLifecycleStatus(ExpirationLifecycleStatus.COMPLETED);
            } else if (permit.getStatus() == PermitStatus.CANCELLED) {
                expiration.setLifecycleStatus(ExpirationLifecycleStatus.CANCELLED);
            }
            expiration.setUpdatedBy(currentUser.getUserId());
            expirationRepository.save(expiration);
        });
    }

    private void completeLinkedExpiration(UUID expirationId, String notes, AuthenticatedUser currentUser) {
        expirationRepository.findById(expirationId).ifPresent(expiration -> {
            expiration.setLifecycleStatus(ExpirationLifecycleStatus.COMPLETED);
            expiration.setCompletedAt(OffsetDateTime.now(clock));
            expiration.setCompletionNotes(notes);
            expiration.setUpdatedBy(currentUser.getUserId());
            expirationRepository.save(expiration);
        });
    }

    private void cancelLinkedExpiration(UUID expirationId, String reason, AuthenticatedUser currentUser) {
        expirationRepository.findById(expirationId).ifPresent(expiration -> {
            expiration.setLifecycleStatus(ExpirationLifecycleStatus.CANCELLED);
            expiration.setCancelledAt(OffsetDateTime.now(clock));
            expiration.setCancelReason(reason);
            expiration.setUpdatedBy(currentUser.getUserId());
            expirationRepository.save(expiration);
        });
    }

    private UUID resolveDocumentationCategoryId(UUID organizationId) {
        return categoryRepository.findByOrganizationIdAndCodeIgnoreCase(organizationId, CATEGORY_CODE_DOCUMENTATION)
                .or(() -> categoryRepository.findByOrganizationIdIsNullAndCodeIgnoreCase(CATEGORY_CODE_DOCUMENTATION))
                .map(ExpirationCategory::getId)
                .orElse(SYSTEM_DOCUMENTATION_CATEGORY_ID);
    }

    // --- Helper Validation & Mapping Methods ---

    private Set<UUID> getTechnicianAssignedCompanyIds(AuthenticatedUser user) {
        if (user.getRole() == UserRole.TECHNICIAN) {
            return assignmentRepository.findByUserIdAndActiveTrue(user.getUserId()).stream()
                    .map(UserCompanyAssignment::getCompanyId)
                    .collect(Collectors.toSet());
        }
        return Set.of();
    }

    private void validateCompanyAccess(AuthenticatedUser user, UUID companyId, Set<UUID> assignedCompanyIds) {
        if (user.getRole() == UserRole.PLATFORM_ADMIN) {
            return;
        }

        Company company = companyRepository.findById(companyId)
                .filter(Company::isActive)
                .orElseThrow(() -> new ResourceNotFoundException("Company", companyId));

        if (user.getRole() == UserRole.CONSULTANT_ADMIN) {
            if (!company.getOrganizationId().equals(user.getOrganizationId())) {
                throw new ResourceNotFoundException("Company", companyId);
            }
        } else if (user.getRole() == UserRole.TECHNICIAN) {
            if (!company.getOrganizationId().equals(user.getOrganizationId()) || !assignedCompanyIds.contains(companyId)) {
                throw new ResourceNotFoundException("Company", companyId);
            }
        } else if (user.getRole() == UserRole.CLIENT) {
            if (!companyId.equals(user.getCompanyId())) {
                throw new ResourceNotFoundException("Company", companyId);
            }
        }
    }

    private Company validateAndGetCompanyForWrite(AuthenticatedUser user, UUID companyId, Set<UUID> assignedCompanyIds) {
        Company company = companyRepository.findById(companyId)
                .filter(Company::isActive)
                .orElseThrow(() -> new ResourceNotFoundException("Company", companyId));

        if (user.getRole() == UserRole.PLATFORM_ADMIN) {
            return company;
        }

        if (user.getRole() == UserRole.CONSULTANT_ADMIN) {
            if (!company.getOrganizationId().equals(user.getOrganizationId())) {
                throw new ResourceNotFoundException("Company", companyId);
            }
        } else if (user.getRole() == UserRole.TECHNICIAN) {
            if (!company.getOrganizationId().equals(user.getOrganizationId()) || !assignedCompanyIds.contains(companyId)) {
                throw new ForbiddenException("You are not assigned to company: " + company.getBusinessName());
            }
        }
        return company;
    }

    private void validatePermitAccess(AuthenticatedUser user, Permit permit, Set<UUID> assignedCompanyIds) {
        if (user.getRole() == UserRole.PLATFORM_ADMIN) {
            return;
        }
        if (!permit.getOrganizationId().equals(user.getOrganizationId())) {
            throw new ResourceNotFoundException("Permit", permit.getId());
        }
        if (user.getRole() == UserRole.TECHNICIAN && !assignedCompanyIds.contains(permit.getCompanyId())) {
            throw new ResourceNotFoundException("Permit", permit.getId());
        }
        if (user.getRole() == UserRole.CLIENT && !Objects.equals(user.getCompanyId(), permit.getCompanyId())) {
            throw new ResourceNotFoundException("Permit", permit.getId());
        }
    }

    private PermitResponse enrichAndMapSingle(Permit permit) {
        CompanySummaryDto companyDto = companyRepository.findById(permit.getCompanyId())
                .map(c -> CompanySummaryDto.builder()
                        .id(c.getId())
                        .businessName(c.getBusinessName())
                        .legalName(c.getLegalName())
                        .taxId(c.getTaxId())
                        .build())
                .orElse(null);

        String prevNumber = null;
        if (permit.getPreviousPermitId() != null) {
            prevNumber = permitRepository.findById(permit.getPreviousPermitId())
                    .map(Permit::getPermitNumber)
                    .orElse(null);
        }

        var classification = deadlineClassifier.classify(
                permit.getExpirationDate(),
                permit.getStatus() == PermitStatus.ACTIVE ? ExpirationLifecycleStatus.ACTIVE : ExpirationLifecycleStatus.CANCELLED
        );

        return PermitResponse.builder()
                .id(permit.getId())
                .organizationId(permit.getOrganizationId())
                .company(companyDto)
                .type(permit.getType())
                .typeLabel(permit.getType().getLabel())
                .issuingAuthority(permit.getIssuingAuthority())
                .permitNumber(permit.getPermitNumber())
                .issueDate(permit.getIssueDate())
                .expirationDate(permit.getExpirationDate())
                .status(permit.getStatus())
                .statusLabel(permit.getStatus().getLabel())
                .contactName(permit.getContactName())
                .contactPhone(permit.getContactPhone())
                .contactEmail(permit.getContactEmail())
                .notes(permit.getNotes())
                .documentReference(permit.getDocumentReference())
                .previousPermitId(permit.getPreviousPermitId())
                .previousPermitNumber(prevNumber)
                .expirationId(permit.getExpirationId())
                .deadlineStatus(classification.deadlineStatus())
                .daysUntilExpiration(classification.daysUntilExpiration())
                .createdAt(permit.getCreatedAt())
                .updatedAt(permit.getUpdatedAt())
                .build();
    }

    private Page<PermitResponse> enrichAndMapPage(Page<Permit> page) {
        Set<UUID> companyIds = page.getContent().stream()
                .map(Permit::getCompanyId)
                .collect(Collectors.toSet());

        Map<UUID, CompanySummaryDto> companyMap = companyRepository.findAllById(companyIds).stream()
                .map(c -> CompanySummaryDto.builder()
                        .id(c.getId())
                        .businessName(c.getBusinessName())
                        .legalName(c.getLegalName())
                        .taxId(c.getTaxId())
                        .build())
                .collect(Collectors.toMap(CompanySummaryDto::getId, Function.identity()));

        Set<UUID> prevIds = page.getContent().stream()
                .map(Permit::getPreviousPermitId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Map<UUID, String> prevNumberMap = prevIds.isEmpty() ? Map.of() : permitRepository.findAllById(prevIds).stream()
                .collect(Collectors.toMap(Permit::getId, Permit::getPermitNumber));

        return page.map(permit -> {
            var classification = deadlineClassifier.classify(
                    permit.getExpirationDate(),
                    permit.getStatus() == PermitStatus.ACTIVE ? ExpirationLifecycleStatus.ACTIVE : ExpirationLifecycleStatus.CANCELLED
            );

            return PermitResponse.builder()
                    .id(permit.getId())
                    .organizationId(permit.getOrganizationId())
                    .company(companyMap.get(permit.getCompanyId()))
                    .type(permit.getType())
                    .typeLabel(permit.getType().getLabel())
                    .issuingAuthority(permit.getIssuingAuthority())
                    .permitNumber(permit.getPermitNumber())
                    .issueDate(permit.getIssueDate())
                    .expirationDate(permit.getExpirationDate())
                    .status(permit.getStatus())
                    .statusLabel(permit.getStatus().getLabel())
                    .contactName(permit.getContactName())
                    .contactPhone(permit.getContactPhone())
                    .contactEmail(permit.getContactEmail())
                    .notes(permit.getNotes())
                    .documentReference(permit.getDocumentReference())
                    .previousPermitId(permit.getPreviousPermitId())
                    .previousPermitNumber(permit.getPreviousPermitId() != null ? prevNumberMap.get(permit.getPreviousPermitId()) : null)
                    .expirationId(permit.getExpirationId())
                    .deadlineStatus(classification.deadlineStatus())
                    .daysUntilExpiration(classification.daysUntilExpiration())
                    .createdAt(permit.getCreatedAt())
                    .updatedAt(permit.getUpdatedAt())
                    .build();
        });
    }
}
