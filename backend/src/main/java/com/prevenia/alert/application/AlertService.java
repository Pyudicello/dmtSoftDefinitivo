package com.prevenia.alert.application;

import com.prevenia.alert.api.dto.AlertItemResponse;
import com.prevenia.alert.api.dto.AlertsSummaryResponse;
import com.prevenia.assignment.domain.UserCompanyAssignment;
import com.prevenia.assignment.domain.UserCompanyAssignmentRepository;
import com.prevenia.company.domain.Company;
import com.prevenia.company.domain.CompanyRepository;
import com.prevenia.expiration.api.dto.ExpirationFilterRequest;
import com.prevenia.expiration.application.ExpirationDeadlineClassifier;
import com.prevenia.expiration.application.ExpirationSpecification;
import com.prevenia.expiration.domain.Expiration;
import com.prevenia.expiration.domain.ExpirationCategory;
import com.prevenia.expiration.domain.ExpirationCategoryRepository;
import com.prevenia.expiration.domain.ExpirationDeadlineStatus;
import com.prevenia.expiration.domain.ExpirationLifecycleStatus;
import com.prevenia.expiration.domain.ExpirationRepository;
import com.prevenia.expiration.infrastructure.config.ExpirationProperties;
import com.prevenia.shared.security.AuthenticatedUser;
import com.prevenia.shared.security.SecurityContextFacade;
import com.prevenia.user.domain.User;
import com.prevenia.user.domain.UserRepository;
import com.prevenia.user.domain.UserRole;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AlertService {

    private final ExpirationRepository expirationRepository;
    private final CompanyRepository companyRepository;
    private final ExpirationCategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final UserCompanyAssignmentRepository assignmentRepository;
    private final SecurityContextFacade securityContextFacade;
    private final ExpirationDeadlineClassifier deadlineClassifier;
    private final ExpirationProperties properties;

    @Transactional(readOnly = true)
    public AlertsSummaryResponse getAlerts(UUID companyId, String priorityFilter) {
        AuthenticatedUser currentUser = securityContextFacade.getRequiredUser();
        Set<UUID> assignedCompanyIds = getTechnicianAssignedCompanyIds(currentUser);
        LocalDate today = deadlineClassifier.getToday();

        // 1. Expired (Active & expirationDate < today)
        Specification<Expiration> expiredSpec = ExpirationSpecification.buildSpecification(
                currentUser, assignedCompanyIds,
                ExpirationFilterRequest.builder()
                        .companyId(companyId)
                        .lifecycleStatus(ExpirationLifecycleStatus.ACTIVE)
                        .to(today.minusDays(1))
                        .build(),
                today, properties);
        List<Expiration> expiredList = expirationRepository.findAll(expiredSpec, Sort.by(Sort.Direction.ASC, "expirationDate"));

        // 2. Urgent (Active & today <= expirationDate <= today + 7)
        Specification<Expiration> urgentSpec = ExpirationSpecification.buildSpecification(
                currentUser, assignedCompanyIds,
                ExpirationFilterRequest.builder()
                        .companyId(companyId)
                        .lifecycleStatus(ExpirationLifecycleStatus.ACTIVE)
                        .from(today)
                        .to(today.plusDays(properties.getUrgentDays()))
                        .build(),
                today, properties);
        List<Expiration> urgentList = expirationRepository.findAll(urgentSpec, Sort.by(Sort.Direction.ASC, "expirationDate"));

        // 3. Upcoming (Active & today + 8 <= expirationDate <= today + 30)
        Specification<Expiration> upcomingSpec = ExpirationSpecification.buildSpecification(
                currentUser, assignedCompanyIds,
                ExpirationFilterRequest.builder()
                        .companyId(companyId)
                        .lifecycleStatus(ExpirationLifecycleStatus.ACTIVE)
                        .from(today.plusDays(properties.getUrgentDays() + 1))
                        .to(today.plusDays(properties.getUpcomingDays()))
                        .build(),
                today, properties);
        List<Expiration> upcomingList = expirationRepository.findAll(upcomingSpec, Sort.by(Sort.Direction.ASC, "expirationDate"));

        long criticalCount = expiredList.size();
        long highCount = urgentList.size();
        long mediumCount = upcomingList.size();
        long totalCount = criticalCount + highCount + mediumCount;

        // Collect all related IDs for batch lookup
        List<Expiration> allAlerts = new ArrayList<>();
        if (priorityFilter == null || priorityFilter.equalsIgnoreCase("ALL")) {
            allAlerts.addAll(expiredList);
            allAlerts.addAll(urgentList);
            allAlerts.addAll(upcomingList);
        } else if (priorityFilter.equalsIgnoreCase("CRITICAL") || priorityFilter.equalsIgnoreCase("EXPIRED")) {
            allAlerts.addAll(expiredList);
        } else if (priorityFilter.equalsIgnoreCase("HIGH") || priorityFilter.equalsIgnoreCase("URGENT")) {
            allAlerts.addAll(urgentList);
        } else if (priorityFilter.equalsIgnoreCase("MEDIUM") || priorityFilter.equalsIgnoreCase("UPCOMING")) {
            allAlerts.addAll(upcomingList);
        } else {
            allAlerts.addAll(expiredList);
            allAlerts.addAll(urgentList);
            allAlerts.addAll(upcomingList);
        }

        Set<UUID> companyIds = allAlerts.stream().map(Expiration::getCompanyId).collect(Collectors.toSet());
        Set<UUID> categoryIds = allAlerts.stream().map(Expiration::getCategoryId).collect(Collectors.toSet());
        Set<UUID> userIds = allAlerts.stream().map(Expiration::getResponsibleUserId).filter(id -> id != null).collect(Collectors.toSet());

        Map<UUID, String> companyNames = companyRepository.findAllById(companyIds).stream()
                .collect(Collectors.toMap(Company::getId, Company::getBusinessName));

        Map<UUID, String> categoryNames = categoryRepository.findAllById(categoryIds).stream()
                .collect(Collectors.toMap(ExpirationCategory::getId, ExpirationCategory::getName));

        Map<UUID, String> userNames = userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(User::getId, u -> u.getFirstName() + " " + u.getLastName()));

        List<AlertItemResponse> items = allAlerts.stream().map(exp -> {
            ExpirationDeadlineClassifier.ClassificationResult result = deadlineClassifier.classify(exp.getExpirationDate(), exp.getLifecycleStatus());
            long daysUntil = result.daysUntilExpiration() != null ? result.daysUntilExpiration() : ChronoUnit.DAYS.between(today, exp.getExpirationDate());

            String priority;
            if (exp.getExpirationDate().isBefore(today)) {
                priority = "CRITICAL";
            } else if (!exp.getExpirationDate().isAfter(today.plusDays(properties.getUrgentDays()))) {
                priority = "HIGH";
            } else {
                priority = "MEDIUM";
            }

            return AlertItemResponse.builder()
                    .expirationId(exp.getId())
                    .companyId(exp.getCompanyId())
                    .companyName(companyNames.getOrDefault(exp.getCompanyId(), "Empresa"))
                    .categoryId(exp.getCategoryId())
                    .categoryName(categoryNames.getOrDefault(exp.getCategoryId(), "General"))
                    .title(exp.getTitle())
                    .description(exp.getDescription())
                    .expirationDate(exp.getExpirationDate())
                    .deadlineStatus(result.deadlineStatus())
                    .daysUntilExpiration(daysUntil)
                    .priority(priority)
                    .responsibleUserId(exp.getResponsibleUserId())
                    .responsibleUserName(exp.getResponsibleUserId() != null ? userNames.get(exp.getResponsibleUserId()) : null)
                    .build();
        }).collect(Collectors.toList());

        return AlertsSummaryResponse.builder()
                .criticalCount(criticalCount)
                .highCount(highCount)
                .mediumCount(mediumCount)
                .totalCount(totalCount)
                .alerts(items)
                .build();
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
