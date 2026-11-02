package com.grupo_d_c2_2026_unla.rentar.controller;

import com.grupo_d_c2_2026_unla.rentar.dto.ClienteRequestDTO;
import com.grupo_d_c2_2026_unla.rentar.dto.ClienteResponseDTO;
import com.grupo_d_c2_2026_unla.rentar.dto.ErrorResponse;
import com.grupo_d_c2_2026_unla.rentar.service.ClienteService;

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
import org.springframework.validation.annotation.Validated;
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
@RequestMapping("/api/clientes")
public class ClienteController {

    private final ClienteService clienteService;

    public ClienteController(ClienteService clienteService) {
        this.clienteService = clienteService;
    }

    // ALTA
    @Operation(
        summary = "Crear un cliente",
        description = "Registra un nuevo cliente en el sistema. "
                    + "El email y el documento deben ser únicos. "
                    + "Los datos se envían mediante el cuerpo de la solicitud."
    )
    @ApiResponses({
        @ApiResponse(
            responseCode = "201",
            description = "Cliente creado correctamente",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = ClienteResponseDTO.class)
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
    public ResponseEntity<ClienteResponseDTO> crear(
            @Validated(ClienteRequestDTO.Alta.class)
            @RequestBody ClienteRequestDTO cliente) {

        ClienteResponseDTO creado = clienteService.crear(cliente);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(creado);
    }

    // LISTADO
    @Operation(
        summary = "Listar todos los clientes",
        description = "Obtiene el listado de clientes registrados en el sistema."
    )
    @ApiResponses({
        @ApiResponse(
            responseCode = "200",
            description = "Listado obtenido correctamente",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(
                    type = "array",
                    implementation = ClienteResponseDTO.class
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
    public ResponseEntity<List<ClienteResponseDTO>> listarTodos() {

        List<ClienteResponseDTO> clientes = clienteService.listarTodos();

        return ResponseEntity.ok(clientes);
    }

    // BUSCAR POR ID
    @Operation(
        summary = "Buscar un cliente por ID",
        description = "Obtiene los datos de un cliente a partir de su identificador único."
    )
    @ApiResponses({
        @ApiResponse(
            responseCode = "200",
            description = "Cliente encontrado",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = ClienteResponseDTO.class)
            )
        ),
        @ApiResponse(
            responseCode = "404",
            description = "Cliente no encontrado",
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
    public ResponseEntity<ClienteResponseDTO> buscarPorId(
            @Parameter(
                description = "Identificador único del cliente",
                example = "1",
                required = true
            )
            @PathVariable("id") Long id) {

        ClienteResponseDTO cliente = clienteService.buscarPorId(id);

        return ResponseEntity.ok(cliente);
    }

    // MODIFICAR
    @Operation(
        summary = "Modificar un cliente",
        description = "Actualiza los datos de un cliente existente. "
                    + "Se debe indicar su identificador y enviar los nuevos datos "
                    + "mediante el cuerpo de la solicitud."
    )
    @ApiResponses({
        @ApiResponse(
            responseCode = "200",
            description = "Cliente modificado correctamente",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = ClienteResponseDTO.class)
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
            description = "Cliente no encontrado",
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
    public ResponseEntity<ClienteResponseDTO> modificar(
            @Parameter(
                description = "Identificador único del cliente que se desea modificar",
                example = "1",
                required = true
            )
            @PathVariable("id") Long id,
            @Valid @RequestBody ClienteRequestDTO cliente) {

        ClienteResponseDTO actualizado =
                clienteService.modificar(id, cliente);

        return ResponseEntity.ok(actualizado);
    }

    // BAJA LOGICA
    @Operation(
        summary = "Dar de baja un cliente",
        description = "Realiza la baja lógica de un cliente. "
                    + "El registro permanece almacenado en la base de datos, "
                    + "pero queda inactivo en el sistema."
    )
    @ApiResponses({
        @ApiResponse(
            responseCode = "204",
            description = "Cliente dado de baja correctamente"
        ),
        @ApiResponse(
            responseCode = "404",
            description = "Cliente no encontrado",
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
    public ResponseEntity<Void> bajaLogica(
            @Parameter(
                description = "Identificador único del cliente que se desea dar de baja",
                example = "1",
                required = true
            )
            @PathVariable("id") Long id) {

        clienteService.bajaLogica(id);

        return ResponseEntity.noContent().build();
    }

    // REACTIVAR
    @Operation(
        summary = "Reactivar un cliente",
        description = "Permite reactivar un cliente que fue dado de baja previamente."
    )
    @ApiResponses({
        @ApiResponse(
            responseCode = "204",
            description = "Cliente reactivado correctamente"
        ),
        @ApiResponse(
            responseCode = "404",
            description = "Cliente no encontrado",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = ErrorResponse.class)
            )
        ),
        @ApiResponse(
            responseCode = "400",
            description = "El cliente no puede ser reactivado por una regla de negocio",
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
                description = "Identificador único del cliente que se desea reactivar",
                example = "1",
                required = true
            )
            @PathVariable("id") Long id) {

        clienteService.reactivar(id);

        return ResponseEntity.noContent().build();
    }
}
