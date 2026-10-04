package com.prevenia.expiration.domain.exception;

import com.prevenia.shared.domain.DomainException;

public class ResponsibleUserNotAvailableException extends DomainException {
    public ResponsibleUserNotAvailableException(String message) {
        super("RESPONSIBLE_USER_NOT_AVAILABLE", message);
    }
}
