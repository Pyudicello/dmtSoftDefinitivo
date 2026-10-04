package com.prevenia.expiration.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ExpirationRepository extends JpaRepository<Expiration, UUID>, JpaSpecificationExecutor<Expiration> {

    Optional<Expiration> findByIdAndOrganizationId(UUID id, UUID organizationId);

    long countByCompanyIdAndLifecycleStatus(UUID companyId, ExpirationLifecycleStatus lifecycleStatus);
}
