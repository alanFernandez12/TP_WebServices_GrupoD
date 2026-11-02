package com.grupo_d_c2_2026_unla.rentar.controller;

import com.grupo_d_c2_2026_unla.rentar.dto.DisponibilidadFiltroInput;
import com.grupo_d_c2_2026_unla.rentar.dto.VehiculoDisponibleDTO;
import com.grupo_d_c2_2026_unla.rentar.service.VehiculoService;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

import java.util.List;

@Controller 
public class DisponibilidadResolver {

    private final VehiculoService vehiculoService;

    public DisponibilidadResolver(VehiculoService vehiculoService) {
        this.vehiculoService = vehiculoService;
    }

    @QueryMapping
    public List<VehiculoDisponibleDTO> vehiculosDisponibles(
            @Argument DisponibilidadFiltroInput filtro) {
        return vehiculoService.consultarDisponibilidad(filtro);
    }
    
}
