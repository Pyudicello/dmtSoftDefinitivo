package com.prevenia.inspection.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum InspectionType {
    ART("ART", "Inspección de Aseguradora de Riesgos del Trabajo (ART)"),
    MUNICIPAL("Municipal", "Inspección Municipal / Habilitaciones e Higiene"),
    PROVINCIAL("Provincial", "Inspección Provincial / Ministerio de Trabajo"),
    HYGIENE_SAFETY_SERVICE("Servicio de Higiene y Seguridad", "Visita periódica del Servicio de Higiene y Seguridad"),
    OTHER("Otro", "Otra inspección u organismo de control");

    private final String label;
    private final String description;
}
