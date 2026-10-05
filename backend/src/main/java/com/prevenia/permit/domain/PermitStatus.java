package com.prevenia.permit.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum PermitStatus {
    ACTIVE("Vigente", "Habilitación vigente"),
    RENEWED("Renovada", "Habilitación histórica que ha sido renovada por un nuevo trámite"),
    EXPIRED("Vencida", "Habilitación que ha alcanzado su fecha límite de vigencia"),
    CANCELLED("Anulada", "Habilitación dada de baja o cancelada");

    private final String label;
    private final String description;
}
