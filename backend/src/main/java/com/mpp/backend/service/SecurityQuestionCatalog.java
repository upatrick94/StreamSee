package com.mpp.backend.service;

import java.util.List;
import java.util.Set;

public final class SecurityQuestionCatalog {

    public static final List<String> QUESTIONS = List.of(
            "What was the name of your first school?",
            "What city were you born in?",
            "What is the title of your favorite movie?"
    );

    private static final Set<String> QUESTION_SET = Set.copyOf(QUESTIONS);

    private SecurityQuestionCatalog() {
    }

    public static boolean isAllowed(String value) {
        if (value == null) {
            return false;
        }

        return QUESTION_SET.contains(value.trim());
    }
}