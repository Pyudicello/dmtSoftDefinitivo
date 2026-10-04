package com.prevenia.expiration.application;

import com.prevenia.expiration.api.dto.CreateCategoryRequest;
import com.prevenia.expiration.api.dto.ExpirationCategoryResponse;
import com.prevenia.expiration.api.dto.UpdateCategoryRequest;
import com.prevenia.expiration.domain.ExpirationCategory;
import com.prevenia.expiration.domain.ExpirationCategoryRepository;
import com.prevenia.shared.domain.DuplicateResourceException;
import com.prevenia.shared.domain.ForbiddenException;
import com.prevenia.shared.domain.ResourceNotFoundException;
import com.prevenia.shared.security.AuthenticatedUser;
import com.prevenia.shared.security.SecurityContextFacade;
import com.prevenia.user.domain.UserRole;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ExpirationCategoryService {

    private final ExpirationCategoryRepository categoryRepository;
    private final SecurityContextFacade securityContextFacade;

    @Transactional(readOnly = true)
    public List<ExpirationCategoryResponse> listAccessibleCategories() {
        AuthenticatedUser currentUser = securityContextFacade.getRequiredUser();
        List<ExpirationCategory> categories;

        if (currentUser.getRole() == UserRole.PLATFORM_ADMIN) {
            categories = categoryRepository.findByActiveTrueOrderByNameAsc();
        } else {
            categories = categoryRepository.findAccessibleCategories(currentUser.getOrganizationId());
        }

        return categories.stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ExpirationCategoryResponse getCategoryById(UUID id) {
        AuthenticatedUser currentUser = securityContextFacade.getRequiredUser();
        ExpirationCategory category;

        if (currentUser.getRole() == UserRole.PLATFORM_ADMIN) {
            category = categoryRepository.findById(id)
                    .filter(ExpirationCategory::isActive)
                    .orElseThrow(() -> new ResourceNotFoundException("ExpirationCategory", id));
        } else {
            category = categoryRepository.findAccessibleById(id, currentUser.getOrganizationId())
                    .orElseThrow(() -> new ResourceNotFoundException("ExpirationCategory", id));
        }

        return mapToResponse(category);
    }

    @Transactional
    public ExpirationCategoryResponse createCategory(CreateCategoryRequest request) {
        AuthenticatedUser currentUser = securityContextFacade.getRequiredUser();

        if (currentUser.getRole() != UserRole.PLATFORM_ADMIN && currentUser.getRole() != UserRole.CONSULTANT_ADMIN) {
            throw new ForbiddenException("Only administrators can create expiration categories");
        }

        UUID targetOrgId;
        boolean isSystem = false;

        if (currentUser.getRole() == UserRole.PLATFORM_ADMIN) {
            targetOrgId = request.getOrganizationId();
            isSystem = targetOrgId == null;
        } else {
            targetOrgId = currentUser.getOrganizationId();
        }

        String normalizedCode = request.getCode().trim().toUpperCase();

        if (targetOrgId == null) {
            if (categoryRepository.existsByOrganizationIdIsNullAndCodeIgnoreCase(normalizedCode)) {
                throw new DuplicateResourceException("Global expiration category with code '" + normalizedCode + "' already exists");
            }
        } else {
            if (categoryRepository.existsByOrganizationIdAndCodeIgnoreCase(targetOrgId, normalizedCode)) {
                throw new DuplicateResourceException("Expiration category with code '" + normalizedCode + "' already exists in your organization");
            }
        }

        ExpirationCategory category = ExpirationCategory.builder()
                .organizationId(targetOrgId)
                .code(normalizedCode)
                .name(request.getName().trim())
                .description(request.getDescription())
                .icon(request.getIcon())
                .colorCode(request.getColorCode())
                .isSystem(isSystem)
                .active(true)
                .build();

        ExpirationCategory saved = categoryRepository.save(category);
        log.info("Expiration category '{}' ({}) created by user {}", saved.getName(), saved.getId(), currentUser.getEmail());
        return mapToResponse(saved);
    }

    @Transactional
    public ExpirationCategoryResponse updateCategory(UUID id, UpdateCategoryRequest request) {
        AuthenticatedUser currentUser = securityContextFacade.getRequiredUser();

        if (currentUser.getRole() != UserRole.PLATFORM_ADMIN && currentUser.getRole() != UserRole.CONSULTANT_ADMIN) {
            throw new ForbiddenException("Only administrators can edit expiration categories");
        }

        ExpirationCategory category = categoryRepository.findById(id)
                .filter(ExpirationCategory::isActive)
                .orElseThrow(() -> new ResourceNotFoundException("ExpirationCategory", id));

        if (category.isGlobal() && currentUser.getRole() != UserRole.PLATFORM_ADMIN) {
            throw new ForbiddenException("Only platform administrators can modify global categories");
        }

        if (!category.isGlobal() && currentUser.getRole() == UserRole.CONSULTANT_ADMIN) {
            if (!category.getOrganizationId().equals(currentUser.getOrganizationId())) {
                throw new ResourceNotFoundException("ExpirationCategory", id);
            }
        }

        category.setName(request.getName().trim());
        category.setDescription(request.getDescription());
        category.setIcon(request.getIcon());
        category.setColorCode(request.getColorCode());

        ExpirationCategory updated = categoryRepository.save(category);
        log.info("Expiration category '{}' ({}) updated by user {}", updated.getName(), updated.getId(), currentUser.getEmail());
        return mapToResponse(updated);
    }

    @Transactional
    public void deactivateCategory(UUID id) {
        AuthenticatedUser currentUser = securityContextFacade.getRequiredUser();

        if (currentUser.getRole() != UserRole.PLATFORM_ADMIN && currentUser.getRole() != UserRole.CONSULTANT_ADMIN) {
            throw new ForbiddenException("Only administrators can deactivate expiration categories");
        }

        ExpirationCategory category = categoryRepository.findById(id)
                .filter(ExpirationCategory::isActive)
                .orElseThrow(() -> new ResourceNotFoundException("ExpirationCategory", id));

        if (category.isGlobal() && currentUser.getRole() != UserRole.PLATFORM_ADMIN) {
            throw new ForbiddenException("Only platform administrators can deactivate global categories");
        }

        if (!category.isGlobal() && currentUser.getRole() == UserRole.CONSULTANT_ADMIN) {
            if (!category.getOrganizationId().equals(currentUser.getOrganizationId())) {
                throw new ResourceNotFoundException("ExpirationCategory", id);
            }
        }

        category.setActive(false);
        categoryRepository.save(category);
        log.info("Expiration category '{}' ({}) deactivated by user {}", category.getName(), category.getId(), currentUser.getEmail());
    }

    public ExpirationCategoryResponse mapToResponse(ExpirationCategory entity) {
        return ExpirationCategoryResponse.builder()
                .id(entity.getId())
                .organizationId(entity.getOrganizationId())
                .code(entity.getCode())
                .name(entity.getName())
                .description(entity.getDescription())
                .icon(entity.getIcon())
                .colorCode(entity.getColorCode())
                .isSystem(entity.isSystem())
                .active(entity.isActive())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
