package com.grupo_d_c2_2026_unla.rentar.controller;


import com.grupo_d_c2_2026_unla.rentar.dto.VehiculoRequestDTO;
import com.grupo_d_c2_2026_unla.rentar.dto.VehiculoResponseDTO;
import com.grupo_d_c2_2026_unla.rentar.service.VehiculoService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
    @PostMapping
    public ResponseEntity<VehiculoResponseDTO> crear(@RequestBody VehiculoRequestDTO vehiculo) {
        // Reglas de negocio: patente única, estado inicial DISPONIBLE, activo=true
        // (esa lógica va en el Service, el controller solo orquesta)
        VehiculoResponseDTO creado = vehiculoService.crear(vehiculo);
        return ResponseEntity.status(HttpStatus.CREATED).body(creado);
    }

}
