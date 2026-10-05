package com.prevenia.inspection.domain;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface InspectionRepository extends JpaRepository<Inspection, UUID>, JpaSpecificationExecutor<Inspection> {

    List<Inspection> findByCompanyIdOrderByVisitDateDesc(UUID companyId);

    Page<Inspection> findByCompanyId(UUID companyId, Pageable pageable);

    Optional<Inspection> findByIdAndOrganizationId(UUID id, UUID organizationId);

    Optional<Inspection> findByExpirationId(UUID expirationId);
}
