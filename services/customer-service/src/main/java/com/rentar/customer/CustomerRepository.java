package com.rentar.customer;

import customer.CustomerOuterClass.Customer;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Optional;

@Repository
public class CustomerRepository {

    // El email vive en lk_usuarios; ambas tablas son de este servicio.
    private static final String SELECT_CLIENTES = """
            SELECT c.id_cliente, c.nom_nombre, c.desc_apellido, u.desc_email
            FROM lk_clientes c
            JOIN lk_usuarios u ON u.id_usuario = c.id_usuario
            """;

    private final JdbcTemplate jdbc;

    public CustomerRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public List<Customer> buscarTodos() {
        return jdbc.query(SELECT_CLIENTES, this::mapearCliente);
    }

    public Optional<Customer> buscarPorId(long id) {
        return jdbc.query(SELECT_CLIENTES + " WHERE c.id_cliente = ?", this::mapearCliente, id)
                .stream().findFirst();
    }

    public boolean existe(long id) {
        Integer cantidad = jdbc.queryForObject("SELECT COUNT(*) FROM lk_clientes WHERE id_cliente = ?",
                Integer.class, id);
        return cantidad != null && cantidad > 0;
    }

    public Optional<Boolean> estaActivo(long id) {
        return jdbc.queryForList("SELECT flag_activo FROM lk_clientes WHERE id_cliente = ?", Boolean.class, id)
                .stream().findFirst();
    }

    private Customer mapearCliente(ResultSet rs, int fila) throws SQLException {
        return Customer.newBuilder()
                .setId(rs.getLong("id_cliente"))
                .setNombre(rs.getString("nom_nombre"))
                .setApellido(rs.getString("desc_apellido"))
                .setEmail(rs.getString("desc_email"))
                .build();
    }
}
