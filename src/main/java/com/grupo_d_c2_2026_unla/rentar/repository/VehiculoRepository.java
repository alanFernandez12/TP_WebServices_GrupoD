package com.grupo_d_c2_2026_unla.rentar.repository;

import com.grupo_d_c2_2026_unla.rentar.entity.Vehiculo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.CrudRepository;

public interface VehiculoRepository extends JpaRepository<Vehiculo, Integer> {

   public Vehiculo findByPatente(String patente);
   public boolean existsByPatente(String patente);
}
