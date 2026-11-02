package com.grupo_d_c2_2026_unla.rentar.controller;

import com.grupo_d_c2_2026_unla.rentar.dto.ErrorResponse;
import com.grupo_d_c2_2026_unla.rentar.dto.VehiculoRequestDTO;
import com.grupo_d_c2_2026_unla.rentar.dto.VehiculoResponseDTO;
import com.grupo_d_c2_2026_unla.rentar.service.VehiculoService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;

import jakarta.validation.Valid;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
        description = "Registra un nuevo vehículo en el sistema. "
                    + "Los datos necesarios para su creación deben enviarse "
                    + "mediante el cuerpo de la solicitud. "
                    + "La patente debe ser única."
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
            description = "Datos inválidos o incumplimiento de una regla de negocio, como una patente duplicada",
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
        description = "Realiza la baja lógica de un vehículo. "
                    + "El registro permanece almacenado en la base de datos, "
                    + "pero queda inactivo y deja de estar disponible "
                    + "para las operaciones que requieran un vehículo activo."
    )
    @ApiResponses({
        @ApiResponse(
            responseCode = "204",
            description = "Vehículo dado de baja correctamente"
        ),
        @ApiResponse(
            responseCode = "400",
            description = "El vehículo no puede ser dado de baja por una regla de negocio",
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
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> baja(
            @Parameter(
                description = "Identificador único del vehículo que se desea dar de baja",
                example = "1",
                required = true
            )
            @PathVariable("id") Integer id) {

        vehiculoService.bajaLogica(id);

        return ResponseEntity.noContent().build();
    }

    // REACTIVAR
    @Operation(
        summary = "Reactivar un vehículo",
        description = "Permite reactivar un vehículo que fue dado de baja previamente. "
                    + "El registro vuelve a quedar activo en el sistema."
    )
    @ApiResponses({
        @ApiResponse(
            responseCode = "204",
            description = "Vehículo reactivado correctamente"
        ),
        @ApiResponse(
            responseCode = "400",
            description = "El vehículo no puede ser reactivado por una regla de negocio",
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
    @PatchMapping("/{id}/reactivar")
    public ResponseEntity<Void> reactivar(
            @Parameter(
                description = "Identificador único del vehículo que se desea reactivar",
                example = "1",
                required = true
            )
            @PathVariable("id") Integer id) {

        vehiculoService.reactivar(id);

        return ResponseEntity.noContent().build();
    }

    // MODIFICACIÓN
    @Operation(
        summary = "Modificar un vehículo",
        description = "Actualiza los datos de un vehículo existente. "
                    + "Se debe indicar su identificador y enviar los nuevos datos "
                    + "mediante el cuerpo de la solicitud."
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
            @Parameter(
                description = "Identificador único del vehículo que se desea modificar",
                example = "1",
                required = true
            )
            @PathVariable("id") Integer id,
            @Valid @RequestBody VehiculoRequestDTO vehiculo) {

        VehiculoResponseDTO modificado =
                vehiculoService.modificar(id, vehiculo);

        return ResponseEntity.ok(modificado);
    }

    // OBTENER POR ID
    @Operation(
        summary = "Obtener un vehículo por ID",
        description = "Obtiene los datos de un vehículo a partir de su identificador único."
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
            @Parameter(
                description = "Identificador único del vehículo",
                example = "1",
                required = true
            )
            @PathVariable("id") Integer id) {

        VehiculoResponseDTO encontrado =
                vehiculoService.buscarPorId(id);

        return ResponseEntity.ok(encontrado);
    }

    // LISTAR VEHÍCULOS
    @Operation(
        summary = "Listar todos los vehículos",
        description = "Obtiene el listado de vehículos registrados en el sistema."
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