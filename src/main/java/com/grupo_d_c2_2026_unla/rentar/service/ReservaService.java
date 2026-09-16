package com.grupo_d_c2_2026_unla.rentar.service;

import java.util.List;

import com.grupo_d_c2_2026_unla.rentar.dto.HistorialAlquilerDTO;
import com.grupo_d_c2_2026_unla.rentar.dto.ReservaRequestDTO;
import com.grupo_d_c2_2026_unla.rentar.dto.ReservaResponseDTO;

public interface ReservaService {

    ReservaResponseDTO crear(ReservaRequestDTO dto);
     List<HistorialAlquilerDTO> consultarHistorial(Long clienteId);
}