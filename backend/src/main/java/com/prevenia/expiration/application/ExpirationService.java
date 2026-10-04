package com.prevenia.expiration.application;

import com.prevenia.assignment.domain.UserCompanyAssignment;
import com.prevenia.assignment.domain.UserCompanyAssignmentRepository;
import com.prevenia.auth.api.dto.UserSummaryDto;
import com.prevenia.company.domain.Company;
import com.prevenia.company.domain.CompanyRepository;
import com.prevenia.expiration.api.dto.CancelExpirationRequest;
import com.prevenia.expiration.api.dto.CategorySummaryDto;
import com.prevenia.expiration.api.dto.CompanySummaryDto;
import com.prevenia.expiration.api.dto.CompleteExpirationRequest;
import com.prevenia.expiration.api.dto.CreateExpirationRequest;
import com.prevenia.expiration.api.dto.ExpirationFilterRequest;
import com.prevenia.expiration.api.dto.ExpirationResponse;
import com.prevenia.expiration.api.dto.UpdateExpirationRequest;
import com.prevenia.expiration.domain.Expiration;
import com.prevenia.expiration.domain.ExpirationCategory;
import com.prevenia.expiration.domain.ExpirationCategoryRepository;
import com.prevenia.expiration.domain.ExpirationDeadlineStatus;
import com.prevenia.expiration.domain.ExpirationLifecycleStatus;
import com.prevenia.expiration.domain.ExpirationRepository;
import com.prevenia.expiration.domain.RecurrenceType;
import com.prevenia.expiration.domain.exception.CategoryNotAvailableException;
import com.prevenia.expiration.domain.exception.ExpirationAlreadyCancelledException;
import com.prevenia.expiration.domain.exception.ExpirationAlreadyCompletedException;
import com.prevenia.expiration.domain.exception.InvalidExpirationDateException;
import com.prevenia.expiration.domain.exception.ResponsibleUserNotAvailableException;
import com.prevenia.expiration.infrastructure.config.ExpirationProperties;
import com.prevenia.shared.domain.ForbiddenException;
import com.prevenia.shared.domain.ResourceNotFoundException;
import com.prevenia.shared.security.AuthenticatedUser;
import com.prevenia.shared.security.SecurityContextFacade;
import com.prevenia.user.domain.User;
import com.prevenia.user.domain.UserRepository;
import com.prevenia.user.domain.UserRole;
import com.prevenia.user.domain.UserStatus;
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
import java.util.HashSet;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ExpirationService {

    private final ExpirationRepository expirationRepository;
    private final ExpirationCategoryRepository categoryRepository;
    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;
    private final UserCompanyAssignmentRepository assignmentRepository;
    private final SecurityContextFacade securityContextFacade;
    private final ExpirationDeadlineClassifier deadlineClassifier;
    private final ExpirationProperties properties;
    private final Clock clock;

    @Transactional(readOnly = true)
    public Page<ExpirationResponse> listExpirations(ExpirationFilterRequest filters, Pageable pageable) {
        AuthenticatedUser currentUser = securityContextFacade.getRequiredUser();
        Set<UUID> assignedCompanyIds = getTechnicianAssignedCompanyIds(currentUser);

        // Security check: if client/tech requests a company they don't have access to
        if (filters != null && filters.getCompanyId() != null) {
            validateCompanyAccess(currentUser, filters.getCompanyId(), assignedCompanyIds);
        }

        // Apply default stable sort if not specified
        Pageable effectivePageable = pageable;
        if (pageable.getSort().isUnsorted()) {
            effectivePageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(),
                    Sort.by(Sort.Direction.ASC, "expirationDate").and(Sort.by(Sort.Direction.ASC, "id")));
        }

        Specification<Expiration> spec = ExpirationSpecification.buildSpecification(
                currentUser, assignedCompanyIds, filters, deadlineClassifier.getToday(), properties);

        Page<Expiration> page = expirationRepository.findAll(spec, effectivePageable);
        return enrichAndMapPage(page);
    }

    @Transactional(readOnly = true)
    public ExpirationResponse getExpirationById(UUID id) {
        AuthenticatedUser currentUser = securityContextFacade.getRequiredUser();
        Expiration expiration = expirationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Expiration", id));

        // Anti-IDOR: validate that the current user has access to the expiration's company and organization
        Set<UUID> assignedCompanyIds = getTechnicianAssignedCompanyIds(currentUser);
        validateExpirationAccess(currentUser, expiration, assignedCompanyIds);

        return enrichAndMapSingle(expiration);
    }

    @Transactional
    public ExpirationResponse createExpiration(CreateExpirationRequest request) {
        AuthenticatedUser currentUser = securityContextFacade.getRequiredUser();

        if (currentUser.getRole() == UserRole.CLIENT) {
            throw new ForbiddenException("Client users cannot create expirations");
        }

        Set<UUID> assignedCompanyIds = getTechnicianAssignedCompanyIds(currentUser);
        Company company = validateAndGetCompanyForWrite(currentUser, request.getCompanyId(), assignedCompanyIds);

        // Validate dates
        if (request.getIssueDate() != null && request.getIssueDate().isAfter(request.getExpirationDate())) {
            throw new InvalidExpirationDateException("Issue date (" + request.getIssueDate() + ") cannot be after expiration date (" + request.getExpirationDate() + ")");
        }

        // Validate Category
        ExpirationCategory category = categoryRepository.findById(request.getCategoryId())
                .filter(ExpirationCategory::isActive)
                .orElseThrow(() -> new CategoryNotAvailableException("Expiration category was not found or is inactive"));

        if (!category.isGlobal() && !Objects.equals(category.getOrganizationId(), company.getOrganizationId())) {
            throw new CategoryNotAvailableException("Expiration category is not accessible for this organization");
        }

        // Validate Responsible User if provided
        if (request.getResponsibleUserId() != null) {
            validateResponsibleUser(request.getResponsibleUserId(), company);
        }

        Expiration expiration = Expiration.builder()
                .organizationId(company.getOrganizationId())
                .companyId(company.getId())
                .categoryId(category.getId())
                .title(request.getTitle().trim())
                .description(request.getDescription())
                .issueDate(request.getIssueDate())
                .expirationDate(request.getExpirationDate())
                .lifecycleStatus(ExpirationLifecycleStatus.ACTIVE)
                .responsibleUserId(request.getResponsibleUserId())
                .recurrenceType(request.getRecurrenceType() != null ? request.getRecurrenceType() : RecurrenceType.NONE)
                .notificationDaysBefore(request.getNotificationDaysBefore() != null ? request.getNotificationDaysBefore() : 30)
                .notes(request.getNotes())
                .createdBy(currentUser.getUserId())
                .build();

        Expiration saved = expirationRepository.save(expiration);
        log.info("Expiration '{}' ({}) created for company '{}' by user {}",
                saved.getTitle(), saved.getId(), company.getBusinessName(), currentUser.getEmail());

        return enrichAndMapSingle(saved);
    }

    @Transactional
    public ExpirationResponse updateExpiration(UUID id, UpdateExpirationRequest request) {
        AuthenticatedUser currentUser = securityContextFacade.getRequiredUser();

        if (currentUser.getRole() == UserRole.CLIENT) {
            throw new ForbiddenException("Client users cannot edit expirations");
        }

        Expiration expiration = expirationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Expiration", id));

        Set<UUID> assignedCompanyIds = getTechnicianAssignedCompanyIds(currentUser);
        validateExpirationAccess(currentUser, expiration, assignedCompanyIds);

        if (expiration.isCancelled()) {
            throw new ExpirationAlreadyCancelledException("Cannot update a cancelled expiration");
        }

        // Validate dates
        if (request.getIssueDate() != null && request.getIssueDate().isAfter(request.getExpirationDate())) {
            throw new InvalidExpirationDateException("Issue date cannot be after expiration date");
        }

        // Validate Category
        ExpirationCategory category = categoryRepository.findById(request.getCategoryId())
                .filter(ExpirationCategory::isActive)
                .orElseThrow(() -> new CategoryNotAvailableException("Expiration category was not found or is inactive"));

        if (!category.isGlobal() && !Objects.equals(category.getOrganizationId(), expiration.getOrganizationId())) {
            throw new CategoryNotAvailableException("Expiration category is not accessible for this organization");
        }

        // Validate Responsible User if provided
        if (request.getResponsibleUserId() != null) {
            Company company = companyRepository.findById(expiration.getCompanyId())
                    .orElseThrow(() -> new ResourceNotFoundException("Company", expiration.getCompanyId()));
            validateResponsibleUser(request.getResponsibleUserId(), company);
        }

        expiration.setCategoryId(category.getId());
        expiration.setTitle(request.getTitle().trim());
        expiration.setDescription(request.getDescription());
        expiration.setIssueDate(request.getIssueDate());
        expiration.setExpirationDate(request.getExpirationDate());
        expiration.setResponsibleUserId(request.getResponsibleUserId());
        expiration.setRecurrenceType(request.getRecurrenceType() != null ? request.getRecurrenceType() : RecurrenceType.NONE);
        expiration.setNotificationDaysBefore(request.getNotificationDaysBefore() != null ? request.getNotificationDaysBefore() : 30);
        expiration.setNotes(request.getNotes());
        expiration.setUpdatedBy(currentUser.getUserId());

        Expiration updated = expirationRepository.save(expiration);
        log.info("Expiration '{}' ({}) updated by user {}", updated.getTitle(), updated.getId(), currentUser.getEmail());
        return enrichAndMapSingle(updated);
    }

    @Transactional
    public ExpirationResponse completeExpiration(UUID id, CompleteExpirationRequest request) {
        AuthenticatedUser currentUser = securityContextFacade.getRequiredUser();

        if (currentUser.getRole() == UserRole.CLIENT) {
            throw new ForbiddenException("Client users cannot complete expirations");
        }

        Expiration expiration = expirationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Expiration", id));

        Set<UUID> assignedCompanyIds = getTechnicianAssignedCompanyIds(currentUser);
        validateExpirationAccess(currentUser, expiration, assignedCompanyIds);

        if (expiration.isCompleted()) {
            throw new ExpirationAlreadyCompletedException("Expiration is already marked as completed");
        }
        if (expiration.isCancelled()) {
            throw new ExpirationAlreadyCancelledException("Cannot complete a cancelled expiration");
        }

        OffsetDateTime completionTime = (request != null && request.getCompletedAt() != null)
                ? request.getCompletedAt()
                : OffsetDateTime.now(clock);

        expiration.setLifecycleStatus(ExpirationLifecycleStatus.COMPLETED);
        expiration.setCompletedAt(completionTime);
        expiration.setCompletionNotes(request != null ? request.getNotes() : null);
        expiration.setUpdatedBy(currentUser.getUserId());

        Expiration saved = expirationRepository.save(expiration);
        log.info("Expiration '{}' ({}) completed by user {}", saved.getTitle(), saved.getId(), currentUser.getEmail());
        return enrichAndMapSingle(saved);
    }

    @Transactional
    public ExpirationResponse cancelExpiration(UUID id, CancelExpirationRequest request) {
        AuthenticatedUser currentUser = securityContextFacade.getRequiredUser();

        if (currentUser.getRole() == UserRole.CLIENT) {
            throw new ForbiddenException("Client users cannot cancel expirations");
        }

        Expiration expiration = expirationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Expiration", id));

        Set<UUID> assignedCompanyIds = getTechnicianAssignedCompanyIds(currentUser);
        validateExpirationAccess(currentUser, expiration, assignedCompanyIds);

        if (expiration.isCancelled()) {
            throw new ExpirationAlreadyCancelledException("Expiration is already cancelled");
        }

        expiration.setLifecycleStatus(ExpirationLifecycleStatus.CANCELLED);
        expiration.setCancelledAt(OffsetDateTime.now(clock));
        expiration.setCancelReason(request != null ? request.getReason() : "Cancelled by user");
        expiration.setUpdatedBy(currentUser.getUserId());

        Expiration saved = expirationRepository.save(expiration);
        log.info("Expiration '{}' ({}) cancelled by user {}", saved.getTitle(), saved.getId(), currentUser.getEmail());
        return enrichAndMapSingle(saved);
    }

    @Transactional
    public void deleteExpiration(UUID id) {
        cancelExpiration(id, CancelExpirationRequest.builder().reason("Deleted by user").build());
    }

    @Transactional(readOnly = true)
    public Page<ExpirationResponse> listUpcomingExpirations(Pageable pageable) {
        ExpirationFilterRequest filter = ExpirationFilterRequest.builder()
                .lifecycleStatus(ExpirationLifecycleStatus.ACTIVE)
                .from(deadlineClassifier.getToday())
                .to(deadlineClassifier.getToday().plusDays(properties.getUpcomingDays()))
                .build();
        return listExpirations(filter, pageable);
    }

    @Transactional(readOnly = true)
    public Page<ExpirationResponse> listExpiredExpirations(Pageable pageable) {
        ExpirationFilterRequest filter = ExpirationFilterRequest.builder()
                .lifecycleStatus(ExpirationLifecycleStatus.ACTIVE)
                .to(deadlineClassifier.getToday().minusDays(1))
                .build();
        return listExpirations(filter, pageable);
    }

    @Transactional(readOnly = true)
    public Page<ExpirationResponse> listCompanyExpirations(UUID companyId, ExpirationFilterRequest filters, Pageable pageable) {
        AuthenticatedUser currentUser = securityContextFacade.getRequiredUser();
        Set<UUID> assignedCompanyIds = getTechnicianAssignedCompanyIds(currentUser);
        validateCompanyAccess(currentUser, companyId, assignedCompanyIds);

        ExpirationFilterRequest effectiveFilters = filters != null ? filters : new ExpirationFilterRequest();
        effectiveFilters.setCompanyId(companyId);
        return listExpirations(effectiveFilters, pageable);
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

    private void validateExpirationAccess(AuthenticatedUser user, Expiration expiration, Set<UUID> assignedCompanyIds) {
        if (user.getRole() == UserRole.PLATFORM_ADMIN) {
            return;
        }

        if (user.getRole() == UserRole.CONSULTANT_ADMIN) {
            if (!expiration.getOrganizationId().equals(user.getOrganizationId())) {
                throw new ResourceNotFoundException("Expiration", expiration.getId());
            }
        } else if (user.getRole() == UserRole.TECHNICIAN) {
            if (!expiration.getOrganizationId().equals(user.getOrganizationId()) || !assignedCompanyIds.contains(expiration.getCompanyId())) {
                throw new ResourceNotFoundException("Expiration", expiration.getId());
            }
        } else if (user.getRole() == UserRole.CLIENT) {
            if (!expiration.getCompanyId().equals(user.getCompanyId())) {
                throw new ResourceNotFoundException("Expiration", expiration.getId());
            }
        }
    }

    private Company validateAndGetCompanyForWrite(AuthenticatedUser user, UUID companyId, Set<UUID> assignedCompanyIds) {
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
        }

        return company;
    }

    private void validateResponsibleUser(UUID responsibleUserId, Company company) {
        User user = userRepository.findById(responsibleUserId)
                .filter(u -> u.getStatus() == UserStatus.ACTIVE)
                .orElseThrow(() -> new ResponsibleUserNotAvailableException("Responsible user not found or is inactive"));

        if (!Objects.equals(user.getOrganizationId(), company.getOrganizationId())) {
            throw new ResponsibleUserNotAvailableException("Responsible user does not belong to the same organization");
        }

        if (user.getRole() != UserRole.TECHNICIAN && user.getRole() != UserRole.CONSULTANT_ADMIN) {
            throw new ResponsibleUserNotAvailableException("Responsible user must have role TECHNICIAN or CONSULTANT_ADMIN");
        }

        if (user.getRole() == UserRole.TECHNICIAN) {
            boolean assigned = assignmentRepository.existsByUserIdAndCompanyIdAndActiveTrue(user.getId(), company.getId());
            if (!assigned) {
                throw new ResponsibleUserNotAvailableException("Responsible technician is not assigned to company '" + company.getBusinessName() + "'");
            }
        }
    }

    private Page<ExpirationResponse> enrichAndMapPage(Page<Expiration> page) {
        if (page.isEmpty()) {
            return page.map(e -> null);
        }

        Set<UUID> companyIds = page.stream().map(Expiration::getCompanyId).collect(Collectors.toSet());
        Set<UUID> categoryIds = page.stream().map(Expiration::getCategoryId).collect(Collectors.toSet());
        Set<UUID> userIds = page.stream().map(Expiration::getResponsibleUserId).filter(Objects::nonNull).collect(Collectors.toSet());

        Map<UUID, Company> companyMap = companyRepository.findAllById(companyIds).stream()
                .collect(Collectors.toMap(Company::getId, Function.identity()));
        Map<UUID, ExpirationCategory> categoryMap = categoryRepository.findAllById(categoryIds).stream()
                .collect(Collectors.toMap(ExpirationCategory::getId, Function.identity()));
        Map<UUID, User> userMap = userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));

        return page.map(exp -> mapToResponse(exp, companyMap.get(exp.getCompanyId()),
                categoryMap.get(exp.getCategoryId()), exp.getResponsibleUserId() != null ? userMap.get(exp.getResponsibleUserId()) : null));
    }

    private ExpirationResponse enrichAndMapSingle(Expiration expiration) {
        Company company = companyRepository.findById(expiration.getCompanyId()).orElse(null);
        ExpirationCategory category = categoryRepository.findById(expiration.getCategoryId()).orElse(null);
        User responsible = expiration.getResponsibleUserId() != null
                ? userRepository.findById(expiration.getResponsibleUserId()).orElse(null)
                : null;

        return mapToResponse(expiration, company, category, responsible);
    }

    private ExpirationResponse mapToResponse(Expiration expiration, Company company, ExpirationCategory category, User responsible) {
        var classification = deadlineClassifier.classify(expiration.getExpirationDate(), expiration.getLifecycleStatus());

        CompanySummaryDto companyDto = company != null ? CompanySummaryDto.builder()
                .id(company.getId())
                .businessName(company.getBusinessName())
                .legalName(company.getLegalName())
                .taxId(company.getTaxId())
                .build() : null;

        CategorySummaryDto categoryDto = category != null ? CategorySummaryDto.builder()
                .id(category.getId())
                .code(category.getCode())
                .name(category.getName())
                .icon(category.getIcon())
                .colorCode(category.getColorCode())
                .isSystem(category.isSystem())
                .build() : null;

        UserSummaryDto responsibleDto = responsible != null ? UserSummaryDto.builder()
                .id(responsible.getId())
                .email(responsible.getEmail())
                .firstName(responsible.getFirstName())
                .lastName(responsible.getLastName())
                .role(responsible.getRole())
                .organizationId(responsible.getOrganizationId())
                .companyId(responsible.getCompanyId())
                .build() : null;

        return ExpirationResponse.builder()
                .id(expiration.getId())
                .organizationId(expiration.getOrganizationId())
                .company(companyDto)
                .category(categoryDto)
                .title(expiration.getTitle())
                .description(expiration.getDescription())
                .issueDate(expiration.getIssueDate())
                .expirationDate(expiration.getExpirationDate())
                .lifecycleStatus(expiration.getLifecycleStatus())
                .deadlineStatus(classification.deadlineStatus())
                .daysUntilExpiration(classification.daysUntilExpiration())
                .responsible(responsibleDto)
                .recurrenceType(expiration.getRecurrenceType())
                .notificationDaysBefore(expiration.getNotificationDaysBefore())
                .notes(expiration.getNotes())
                .completedAt(expiration.getCompletedAt())
                .completionNotes(expiration.getCompletionNotes())
                .cancelledAt(expiration.getCancelledAt())
                .cancelReason(expiration.getCancelReason())
                .version(expiration.getVersion())
                .createdAt(expiration.getCreatedAt())
                .updatedAt(expiration.getUpdatedAt())
                .build();
    }
}
