package com.grupo_d_c2_2026_unla.rentar.dto;

import com.grupo_d_c2_2026_unla.rentar.enums.EstadoReserva;
import com.grupo_d_c2_2026_unla.rentar.enums.TipoVehiculo;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReservaFilterInput {

    private Long clienteId;
    private Integer vehiculoId;
    private TipoVehiculo tipoVehiculo;
    private EstadoReserva estadoReserva;
    private String fechaDesde;
    private String fechaHasta;

    public ReservaFilterInput() {
    }
}
