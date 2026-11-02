package com.grupo_d_c2_2026_unla.rentar.service;

import java.util.List;

import com.grupo_d_c2_2026_unla.rentar.dto.HistorialAlquilerDTO;
import com.grupo_d_c2_2026_unla.rentar.dto.ReservaFilterInput;
import com.grupo_d_c2_2026_unla.rentar.dto.ReservaRequestDTO;
import com.grupo_d_c2_2026_unla.rentar.dto.ReservaResponseDTO;

public interface ReservaService {

    ReservaResponseDTO crear(ReservaRequestDTO dto);
    ReservaResponseDTO cancelar(Long reservaId);
    List<HistorialAlquilerDTO> consultarHistorial(Long clienteId);
    List<ReservaResponseDTO> buscarReservas(ReservaFilterInput filtro);
}