package com.prevenia.inspection.application;

import com.prevenia.assignment.domain.UserCompanyAssignment;
import com.prevenia.assignment.domain.UserCompanyAssignmentRepository;
import com.prevenia.company.domain.Company;
import com.prevenia.company.domain.CompanyRepository;
import com.prevenia.expiration.api.dto.CompanySummaryDto;
import com.prevenia.expiration.application.ExpirationDeadlineClassifier;
import com.prevenia.expiration.domain.Expiration;
import com.prevenia.expiration.domain.ExpirationCategory;
import com.prevenia.expiration.domain.ExpirationCategoryRepository;
import com.prevenia.expiration.domain.ExpirationLifecycleStatus;
import com.prevenia.expiration.domain.ExpirationRepository;
import com.prevenia.expiration.domain.RecurrenceType;
import com.prevenia.inspection.api.dto.CreateInspectionRequest;
import com.prevenia.inspection.api.dto.InspectionFilterRequest;
import com.prevenia.inspection.api.dto.InspectionResponse;
import com.prevenia.inspection.api.dto.UpdateInspectionRequest;
import com.prevenia.inspection.domain.Inspection;
import com.prevenia.inspection.domain.InspectionRepository;
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
public class InspectionService {

    private static final UUID SYSTEM_VISIT_CATEGORY_ID = UUID.fromString("a0000000-0000-0000-0000-000000000004");
    private static final String CATEGORY_CODE_VISIT = "VISITA_TECNICA";

    private final InspectionRepository inspectionRepository;
    private final CompanyRepository companyRepository;
    private final ExpirationRepository expirationRepository;
    private final ExpirationCategoryRepository categoryRepository;
    private final UserCompanyAssignmentRepository assignmentRepository;
    private final SecurityContextFacade securityContextFacade;
    private final ExpirationDeadlineClassifier deadlineClassifier;
    private final Clock clock;

    @Transactional(readOnly = true)
    public Page<InspectionResponse> listInspections(InspectionFilterRequest filters, Pageable pageable) {
        AuthenticatedUser currentUser = securityContextFacade.getRequiredUser();
        Set<UUID> assignedCompanyIds = getTechnicianAssignedCompanyIds(currentUser);

        if (filters != null && filters.getCompanyId() != null) {
            validateCompanyAccess(currentUser, filters.getCompanyId(), assignedCompanyIds);
        }

        Pageable effectivePageable = pageable;
        if (pageable.getSort().isUnsorted()) {
            effectivePageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(),
                    Sort.by(Sort.Direction.DESC, "visitDate").and(Sort.by(Sort.Direction.DESC, "createdAt")));
        }

        Specification<Inspection> spec = InspectionSpecification.buildSpecification(currentUser, assignedCompanyIds, filters);
        Page<Inspection> page = inspectionRepository.findAll(spec, effectivePageable);
        return enrichAndMapPage(page);
    }

    @Transactional(readOnly = true)
    public Page<InspectionResponse> listCompanyInspections(UUID companyId, InspectionFilterRequest filters, Pageable pageable) {
        AuthenticatedUser currentUser = securityContextFacade.getRequiredUser();
        Set<UUID> assignedCompanyIds = getTechnicianAssignedCompanyIds(currentUser);
        validateCompanyAccess(currentUser, companyId, assignedCompanyIds);

        InspectionFilterRequest effectiveFilters = filters != null ? filters : new InspectionFilterRequest();
        effectiveFilters.setCompanyId(companyId);
        return listInspections(effectiveFilters, pageable);
    }

    @Transactional(readOnly = true)
    public InspectionResponse getInspectionById(UUID id) {
        AuthenticatedUser currentUser = securityContextFacade.getRequiredUser();
        Inspection inspection = inspectionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Inspection", id));

        Set<UUID> assignedCompanyIds = getTechnicianAssignedCompanyIds(currentUser);
        validateInspectionAccess(currentUser, inspection, assignedCompanyIds);

        return enrichAndMapSingle(inspection);
    }

    @Transactional
    public InspectionResponse createInspection(CreateInspectionRequest request) {
        AuthenticatedUser currentUser = securityContextFacade.getRequiredUser();

        if (currentUser.getRole() == UserRole.CLIENT) {
            throw new ForbiddenException("Client users cannot register inspections");
        }

        Set<UUID> assignedCompanyIds = getTechnicianAssignedCompanyIds(currentUser);
        Company company = validateAndGetCompanyForWrite(currentUser, request.getCompanyId(), assignedCompanyIds);

        Inspection inspection = Inspection.builder()
                .organizationId(company.getOrganizationId())
                .companyId(company.getId())
                .type(request.getType())
                .visitDate(request.getVisitDate())
                .authority(request.getAuthority().trim())
                .contactName(request.getContactName())
                .contactPhone(request.getContactPhone())
                .contactEmail(request.getContactEmail())
                .result(request.getResult())
                .notes(request.getNotes())
                .nextVisitDate(request.getNextVisitDate())
                .documentReference(request.getDocumentReference())
                .createdBy(currentUser.getUserId())
                .build();

        // If nextVisitDate is present, synchronize with the Expiration engine
        if (request.getNextVisitDate() != null) {
            Expiration expiration = createLinkedExpiration(company, inspection, currentUser);
            inspection.setExpirationId(expiration.getId());
        }

        Inspection saved = inspectionRepository.save(inspection);
        log.info("Inspection '{}' ({}) created for company '{}' by user {}",
                saved.getType(), saved.getId(), company.getBusinessName(), currentUser.getEmail());

        return enrichAndMapSingle(saved);
    }

    @Transactional
    public InspectionResponse updateInspection(UUID id, UpdateInspectionRequest request) {
        AuthenticatedUser currentUser = securityContextFacade.getRequiredUser();

        if (currentUser.getRole() == UserRole.CLIENT) {
            throw new ForbiddenException("Client users cannot edit inspections");
        }

        Inspection inspection = inspectionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Inspection", id));

        Set<UUID> assignedCompanyIds = getTechnicianAssignedCompanyIds(currentUser);
        validateInspectionAccess(currentUser, inspection, assignedCompanyIds);

        Company company = companyRepository.findById(inspection.getCompanyId())
                .orElseThrow(() -> new ResourceNotFoundException("Company", inspection.getCompanyId()));

        inspection.setType(request.getType());
        inspection.setVisitDate(request.getVisitDate());
        inspection.setAuthority(request.getAuthority().trim());
        inspection.setContactName(request.getContactName());
        inspection.setContactPhone(request.getContactPhone());
        inspection.setContactEmail(request.getContactEmail());
        inspection.setResult(request.getResult());
        inspection.setNotes(request.getNotes());
        inspection.setNextVisitDate(request.getNextVisitDate());
        inspection.setDocumentReference(request.getDocumentReference());
        inspection.setUpdatedBy(currentUser.getUserId());

        // Handle Expiration sync
        if (request.getNextVisitDate() != null) {
            if (inspection.getExpirationId() != null) {
                updateLinkedExpiration(inspection.getExpirationId(), inspection, currentUser);
            } else {
                Expiration expiration = createLinkedExpiration(company, inspection, currentUser);
                inspection.setExpirationId(expiration.getId());
            }
        } else {
            // Next visit date was removed
            if (inspection.getExpirationId() != null) {
                cancelLinkedExpiration(inspection.getExpirationId(), "Next visit date removed from inspection", currentUser);
                inspection.setExpirationId(null);
            }
        }

        Inspection saved = inspectionRepository.save(inspection);
        log.info("Inspection ({}) updated by user {}", saved.getId(), currentUser.getEmail());
        return enrichAndMapSingle(saved);
    }

    @Transactional
    public void deleteInspection(UUID id) {
        AuthenticatedUser currentUser = securityContextFacade.getRequiredUser();

        if (currentUser.getRole() == UserRole.CLIENT) {
            throw new ForbiddenException("Client users cannot delete inspections");
        }

        Inspection inspection = inspectionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Inspection", id));

        Set<UUID> assignedCompanyIds = getTechnicianAssignedCompanyIds(currentUser);
        validateInspectionAccess(currentUser, inspection, assignedCompanyIds);

        if (inspection.getExpirationId() != null) {
            cancelLinkedExpiration(inspection.getExpirationId(), "Inspection was deleted", currentUser);
        }

        inspectionRepository.delete(inspection);
        log.info("Inspection ({}) deleted by user {}", id, currentUser.getEmail());
    }

    // --- Linked Expiration Sync Helpers ---

    private Expiration createLinkedExpiration(Company company, Inspection inspection, AuthenticatedUser currentUser) {
        UUID categoryId = resolveVisitCategoryId(company.getOrganizationId());

        String title = "Próxima Inspección: " + inspection.getType().getLabel() + " - " + inspection.getAuthority();
        String description = "Inspección periódica de control con " + inspection.getAuthority() +
                (inspection.getContactName() != null ? ". Contacto: " + inspection.getContactName() : "") +
                (inspection.getDocumentReference() != null ? ". Ref: " + inspection.getDocumentReference() : "");

        Expiration expiration = Expiration.builder()
                .organizationId(company.getOrganizationId())
                .companyId(company.getId())
                .categoryId(categoryId)
                .title(title.length() > 200 ? title.substring(0, 200) : title)
                .description(description)
                .issueDate(inspection.getVisitDate())
                .expirationDate(inspection.getNextVisitDate())
                .lifecycleStatus(ExpirationLifecycleStatus.ACTIVE)
                .recurrenceType(RecurrenceType.NONE)
                .notificationDaysBefore(15)
                .notes("Generado automáticamente desde el módulo de Visitas / Inspecciones.")
                .createdBy(currentUser.getUserId())
                .build();

        return expirationRepository.save(expiration);
    }

    private void updateLinkedExpiration(UUID expirationId, Inspection inspection, AuthenticatedUser currentUser) {
        expirationRepository.findById(expirationId).ifPresent(expiration -> {
            String title = "Próxima Inspección: " + inspection.getType().getLabel() + " - " + inspection.getAuthority();
            expiration.setTitle(title.length() > 200 ? title.substring(0, 200) : title);
            expiration.setExpirationDate(inspection.getNextVisitDate());
            expiration.setIssueDate(inspection.getVisitDate());
            expiration.setLifecycleStatus(ExpirationLifecycleStatus.ACTIVE);
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

    private UUID resolveVisitCategoryId(UUID organizationId) {
        return categoryRepository.findByOrganizationIdAndCodeIgnoreCase(organizationId, CATEGORY_CODE_VISIT)
                .or(() -> categoryRepository.findByOrganizationIdIsNullAndCodeIgnoreCase(CATEGORY_CODE_VISIT))
                .map(ExpirationCategory::getId)
                .orElse(SYSTEM_VISIT_CATEGORY_ID);
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

    private void validateInspectionAccess(AuthenticatedUser user, Inspection inspection, Set<UUID> assignedCompanyIds) {
        if (user.getRole() == UserRole.PLATFORM_ADMIN) {
            return;
        }
        if (!inspection.getOrganizationId().equals(user.getOrganizationId())) {
            throw new ResourceNotFoundException("Inspection", inspection.getId());
        }
        if (user.getRole() == UserRole.TECHNICIAN && !assignedCompanyIds.contains(inspection.getCompanyId())) {
            throw new ResourceNotFoundException("Inspection", inspection.getId());
        }
        if (user.getRole() == UserRole.CLIENT && !Objects.equals(user.getCompanyId(), inspection.getCompanyId())) {
            throw new ResourceNotFoundException("Inspection", inspection.getId());
        }
    }

    private InspectionResponse enrichAndMapSingle(Inspection inspection) {
        CompanySummaryDto companyDto = companyRepository.findById(inspection.getCompanyId())
                .map(c -> CompanySummaryDto.builder()
                        .id(c.getId())
                        .businessName(c.getBusinessName())
                        .legalName(c.getLegalName())
                        .taxId(c.getTaxId())
                        .build())
                .orElse(null);

        var classification = inspection.getNextVisitDate() != null
                ? deadlineClassifier.classify(inspection.getNextVisitDate(), ExpirationLifecycleStatus.ACTIVE)
                : null;

        return InspectionResponse.builder()
                .id(inspection.getId())
                .organizationId(inspection.getOrganizationId())
                .company(companyDto)
                .type(inspection.getType())
                .typeLabel(inspection.getType().getLabel())
                .visitDate(inspection.getVisitDate())
                .authority(inspection.getAuthority())
                .contactName(inspection.getContactName())
                .contactPhone(inspection.getContactPhone())
                .contactEmail(inspection.getContactEmail())
                .result(inspection.getResult())
                .notes(inspection.getNotes())
                .nextVisitDate(inspection.getNextVisitDate())
                .documentReference(inspection.getDocumentReference())
                .expirationId(inspection.getExpirationId())
                .nextVisitDeadlineStatus(classification != null ? classification.deadlineStatus() : null)
                .nextVisitDaysRemaining(classification != null ? classification.daysUntilExpiration() : null)
                .createdAt(inspection.getCreatedAt())
                .updatedAt(inspection.getUpdatedAt())
                .build();
    }

    private Page<InspectionResponse> enrichAndMapPage(Page<Inspection> page) {
        Set<UUID> companyIds = page.getContent().stream()
                .map(Inspection::getCompanyId)
                .collect(Collectors.toSet());

        Map<UUID, CompanySummaryDto> companyMap = companyRepository.findAllById(companyIds).stream()
                .map(c -> CompanySummaryDto.builder()
                        .id(c.getId())
                        .businessName(c.getBusinessName())
                        .legalName(c.getLegalName())
                        .taxId(c.getTaxId())
                        .build())
                .collect(Collectors.toMap(CompanySummaryDto::getId, Function.identity()));

        return page.map(inspection -> {
            var classification = inspection.getNextVisitDate() != null
                    ? deadlineClassifier.classify(inspection.getNextVisitDate(), ExpirationLifecycleStatus.ACTIVE)
                    : null;

            return InspectionResponse.builder()
                    .id(inspection.getId())
                    .organizationId(inspection.getOrganizationId())
                    .company(companyMap.get(inspection.getCompanyId()))
                    .type(inspection.getType())
                    .typeLabel(inspection.getType().getLabel())
                    .visitDate(inspection.getVisitDate())
                    .authority(inspection.getAuthority())
                    .contactName(inspection.getContactName())
                    .contactPhone(inspection.getContactPhone())
                    .contactEmail(inspection.getContactEmail())
                    .result(inspection.getResult())
                    .notes(inspection.getNotes())
                    .nextVisitDate(inspection.getNextVisitDate())
                    .documentReference(inspection.getDocumentReference())
                    .expirationId(inspection.getExpirationId())
                    .nextVisitDeadlineStatus(classification != null ? classification.deadlineStatus() : null)
                    .nextVisitDaysRemaining(classification != null ? classification.daysUntilExpiration() : null)
                    .createdAt(inspection.getCreatedAt())
                    .updatedAt(inspection.getUpdatedAt())
                    .build();
        });
    }
}
