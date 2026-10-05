package com.prevenia.permit.application;

import com.prevenia.permit.api.dto.PermitFilterRequest;
import com.prevenia.permit.domain.Permit;
import com.prevenia.shared.security.AuthenticatedUser;
import com.prevenia.user.domain.UserRole;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;

public class PermitSpecification {

    public static Specification<Permit> buildSpecification(
            AuthenticatedUser currentUser,
            Set<UUID> assignedCompanyIds,
            PermitFilterRequest filters) {

        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // 1. Multi-Tenant / Role Security
            if (currentUser.getRole() == UserRole.PLATFORM_ADMIN) {
                // Platform admin can see everything
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

            // 3. Filter by PermitType
            if (filters != null && filters.getType() != null) {
                predicates.add(cb.equal(root.get("type"), filters.getType()));
            }

            // 4. Filter by PermitStatus
            if (filters != null && filters.getStatus() != null) {
                predicates.add(cb.equal(root.get("status"), filters.getStatus()));
            }

            // 5. Filter by Expiration Date range
            if (filters != null && filters.getFrom() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("expirationDate"), filters.getFrom()));
            }
            if (filters != null && filters.getTo() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("expirationDate"), filters.getTo()));
            }

            // 6. Search keyword across authority, permit number, contact, notes
            if (filters != null && filters.getSearch() != null && !filters.getSearch().trim().isEmpty()) {
                String searchPattern = "%" + filters.getSearch().trim().toLowerCase() + "%";
                Predicate authMatch = cb.like(cb.lower(root.get("issuingAuthority")), searchPattern);
                Predicate numberMatch = cb.like(cb.lower(root.get("permitNumber")), searchPattern);
                Predicate contactMatch = cb.like(cb.lower(root.get("contactName")), searchPattern);
                Predicate notesMatch = cb.like(cb.lower(root.get("notes")), searchPattern);
                predicates.add(cb.or(authMatch, numberMatch, contactMatch, notesMatch));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
