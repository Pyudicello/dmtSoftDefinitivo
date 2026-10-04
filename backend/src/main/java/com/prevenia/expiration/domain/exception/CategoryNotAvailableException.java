package com.prevenia.expiration.domain.exception;

import com.prevenia.shared.domain.DomainException;

public class CategoryNotAvailableException extends DomainException {
    public CategoryNotAvailableException(String message) {
        super("CATEGORY_NOT_AVAILABLE", message);
    }
}
