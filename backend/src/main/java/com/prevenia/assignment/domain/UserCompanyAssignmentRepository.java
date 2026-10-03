package com.prevenia.assignment.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserCompanyAssignmentRepository extends JpaRepository<UserCompanyAssignment, UUID> {

    Optional<UserCompanyAssignment> findByOrganizationIdAndUserIdAndCompanyId(UUID orgId, UUID userId, UUID companyId);

    List<UserCompanyAssignment> findAllByOrganizationIdAndCompanyIdAndActiveTrue(UUID orgId, UUID companyId);

    List<UserCompanyAssignment> findAllByOrganizationIdAndUserIdAndActiveTrue(UUID orgId, UUID userId);

    boolean existsByOrganizationIdAndUserIdAndCompanyIdAndActiveTrue(UUID orgId, UUID userId, UUID companyId);
}
