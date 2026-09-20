package com.grupo_d_c2_2026_unla.rentar.controller;

import com.grupo_d_c2_2026_unla.rentar.dto.ClienteRequestDTO;
import com.grupo_d_c2_2026_unla.rentar.dto.ClienteResponseDTO;
import com.grupo_d_c2_2026_unla.rentar.dto.ErrorResponse;
import com.grupo_d_c2_2026_unla.rentar.service.ClienteService;

import io.swagger.v3.oas.annotations.Operation;
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
        description = "Crea un nuevo cliente. El email y documento deben ser únicos."
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
            @Valid @RequestBody ClienteRequestDTO cliente) {

        ClienteResponseDTO creado = clienteService.crear(cliente);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(creado);
    }

    // LISTADO
    @Operation(
        summary = "Listar todos los clientes"
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
        summary = "Buscar un cliente por ID"
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
            @PathVariable("id") Long id) {

        ClienteResponseDTO cliente = clienteService.buscarPorId(id);

        return ResponseEntity.ok(cliente);
    }

    // MODIFICAR
    @Operation(
        summary = "Modificar un cliente"
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
            @PathVariable("id") Long id,
            @Valid @RequestBody ClienteRequestDTO cliente) {

        ClienteResponseDTO actualizado =
                clienteService.modificar(id, cliente);

        return ResponseEntity.ok(actualizado);
    }

    // BAJA LOGICA
    @Operation(
        summary = "Dar de baja un cliente"
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
            @PathVariable("id") Long id) {

        clienteService.bajaLogica(id);

        return ResponseEntity.noContent().build();
    }
}
