package com.prevenia.expiration.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ExpirationCategoryRepository extends JpaRepository<ExpirationCategory, UUID> {

    @Query("SELECT c FROM ExpirationCategory c WHERE (c.organizationId IS NULL OR c.organizationId = :orgId) AND c.active = true ORDER BY c.isSystem DESC, c.name ASC")
    List<ExpirationCategory> findAccessibleCategories(@Param("orgId") UUID orgId);

    List<ExpirationCategory> findByActiveTrueOrderByNameAsc();

    Optional<ExpirationCategory> findByIdAndOrganizationId(UUID id, UUID organizationId);

    @Query("SELECT c FROM ExpirationCategory c WHERE c.id = :id AND (c.organizationId IS NULL OR c.organizationId = :orgId) AND c.active = true")
    Optional<ExpirationCategory> findAccessibleById(@Param("id") UUID id, @Param("orgId") UUID orgId);

    boolean existsByOrganizationIdAndCodeIgnoreCase(UUID organizationId, String code);

    boolean existsByOrganizationIdIsNullAndCodeIgnoreCase(String code);

    boolean existsByOrganizationIdAndNameIgnoreCase(UUID organizationId, String name);
}
