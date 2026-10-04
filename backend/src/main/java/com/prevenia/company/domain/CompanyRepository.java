package com.prevenia.company.domain;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CompanyRepository extends JpaRepository<Company, UUID> {

    Optional<Company> findByIdAndOrganizationId(UUID id, UUID organizationId);

    Page<Company> findAllByOrganizationId(UUID organizationId, Pageable pageable);

    Page<Company> findAllByIdIn(Collection<UUID> ids, Pageable pageable);

    Page<Company> findAllByIdInAndOrganizationId(Collection<UUID> ids, UUID organizationId, Pageable pageable);

    boolean existsByTaxIdAndOrganizationId(String taxId, UUID organizationId);

    boolean existsByIdAndOrganizationId(UUID id, UUID organizationId);

    long countByOrganizationId(UUID organizationId);
}
