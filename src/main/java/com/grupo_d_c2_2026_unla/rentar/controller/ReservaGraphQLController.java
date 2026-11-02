package com.grupo_d_c2_2026_unla.rentar.controller;

import com.grupo_d_c2_2026_unla.rentar.dto.ReservaFilterInput;
import com.grupo_d_c2_2026_unla.rentar.dto.ReservaResponseDTO;
import com.grupo_d_c2_2026_unla.rentar.exception.BusinessException;
import com.grupo_d_c2_2026_unla.rentar.service.ReservaService;

import graphql.GraphQLError;
import graphql.GraphqlErrorBuilder;
import graphql.schema.DataFetchingEnvironment;

import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.GraphQlExceptionHandler;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.graphql.execution.ErrorType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Controller;

import java.util.List;
@Controller
public class ReservaGraphQLController {

    private final ReservaService reservaService;


    public ReservaGraphQLController(ReservaService reservaService) {
        this.reservaService = reservaService;

    }

    @GraphQlExceptionHandler(BusinessException.class)
    public GraphQLError errorConsulta(BusinessException ex, DataFetchingEnvironment environment) {
        return GraphqlErrorBuilder.newError(environment)
                .errorType(ErrorType.BAD_REQUEST)
                .message(ex.getMessage())
                .build();
    }

    @GraphQlExceptionHandler(AccessDeniedException.class)
    public GraphQLError accesoDenegado(AccessDeniedException ex, DataFetchingEnvironment environment) {
        return GraphqlErrorBuilder.newError(environment)
                                  .errorType(ErrorType.FORBIDDEN)
                                  .message(ex.getMessage())
                                  .build();
    }
    
    @QueryMapping
    public List<ReservaResponseDTO> reservas(@Argument ReservaFilterInput filtro) {

        List<ReservaResponseDTO> resultado = reservaService.buscarReservas(filtro);

        return resultado;
    }
}
