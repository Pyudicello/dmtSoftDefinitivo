package com.prevenia.expiration.api;

import com.prevenia.expiration.api.dto.CreateCategoryRequest;
import com.prevenia.expiration.api.dto.ExpirationCategoryResponse;
import com.prevenia.expiration.api.dto.UpdateCategoryRequest;
import com.prevenia.expiration.application.ExpirationCategoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/expiration-categories")
@RequiredArgsConstructor
public class ExpirationCategoryController {

    private final ExpirationCategoryService categoryService;

    @GetMapping
    public ResponseEntity<List<ExpirationCategoryResponse>> listCategories() {
        List<ExpirationCategoryResponse> categories = categoryService.listAccessibleCategories();
        return ResponseEntity.ok(categories);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ExpirationCategoryResponse> getCategoryById(@PathVariable UUID id) {
        ExpirationCategoryResponse category = categoryService.getCategoryById(id);
        return ResponseEntity.ok(category);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'CONSULTANT_ADMIN')")
    public ResponseEntity<ExpirationCategoryResponse> createCategory(@Valid @RequestBody CreateCategoryRequest request) {
        ExpirationCategoryResponse created = categoryService.createCategory(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'CONSULTANT_ADMIN')")
    public ResponseEntity<ExpirationCategoryResponse> updateCategory(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateCategoryRequest request) {
        ExpirationCategoryResponse updated = categoryService.updateCategory(id, request);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'CONSULTANT_ADMIN')")
    public ResponseEntity<Void> deactivateCategory(@PathVariable UUID id) {
        categoryService.deactivateCategory(id);
        return ResponseEntity.noContent().build();
    }
}
