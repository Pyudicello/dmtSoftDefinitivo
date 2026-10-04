package com.prevenia.expiration.application;

import com.prevenia.expiration.api.dto.ExpirationFilterRequest;
import com.prevenia.expiration.domain.Expiration;
import com.prevenia.expiration.domain.ExpirationLifecycleStatus;
import com.prevenia.expiration.infrastructure.config.ExpirationProperties;
import com.prevenia.shared.security.AuthenticatedUser;
import com.prevenia.user.domain.UserRole;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;

public class ExpirationSpecification {

    public static Specification<Expiration> buildSpecification(
            AuthenticatedUser currentUser,
            Set<UUID> technicianAssignedCompanyIds,
            ExpirationFilterRequest filters,
            LocalDate today,
            ExpirationProperties properties) {

        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // 1. Mandatory Multi-Tenant Security Scope
            if (currentUser.getRole() == UserRole.PLATFORM_ADMIN) {
                // Platform admin has global cross-tenant visibility
            } else if (currentUser.getRole() == UserRole.CONSULTANT_ADMIN) {
                predicates.add(cb.equal(root.get("organizationId"), currentUser.getOrganizationId()));
            } else if (currentUser.getRole() == UserRole.TECHNICIAN) {
                predicates.add(cb.equal(root.get("organizationId"), currentUser.getOrganizationId()));
                if (technicianAssignedCompanyIds == null || technicianAssignedCompanyIds.isEmpty()) {
                    predicates.add(cb.disjunction());
                } else {
                    predicates.add(root.get("companyId").in(technicianAssignedCompanyIds));
                }
            } else if (currentUser.getRole() == UserRole.CLIENT) {
                if (currentUser.getCompanyId() == null) {
                    predicates.add(cb.disjunction());
                } else {
                    predicates.add(cb.equal(root.get("companyId"), currentUser.getCompanyId()));
                }
            } else {
                predicates.add(cb.disjunction());
            }

            // 2. Request Filters
            if (filters != null) {
                if (filters.getCompanyId() != null) {
                    predicates.add(cb.equal(root.get("companyId"), filters.getCompanyId()));
                }

                if (filters.getCategoryId() != null) {
                    predicates.add(cb.equal(root.get("categoryId"), filters.getCategoryId()));
                }

                if (filters.getLifecycleStatus() != null) {
                    predicates.add(cb.equal(root.get("lifecycleStatus"), filters.getLifecycleStatus()));
                }

                if (filters.getResponsibleUserId() != null) {
                    predicates.add(cb.equal(root.get("responsibleUserId"), filters.getResponsibleUserId()));
                }

                if (filters.getFrom() != null) {
                    predicates.add(cb.greaterThanOrEqualTo(root.get("expirationDate"), filters.getFrom()));
                }

                if (filters.getTo() != null) {
                    predicates.add(cb.lessThanOrEqualTo(root.get("expirationDate"), filters.getTo()));
                }

                if (filters.getSearch() != null && !filters.getSearch().trim().isEmpty()) {
                    String pattern = "%" + filters.getSearch().trim().toLowerCase() + "%";
                    predicates.add(cb.or(
                            cb.like(cb.lower(root.get("title")), pattern),
                            cb.like(cb.lower(cb.coalesce(root.get("description"), "")), pattern)
                    ));
                }

                if (filters.getDeadlineStatus() != null && today != null && properties != null) {
                    LocalDate urgentThreshold = today.plusDays(properties.getUrgentDays());
                    LocalDate upcomingThreshold = today.plusDays(properties.getUpcomingDays());

                    switch (filters.getDeadlineStatus()) {
                        case EXPIRED -> predicates.add(cb.and(
                                cb.equal(root.get("lifecycleStatus"), ExpirationLifecycleStatus.ACTIVE),
                                cb.lessThan(root.get("expirationDate"), today)
                        ));
                        case URGENT -> predicates.add(cb.and(
                                cb.equal(root.get("lifecycleStatus"), ExpirationLifecycleStatus.ACTIVE),
                                cb.greaterThanOrEqualTo(root.get("expirationDate"), today),
                                cb.lessThanOrEqualTo(root.get("expirationDate"), urgentThreshold)
                        ));
                        case UPCOMING -> predicates.add(cb.and(
                                cb.equal(root.get("lifecycleStatus"), ExpirationLifecycleStatus.ACTIVE),
                                cb.greaterThan(root.get("expirationDate"), urgentThreshold),
                                cb.lessThanOrEqualTo(root.get("expirationDate"), upcomingThreshold)
                        ));
                        case CURRENT -> predicates.add(cb.and(
                                cb.equal(root.get("lifecycleStatus"), ExpirationLifecycleStatus.ACTIVE),
                                cb.greaterThan(root.get("expirationDate"), upcomingThreshold)
                        ));
                    }
                }
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
