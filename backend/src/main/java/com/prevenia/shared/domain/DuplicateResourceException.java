package com.prevenia.shared.domain;

public class DuplicateResourceException extends DomainException {

    public DuplicateResourceException(String resourceName, String field, Object value) {
        super("DUPLICATE_RESOURCE", String.format("%s with %s '%s' already exists", resourceName, field, value));
    }

    public DuplicateResourceException(String message) {
        super("DUPLICATE_RESOURCE", message);
    }
}
