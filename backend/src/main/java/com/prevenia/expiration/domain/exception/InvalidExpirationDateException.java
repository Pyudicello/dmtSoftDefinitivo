package com.prevenia.expiration.domain.exception;

import com.prevenia.shared.domain.DomainException;

public class InvalidExpirationDateException extends DomainException {
    public InvalidExpirationDateException(String message) {
        super("INVALID_EXPIRATION_DATE", message);
    }
}
