package com.prevenia.expiration.api.dto;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CancelExpirationRequest {

    @Size(max = 255, message = "Cancellation reason must not exceed 255 characters")
    private String reason;
}
