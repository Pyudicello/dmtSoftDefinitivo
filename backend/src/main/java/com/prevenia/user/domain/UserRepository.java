package com.prevenia.user.domain;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmail(String email);

    Optional<User> findByIdAndOrganizationId(UUID id, UUID organizationId);

    Page<User> findAllByOrganizationId(UUID organizationId, Pageable pageable);

    Page<User> findAllByOrganizationIdAndRole(UUID organizationId, UserRole role, Pageable pageable);

    Page<User> findAllByRole(UserRole role, Pageable pageable);

    boolean existsByEmail(String email);
}
