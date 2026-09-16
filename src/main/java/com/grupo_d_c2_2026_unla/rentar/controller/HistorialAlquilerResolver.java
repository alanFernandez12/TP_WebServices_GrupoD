package com.grupo_d_c2_2026_unla.rentar.controller;

import com.grupo_d_c2_2026_unla.rentar.dto.HistorialAlquilerDTO;
import com.grupo_d_c2_2026_unla.rentar.service.ReservaService;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

import java.util.List;

@Controller 
public class HistorialAlquilerResolver {
     
    private final ReservaService reservaService;

    public HistorialAlquilerResolver(ReservaService reservaService) {
        this.reservaService = reservaService;
    }

    @QueryMapping
    public List<HistorialAlquilerDTO> historialAlquileres(@Argument Long clienteId) {
        return reservaService.consultarHistorial(clienteId);
    }
}
