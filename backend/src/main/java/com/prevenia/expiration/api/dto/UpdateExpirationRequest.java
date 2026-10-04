package com.prevenia.expiration.api.dto;

import com.prevenia.expiration.domain.RecurrenceType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateExpirationRequest {

    @NotNull(message = "Category ID is required")
    private UUID categoryId;

    @NotBlank(message = "Title is required")
    @Size(max = 200, message = "Title must not exceed 200 characters")
    private String title;

    private String description;

    private LocalDate issueDate;

    @NotNull(message = "Expiration date is required")
    private LocalDate expirationDate;

    private UUID responsibleUserId;

    @Builder.Default
    private RecurrenceType recurrenceType = RecurrenceType.NONE;

    @Builder.Default
    private Integer notificationDaysBefore = 30;

    private String notes;
}
