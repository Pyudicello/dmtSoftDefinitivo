package com.prevenia.dashboard.application;

import com.prevenia.assignment.domain.UserCompanyAssignment;
import com.prevenia.assignment.domain.UserCompanyAssignmentRepository;
import com.prevenia.company.api.dto.CompanyMetricsSummaryResponse;
import com.prevenia.company.api.dto.CompanyResponse;
import com.prevenia.company.application.CompanyService;
import com.prevenia.company.domain.CompanyRepository;
import com.prevenia.dashboard.api.dto.DashboardSummaryResponse;
import com.prevenia.expiration.api.dto.ExpirationFilterRequest;
import com.prevenia.expiration.api.dto.ExpirationResponse;
import com.prevenia.expiration.application.ExpirationDeadlineClassifier;
import com.prevenia.expiration.application.ExpirationService;
import com.prevenia.expiration.application.ExpirationSpecification;
import com.prevenia.expiration.domain.Expiration;
import com.prevenia.expiration.domain.ExpirationLifecycleStatus;
import com.prevenia.expiration.domain.ExpirationRepository;
import com.prevenia.expiration.infrastructure.config.ExpirationProperties;
import com.prevenia.shared.security.AuthenticatedUser;
import com.prevenia.shared.security.SecurityContextFacade;
import com.prevenia.user.domain.UserRole;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class DashboardService {

    private final CompanyRepository companyRepository;
    private final ExpirationRepository expirationRepository;
    private final UserCompanyAssignmentRepository assignmentRepository;
    private final CompanyService companyService;
    private final ExpirationService expirationService;
    private final SecurityContextFacade securityContextFacade;
    private final ExpirationDeadlineClassifier deadlineClassifier;
    private final ExpirationProperties properties;

    @Transactional(readOnly = true)
    public DashboardSummaryResponse getDashboardSummary() {
        AuthenticatedUser currentUser = securityContextFacade.getRequiredUser();
        Set<UUID> assignedCompanyIds = getTechnicianAssignedCompanyIds(currentUser);
        LocalDate today = deadlineClassifier.getToday();

        long companyCount = calculateCompanyCount(currentUser, assignedCompanyIds);

        // Expired (Active & expirationDate < today)
        Specification<Expiration> expiredSpec = ExpirationSpecification.buildSpecification(
                currentUser, assignedCompanyIds,
                ExpirationFilterRequest.builder()
                        .lifecycleStatus(ExpirationLifecycleStatus.ACTIVE)
                        .to(today.minusDays(1))
                        .build(),
                today, properties);
        long expiredCount = expirationRepository.count(expiredSpec);

        // Next 7 Days (Active & today <= expirationDate <= today + 7)
        Specification<Expiration> next7Spec = ExpirationSpecification.buildSpecification(
                currentUser, assignedCompanyIds,
                ExpirationFilterRequest.builder()
                        .lifecycleStatus(ExpirationLifecycleStatus.ACTIVE)
                        .from(today)
                        .to(today.plusDays(properties.getUrgentDays()))
                        .build(),
                today, properties);
        long next7DaysCount = expirationRepository.count(next7Spec);

        // Next 30 Days (Active & today <= expirationDate <= today + 30)
        Specification<Expiration> next30Spec = ExpirationSpecification.buildSpecification(
                currentUser, assignedCompanyIds,
                ExpirationFilterRequest.builder()
                        .lifecycleStatus(ExpirationLifecycleStatus.ACTIVE)
                        .from(today)
                        .to(today.plusDays(properties.getUpcomingDays()))
                        .build(),
                today, properties);
        long next30DaysCount = expirationRepository.count(next30Spec);

        // Completed
        Specification<Expiration> completedSpec = ExpirationSpecification.buildSpecification(
                currentUser, assignedCompanyIds,
                ExpirationFilterRequest.builder()
                        .lifecycleStatus(ExpirationLifecycleStatus.COMPLETED)
                        .build(),
                today, properties);
        long completedCount = expirationRepository.count(completedSpec);

        return DashboardSummaryResponse.builder()
                .companyCount(companyCount)
                .expiredCount(expiredCount)
                .next7DaysCount(next7DaysCount)
                .next30DaysCount(next30DaysCount)
                .completedCount(completedCount)
                .build();
    }

    @Transactional(readOnly = true)
    public List<ExpirationResponse> getUpcomingExpirations(int limit) {
        int effectiveLimit = limit > 0 && limit <= 50 ? limit : 10;
        PageRequest pageRequest = PageRequest.of(0, effectiveLimit,
                Sort.by(Sort.Direction.ASC, "expirationDate").and(Sort.by(Sort.Direction.ASC, "id")));

        return expirationService.listUpcomingExpirations(pageRequest).getContent();
    }

    @Transactional(readOnly = true)
    public CompanyMetricsSummaryResponse getCompanyMetricsSummary(UUID companyId) {
        AuthenticatedUser currentUser = securityContextFacade.getRequiredUser();
        CompanyResponse company = companyService.getCompanyById(companyId, currentUser);
        Set<UUID> assignedCompanyIds = getTechnicianAssignedCompanyIds(currentUser);
        LocalDate today = deadlineClassifier.getToday();

        // Expired
        Specification<Expiration> expiredSpec = ExpirationSpecification.buildSpecification(
                currentUser, assignedCompanyIds,
                ExpirationFilterRequest.builder()
                        .companyId(companyId)
                        .lifecycleStatus(ExpirationLifecycleStatus.ACTIVE)
                        .to(today.minusDays(1))
                        .build(),
                today, properties);
        long expiredCount = expirationRepository.count(expiredSpec);

        // Next 7
        Specification<Expiration> next7Spec = ExpirationSpecification.buildSpecification(
                currentUser, assignedCompanyIds,
                ExpirationFilterRequest.builder()
                        .companyId(companyId)
                        .lifecycleStatus(ExpirationLifecycleStatus.ACTIVE)
                        .from(today)
                        .to(today.plusDays(properties.getUrgentDays()))
                        .build(),
                today, properties);
        long next7DaysCount = expirationRepository.count(next7Spec);

        // Next 30
        Specification<Expiration> next30Spec = ExpirationSpecification.buildSpecification(
                currentUser, assignedCompanyIds,
                ExpirationFilterRequest.builder()
                        .companyId(companyId)
                        .lifecycleStatus(ExpirationLifecycleStatus.ACTIVE)
                        .from(today)
                        .to(today.plusDays(properties.getUpcomingDays()))
                        .build(),
                today, properties);
        long next30DaysCount = expirationRepository.count(next30Spec);

        // Current (> 30 days)
        Specification<Expiration> currentSpec = ExpirationSpecification.buildSpecification(
                currentUser, assignedCompanyIds,
                ExpirationFilterRequest.builder()
                        .companyId(companyId)
                        .lifecycleStatus(ExpirationLifecycleStatus.ACTIVE)
                        .from(today.plusDays(properties.getUpcomingDays() + 1))
                        .build(),
                today, properties);
        long currentCount = expirationRepository.count(currentSpec);

        // Completed
        Specification<Expiration> completedSpec = ExpirationSpecification.buildSpecification(
                currentUser, assignedCompanyIds,
                ExpirationFilterRequest.builder()
                        .companyId(companyId)
                        .lifecycleStatus(ExpirationLifecycleStatus.COMPLETED)
                        .build(),
                today, properties);
        long completedCount = expirationRepository.count(completedSpec);

        return CompanyMetricsSummaryResponse.builder()
                .company(company)
                .expiredCount(expiredCount)
                .next7DaysCount(next7DaysCount)
                .next30DaysCount(next30DaysCount)
                .currentCount(currentCount)
                .completedCount(completedCount)
                .build();
    }

    private long calculateCompanyCount(AuthenticatedUser user, Set<UUID> assignedCompanyIds) {
        if (user.getRole() == UserRole.PLATFORM_ADMIN) {
            return companyRepository.count();
        }
        if (user.getRole() == UserRole.CONSULTANT_ADMIN) {
            return companyRepository.countByOrganizationId(user.getOrganizationId());
        }
        if (user.getRole() == UserRole.TECHNICIAN) {
            return assignedCompanyIds.size();
        }
        if (user.getRole() == UserRole.CLIENT) {
            return user.getCompanyId() != null ? 1 : 0;
        }
        return 0;
    }

    private Set<UUID> getTechnicianAssignedCompanyIds(AuthenticatedUser user) {
        if (user.getRole() == UserRole.TECHNICIAN) {
            return assignmentRepository.findByUserIdAndActiveTrue(user.getUserId()).stream()
                    .map(UserCompanyAssignment::getCompanyId)
                    .collect(Collectors.toSet());
        }
        return Set.of();
    }
}
