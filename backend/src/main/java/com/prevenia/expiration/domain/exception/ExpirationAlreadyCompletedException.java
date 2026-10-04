package com.prevenia.expiration.domain.exception;

import com.prevenia.shared.domain.DomainException;

public class ExpirationAlreadyCompletedException extends DomainException {
    public ExpirationAlreadyCompletedException(String message) {
        super("EXPIRATION_ALREADY_COMPLETED", message);
    }
}
