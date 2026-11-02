package com.grupo_d_c2_2026_unla.rentar.repository;

import com.grupo_d_c2_2026_unla.rentar.entity.Vehiculo;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.CrudRepository;
import com.grupo_d_c2_2026_unla.rentar.enums.EstadoReserva;
import com.grupo_d_c2_2026_unla.rentar.enums.TipoVehiculo;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;


public interface VehiculoRepository extends JpaRepository<Vehiculo, Integer> {

   public Vehiculo findByPatente(String patente);
   public boolean existsByPatente(String patente);

   @Query("""
           SELECT v
           FROM Vehiculo v
           WHERE v.activo = true
             AND (:tipo IS NULL OR v.tipoVehiculo = :tipo)
             AND (:marca IS NULL OR LOWER(v.marca) LIKE LOWER(CONCAT('%', :marca, '%')))
             AND (:modelo IS NULL OR LOWER(v.modelo) LIKE LOWER(CONCAT('%', :modelo, '%')))
             AND (:precioMinimo IS NULL OR v.precio_diario >= :precioMinimo)
             AND (:precioMaximo IS NULL OR v.precio_diario <= :precioMaximo)
             AND NOT EXISTS (
                 SELECT r.id
                 FROM Reserva r
                 WHERE r.vehiculo = v
                   AND r.estadoReserva <> :estadoCancelada
                   AND r.horaInicio < :fechaFin
                   AND r.horaFin > :fechaInicio
             )
           ORDER BY v.marca, v.modelo, v.patente
           """)
   List<Vehiculo> buscarDisponibles(
           @Param("tipo") TipoVehiculo tipo,
           @Param("marca") String marca,
           @Param("modelo") String modelo,
           @Param("precioMinimo") BigDecimal precioMinimo,
           @Param("precioMaximo") BigDecimal precioMaximo,
           @Param("fechaInicio") LocalDateTime fechaInicio,
           @Param("fechaFin") LocalDateTime fechaFin,
           @Param("estadoCancelada") EstadoReserva estadoCancelada
   );
}
