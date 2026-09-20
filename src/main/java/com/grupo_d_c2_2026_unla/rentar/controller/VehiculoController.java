package com.grupo_d_c2_2026_unla.rentar.controller;

import com.grupo_d_c2_2026_unla.rentar.dto.ErrorResponse;
import com.grupo_d_c2_2026_unla.rentar.dto.VehiculoRequestDTO;
import com.grupo_d_c2_2026_unla.rentar.dto.VehiculoResponseDTO;
import com.grupo_d_c2_2026_unla.rentar.service.VehiculoService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vehiculos")
public class VehiculoController {

    private final VehiculoService vehiculoService;

    public VehiculoController(VehiculoService vehiculoService) {
        this.vehiculoService = vehiculoService;
    }

    // ALTA
    @Operation(
        summary = "Crear un vehículo",
        description = "Crea un nuevo vehículo."
    )
    @ApiResponses({
        @ApiResponse(
            responseCode = "201",
            description = "Vehículo creado correctamente",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = VehiculoResponseDTO.class)
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
            responseCode = "500",
            description = "Error interno del servidor",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = ErrorResponse.class)
            )
        )
    })
    @PostMapping
    public ResponseEntity<VehiculoResponseDTO> crear(
            @Valid @RequestBody VehiculoRequestDTO vehiculo) {

        VehiculoResponseDTO creado = vehiculoService.crear(vehiculo);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(creado);
    }

    // BAJA LÓGICA
    @Operation(
        summary = "Dar de baja un vehículo",
        description = "Realiza la baja lógica de un vehículo."
    )
    @ApiResponses({
        @ApiResponse(
            responseCode = "204",
            description = "Vehículo dado de baja correctamente"
        ),
        @ApiResponse(
            responseCode = "404",
            description = "Vehículo no encontrado",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = ErrorResponse.class)
            )
        ),
        @ApiResponse(
            responseCode = "400",
            description = "El vehículo no puede ser dado de baja",
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
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> baja(@PathVariable Integer id) {

        vehiculoService.bajaLogica(id);

        return ResponseEntity.noContent().build();
    }

    // MODIFICACIÓN
    @Operation(
        summary = "Modificar un vehículo",
        description = "Modifica los datos de un vehículo existente."
    )
    @ApiResponses({
        @ApiResponse(
            responseCode = "200",
            description = "Vehículo modificado correctamente",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = VehiculoResponseDTO.class)
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
            description = "Vehículo no encontrado",
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
    @PutMapping("/{id}")
    public ResponseEntity<VehiculoResponseDTO> modificar(
            @PathVariable Integer id,
            @Valid @RequestBody VehiculoRequestDTO vehiculo) {

        VehiculoResponseDTO modificado =
                vehiculoService.modificar(id, vehiculo);

        return ResponseEntity.ok(modificado);
    }

    // OBTENER POR ID
    @Operation(
        summary = "Obtener un vehículo por ID"
    )
    @ApiResponses({
        @ApiResponse(
            responseCode = "200",
            description = "Vehículo encontrado",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = VehiculoResponseDTO.class)
            )
        ),
        @ApiResponse(
            responseCode = "404",
            description = "Vehículo no encontrado",
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
    @GetMapping("/{id}")
    public ResponseEntity<VehiculoResponseDTO> buscarPorId(
            @PathVariable Integer id) {

        VehiculoResponseDTO encontrado =
                vehiculoService.buscarPorId(id);

        return ResponseEntity.ok(encontrado);
    }

    // LISTAR VEHÍCULOS
    @Operation(
        summary = "Listar todos los vehículos"
    )
    @ApiResponses({
        @ApiResponse(
            responseCode = "200",
            description = "Listado obtenido correctamente",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(
                    type = "array",
                    implementation = VehiculoResponseDTO.class
                )
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
    @GetMapping
    public ResponseEntity<List<VehiculoResponseDTO>> listarTodos() {

        List<VehiculoResponseDTO> vehiculos =
                vehiculoService.listarTodos();

        return ResponseEntity.ok(vehiculos);
    }
}
