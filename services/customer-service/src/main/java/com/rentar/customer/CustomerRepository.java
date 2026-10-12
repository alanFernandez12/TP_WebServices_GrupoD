package com.rentar.customer;

import customer.CustomerOuterClass.Customer;
import customer.CustomerOuterClass.SaveCustomerRequest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Optional;

@Repository
public class CustomerRepository {

    // El email vive en lk_usuarios; ambas tablas son de este servicio.
    private static final String SELECT_CLIENTES = """
            SELECT c.id_cliente, c.nom_nombre, c.desc_apellido, u.desc_email,
                   c.cod_documento, c.desc_telefono, c.fecha_nacimiento, c.flag_activo
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

    // Devuelve [hash, rol, idCliente, nombre] del usuario activo con ese email.
    // idCliente y nombre son null si el usuario no es cliente (ADMIN).
    public Optional<String[]> buscarUsuarioActivo(String email) {
        return jdbc.query("""
                SELECT u.desc_password_hash, u.desc_rol, c.id_cliente, CONCAT(c.nom_nombre, ' ', c.desc_apellido) AS nombre
                FROM lk_usuarios u
                LEFT JOIN lk_clientes c ON c.id_usuario = u.id_usuario
                WHERE u.desc_email = ? AND u.flag_activo = true
                """,
                (rs, fila) -> new String[]{rs.getString("desc_password_hash"), rs.getString("desc_rol"),
                        rs.getString("id_cliente"), rs.getString("nombre")}, email)
                .stream().findFirst();
    }

    // idCliente = 0 al crear; al modificar excluye al propio cliente
    public boolean emailEnUso(String email, long idCliente) {
        Integer cantidad = jdbc.queryForObject("""
                SELECT COUNT(*) FROM lk_usuarios
                WHERE desc_email = ?
                  AND id_usuario NOT IN (SELECT id_usuario FROM lk_clientes WHERE id_cliente = ?)
                """, Integer.class, email, idCliente);
        return cantidad != null && cantidad > 0;
    }

    public boolean documentoEnUso(String documento, long idCliente) {
        Integer cantidad = jdbc.queryForObject("SELECT COUNT(*) FROM lk_clientes WHERE cod_documento = ? AND id_cliente <> ?",
                Integer.class, documento, idCliente);
        return cantidad != null && cantidad > 0;
    }

    // Crea el usuario y el cliente asociado. Devuelve el id del cliente.
    @Transactional
    public long crear(SaveCustomerRequest datos, String passwordHash) {
        jdbc.update("INSERT INTO lk_usuarios (desc_email, desc_password_hash, desc_rol, flag_activo) VALUES (?, ?, ?, true)",
                datos.getEmail(), passwordHash, datos.getRol());
        Long idUsuario = jdbc.queryForObject("SELECT id_usuario FROM lk_usuarios WHERE desc_email = ?",
                Long.class, datos.getEmail());

        jdbc.update("""
                INSERT INTO lk_clientes (id_usuario, cod_documento, nom_nombre, desc_apellido, desc_telefono, fecha_nacimiento, flag_activo)
                VALUES (?, ?, ?, ?, ?, ?, true)
                """, idUsuario, datos.getDocumento(), datos.getNombre(), datos.getApellido(),
                vacioANull(datos.getTelefono()), vacioANull(datos.getFechaNacimiento()));
        return jdbc.queryForObject("SELECT id_cliente FROM lk_clientes WHERE cod_documento = ?",
                Long.class, datos.getDocumento());
    }

    @Transactional
    public void modificar(SaveCustomerRequest datos) {
        jdbc.update("""
                UPDATE lk_clientes
                SET cod_documento = ?, nom_nombre = ?, desc_apellido = ?, desc_telefono = ?, fecha_nacimiento = ?
                WHERE id_cliente = ?
                """, datos.getDocumento(), datos.getNombre(), datos.getApellido(),
                vacioANull(datos.getTelefono()), vacioANull(datos.getFechaNacimiento()), datos.getId());
        jdbc.update("UPDATE lk_usuarios SET desc_email = ? WHERE id_usuario = (SELECT id_usuario FROM lk_clientes WHERE id_cliente = ?)",
                datos.getEmail(), datos.getId());
    }

    // Baja lógica (false) o reactivación (true) del cliente y de su usuario
    @Transactional
    public void cambiarActivo(long id, boolean activo) {
        jdbc.update("UPDATE lk_clientes SET flag_activo = ? WHERE id_cliente = ?", activo, id);
        jdbc.update("UPDATE lk_usuarios SET flag_activo = ? WHERE id_usuario = (SELECT id_usuario FROM lk_clientes WHERE id_cliente = ?)",
                activo, id);
    }

    // protobuf no tiene null: los campos opcionales llegan como ""
    private String vacioANull(String texto) {
        return texto.isEmpty() ? null : texto;
    }

    private Customer mapearCliente(ResultSet rs, int fila) throws SQLException {
        return Customer.newBuilder()
                .setId(rs.getLong("id_cliente"))
                .setNombre(rs.getString("nom_nombre"))
                .setApellido(rs.getString("desc_apellido"))
                .setEmail(rs.getString("desc_email"))
                .setDocumento(rs.getString("cod_documento"))
                // El teléfono es opcional y protobuf no acepta null
                .setTelefono(rs.getString("desc_telefono") == null ? "" : rs.getString("desc_telefono"))
                .setFechaNacimiento(rs.getString("fecha_nacimiento") == null ? "" : rs.getString("fecha_nacimiento"))
                .setActivo(rs.getBoolean("flag_activo"))
                .build();
    }
}
