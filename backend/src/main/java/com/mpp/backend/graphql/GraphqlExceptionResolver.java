package com.mpp.backend.graphql;

import com.mpp.backend.error.ResourceNotFoundException;
import graphql.GraphQLError;
import graphql.GraphqlErrorBuilder;
import graphql.schema.DataFetchingEnvironment;
import jakarta.validation.ConstraintViolationException;
import org.springframework.graphql.execution.DataFetcherExceptionResolverAdapter;
import org.springframework.graphql.execution.ErrorType;
import org.springframework.stereotype.Component;
import org.springframework.validation.BindException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;

import java.util.List;

@Component
public class GraphqlExceptionResolver extends DataFetcherExceptionResolverAdapter {

    @Override
    protected GraphQLError resolveToSingleError(Throwable ex, DataFetchingEnvironment env) {
        if (ex instanceof ResourceNotFoundException) {
            return error(env, ErrorType.NOT_FOUND, ex.getMessage());
        }

        if (ex instanceof IllegalArgumentException) {
            return error(env, ErrorType.BAD_REQUEST, ex.getMessage());
        }

        if (ex instanceof ConstraintViolationException constraintViolationException) {
            String details = constraintViolationException.getConstraintViolations().stream()
                    .map(violation -> violation.getPropertyPath() + ": " + violation.getMessage())
                    .reduce((left, right) -> left + " | " + right)
                    .orElse("Validation failed.");

            return error(env, ErrorType.BAD_REQUEST, details);
        }

        if (ex instanceof BindException bindException) {
            return error(env, ErrorType.BAD_REQUEST, joinBindingErrors(bindException.getFieldErrors()));
        }

        if (ex instanceof MethodArgumentNotValidException methodArgumentNotValidException) {
            return error(
                    env,
                    ErrorType.BAD_REQUEST,
                    joinBindingErrors(methodArgumentNotValidException.getBindingResult().getFieldErrors())
            );
        }

        return error(env, ErrorType.INTERNAL_ERROR, "Unexpected server error.");
    }

    private GraphQLError error(DataFetchingEnvironment env, ErrorType type, String message) {
        return GraphqlErrorBuilder.newError(env)
                .errorType(type)
                .message(message)
                .build();
    }

    private String joinBindingErrors(List<FieldError> fieldErrors) {
        if (fieldErrors.isEmpty()) {
            return "Validation failed.";
        }

        return fieldErrors.stream()
                .map(fieldError -> fieldError.getField() + ": " + fieldError.getDefaultMessage())
                .reduce((left, right) -> left + " | " + right)
                .orElse("Validation failed.");
    }
}
