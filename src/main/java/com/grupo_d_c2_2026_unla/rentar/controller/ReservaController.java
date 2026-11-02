package com.grupo_d_c2_2026_unla.rentar.controller;

import com.grupo_d_c2_2026_unla.rentar.dto.ErrorResponse;
import com.grupo_d_c2_2026_unla.rentar.dto.ReservaRequestDTO;
import com.grupo_d_c2_2026_unla.rentar.dto.ReservaResponseDTO;
import com.grupo_d_c2_2026_unla.rentar.service.ReservaService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reservas")
public class ReservaController {

    private final ReservaService reservaService;

    public ReservaController(ReservaService reservaService) {
        this.reservaService = reservaService;
    }

    // CREAR RESERVA
    @Operation(
        summary = "Crear una reserva",
        description = "Registra una nueva reserva para un vehículo. "
                    + "Se deben proporcionar los datos del cliente, "
                    + "el vehículo y el período de alquiler. "
                    + "La operación verifica que se cumplan las condiciones "
                    + "necesarias para realizar la reserva."
    )
    @ApiResponses({
        @ApiResponse(
            responseCode = "201",
            description = "Reserva creada correctamente",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = ReservaResponseDTO.class)
            )
        ),
        @ApiResponse(
            responseCode = "400",
            description = "Datos inválidos o incumplimiento de una regla de negocio",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = ErrorResponse.class)
            )
        ),
        @ApiResponse(
            responseCode = "404",
            description = "No se encontró el cliente o vehículo necesario para crear la reserva",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = ErrorResponse.class)
            )
        ),
        @ApiResponse(
            responseCode = "500",
            description = "Error interno del servidor",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = ErrorResponse.class)
            )
        )
    })
    @PostMapping
    public ResponseEntity<ReservaResponseDTO> crear(
            @Valid @RequestBody ReservaRequestDTO dto) {

        ReservaResponseDTO creada = reservaService.crear(dto);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(creada);
    }

    // CANCELAR RESERVA
    @Operation(
        summary = "Cancelar una reserva",
        description = "Cancela una reserva existente a partir de su identificador. "
                    + "La operación modifica el estado de la reserva "
                    + "sin eliminar el registro del sistema."
    )
    @ApiResponses({
        @ApiResponse(
            responseCode = "200",
            description = "Reserva cancelada correctamente",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = ReservaResponseDTO.class)
            )
        ),
        @ApiResponse(
            responseCode = "400",
            description = "La reserva no puede ser cancelada por su estado actual o por una regla de negocio",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = ErrorResponse.class)
            )
        ),
        @ApiResponse(
            responseCode = "404",
            description = "Reserva no encontrada",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = ErrorResponse.class)
            )
        ),
        @ApiResponse(
            responseCode = "500",
            description = "Error interno del servidor",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = ErrorResponse.class)
            )
        )
    })
    @PatchMapping("/{id}/cancelar")
    public ResponseEntity<ReservaResponseDTO> cancelar(
            @Parameter(
                description = "Identificador único de la reserva que se desea cancelar",
                example = "1",
                required = true
            )
            @PathVariable("id") Long id) {

        ReservaResponseDTO cancelada = reservaService.cancelar(id);

        return ResponseEntity.ok(cancelada);
    }
}