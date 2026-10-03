package com.prevenia.shared.domain;

public class InvalidAssignmentException extends DomainException {

    public InvalidAssignmentException(String message) {
        super("INVALID_ASSIGNMENT", message);
    }
}
