package com.prevenia.permit.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum PermitType {
    MUNICIPAL("Municipal", "Habilitación Comercial / Municipal"),
    PROVINCIAL("Provincial", "Habilitación Provincial / Radicación Industrial"),
    FIRE_DEPARTMENT("Bomberos", "Habilitación y Certificado de Bomberos / Siniestros"),
    OTHER("Otro", "Otra habilitación, visado o permiso oficial");

    private final String label;
    private final String description;
}
