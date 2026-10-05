package com.prevenia.inspection.application;

import com.prevenia.inspection.api.dto.InspectionFilterRequest;
import com.prevenia.inspection.domain.Inspection;
import com.prevenia.shared.security.AuthenticatedUser;
import com.prevenia.user.domain.UserRole;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;

public class InspectionSpecification {

    public static Specification<Inspection> buildSpecification(
            AuthenticatedUser currentUser,
            Set<UUID> assignedCompanyIds,
            InspectionFilterRequest filters) {

        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // 1. Multi-Tenant / Role Security
            if (currentUser.getRole() == UserRole.PLATFORM_ADMIN) {
                // Platform admin can filter by org if needed, otherwise sees everything
            } else if (currentUser.getRole() == UserRole.CONSULTANT_ADMIN) {
                predicates.add(cb.equal(root.get("organizationId"), currentUser.getOrganizationId()));
            } else if (currentUser.getRole() == UserRole.TECHNICIAN) {
                predicates.add(cb.equal(root.get("organizationId"), currentUser.getOrganizationId()));
                if (assignedCompanyIds == null || assignedCompanyIds.isEmpty()) {
                    predicates.add(cb.disjunction());
                } else {
                    predicates.add(root.get("companyId").in(assignedCompanyIds));
                }
            } else if (currentUser.getRole() == UserRole.CLIENT) {
                if (currentUser.getCompanyId() != null) {
                    predicates.add(cb.equal(root.get("companyId"), currentUser.getCompanyId()));
                } else {
                    predicates.add(cb.disjunction());
                }
            }

            // 2. Filter by Company
            if (filters != null && filters.getCompanyId() != null) {
                predicates.add(cb.equal(root.get("companyId"), filters.getCompanyId()));
            }

            // 3. Filter by InspectionType
            if (filters != null && filters.getType() != null) {
                predicates.add(cb.equal(root.get("type"), filters.getType()));
            }

            // 4. Filter by Visit Date range
            if (filters != null && filters.getFrom() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("visitDate"), filters.getFrom()));
            }
            if (filters != null && filters.getTo() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("visitDate"), filters.getTo()));
            }

            // 5. Search keyword across authority, contact, result, notes
            if (filters != null && filters.getSearch() != null && !filters.getSearch().trim().isEmpty()) {
                String searchPattern = "%" + filters.getSearch().trim().toLowerCase() + "%";
                Predicate authMatch = cb.like(cb.lower(root.get("authority")), searchPattern);
                Predicate contactMatch = cb.like(cb.lower(root.get("contactName")), searchPattern);
                Predicate docMatch = cb.like(cb.lower(root.get("documentReference")), searchPattern);
                Predicate notesMatch = cb.like(cb.lower(root.get("notes")), searchPattern);
                predicates.add(cb.or(authMatch, contactMatch, docMatch, notesMatch));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
