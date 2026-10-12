package com.grupo_d_c2_2026_unla.rentar.dto;

import com.grupo_d_c2_2026_unla.rentar.enums.EstadoReserva;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
public class ReservaResponseDTO {

    private Long id;
    private ClienteResponseDTO cliente;
    private VehiculoResponseDTO vehiculo;
    private String patente;
    private Long idTiempo;
    private LocalDateTime horaInicio;
    private LocalDateTime horaFin;
    private Integer duracionDias;
    private BigDecimal precioDiarioHistorico;
    private BigDecimal importeTotal;
    private EstadoReserva estadoReserva;

    public ReservaResponseDTO() {
    }

    public ReservaResponseDTO(
            Long id,
            ClienteResponseDTO cliente,
            VehiculoResponseDTO vehiculo,
            String patente,
            Long idTiempo,
            LocalDateTime horaInicio,
            LocalDateTime horaFin,
            Integer duracionDias,
            BigDecimal precioDiarioHistorico,
            BigDecimal importeTotal,
            EstadoReserva estadoReserva) {
        this.id = id;
        this.idTiempo = idTiempo;
        this.cliente = cliente;
        this.vehiculo = vehiculo;
        this.patente = patente;
        this.horaInicio = horaInicio;
        this.horaFin = horaFin;
        this.duracionDias = duracionDias;
        this.precioDiarioHistorico = precioDiarioHistorico;
        this.importeTotal = importeTotal;
        this.estadoReserva = estadoReserva;
    }

    @Override
    public String toString() {
        return "ReservaResponseDTO{" +
                "Reserva a nombre de " + (cliente != null ? cliente.getNombre() + " " + cliente.getApellido():"sin cliente") +
                ", tipoVehiculo=" + (vehiculo != null ? vehiculo.getTipoVehiculo() : "sin vehículo") +
                ", patente='" + patente + '\'' +
                ", idTiempo=" + idTiempo +
                ", horaInicio=" + horaInicio +
                ", horaFin=" + horaFin +
                ", duracionDias=" + duracionDias +
                ", precioDiarioHistorico=" + precioDiarioHistorico +
                ", importeTotal=" + importeTotal +
                ", estadoReserva='" + estadoReserva + '\'' +
                '}';
    }
}