package com.prevenia.permit.domain;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PermitRepository extends JpaRepository<Permit, UUID>, JpaSpecificationExecutor<Permit> {

    List<Permit> findByCompanyIdAndStatusOrderByExpirationDateAsc(UUID companyId, PermitStatus status);

    List<Permit> findByCompanyIdOrderByExpirationDateDesc(UUID companyId);

    Page<Permit> findByCompanyId(UUID companyId, Pageable pageable);

    Optional<Permit> findByIdAndOrganizationId(UUID id, UUID organizationId);

    Optional<Permit> findByExpirationId(UUID expirationId);

    List<Permit> findByPreviousPermitId(UUID previousPermitId);
}
