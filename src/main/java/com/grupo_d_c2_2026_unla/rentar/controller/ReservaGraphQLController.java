package com.grupo_d_c2_2026_unla.rentar.controller;

import com.grupo_d_c2_2026_unla.rentar.dto.ReservaFilterInput;
import com.grupo_d_c2_2026_unla.rentar.dto.ReservaResponseDTO;
import com.grupo_d_c2_2026_unla.rentar.service.ReservaService;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

import java.util.List;
@Controller
public class ReservaGraphQLController {

    private final ReservaService reservaService;


    public ReservaGraphQLController(ReservaService reservaService) {
        this.reservaService = reservaService;

    }
    @QueryMapping
    public List<ReservaResponseDTO> reservas(@Argument ReservaFilterInput filtro) {

        List<ReservaResponseDTO> resultado = reservaService.buscarReservas(filtro);

        return resultado;
    }
}
