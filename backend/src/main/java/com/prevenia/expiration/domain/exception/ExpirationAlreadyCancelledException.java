package com.prevenia.expiration.domain.exception;

import com.prevenia.shared.domain.DomainException;

public class ExpirationAlreadyCancelledException extends DomainException {
    public ExpirationAlreadyCancelledException(String message) {
        super("EXPIRATION_ALREADY_CANCELLED", message);
    }
}
