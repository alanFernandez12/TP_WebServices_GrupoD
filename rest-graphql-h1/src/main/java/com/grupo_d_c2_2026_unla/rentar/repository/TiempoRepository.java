package com.grupo_d_c2_2026_unla.rentar.repository;

import com.grupo_d_c2_2026_unla.rentar.entity.Tiempo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Optional;

public interface TiempoRepository extends JpaRepository<Tiempo, Long> {

    Optional<Tiempo> findByFechaCalendario(LocalDate fechaCalendario);
}