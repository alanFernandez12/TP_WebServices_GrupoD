package com.grupo_d_c2_2026_unla.rentar.controller;

import com.grupo_d_c2_2026_unla.rentar.dto.ErrorResponse;
import com.grupo_d_c2_2026_unla.rentar.dto.ReservaRequestDTO;
import com.grupo_d_c2_2026_unla.rentar.dto.ReservaResponseDTO;
import com.grupo_d_c2_2026_unla.rentar.service.ReservaService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
        description = "Crea una nueva reserva para un vehículo."
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
            description = "No se encontró el recurso necesario para crear la reserva",
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
        description = "Cancela una reserva existente."
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
            responseCode = "404",
            description = "Reserva no encontrada",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = ErrorResponse.class)
            )
        ),
        @ApiResponse(
            responseCode = "400",
            description = "La reserva no puede ser cancelada",
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
            @PathVariable Long id) {

        ReservaResponseDTO cancelada = reservaService.cancelar(id);

        return ResponseEntity.ok(cancelada);
    }
}
