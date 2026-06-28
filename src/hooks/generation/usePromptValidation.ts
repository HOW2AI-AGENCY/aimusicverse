import { useState, useCallback, useRef, useMemo } from "react";
import { validatePrompt, type PromptValidationResult, type PromptType } from "@/lib/prompt-validator";

const DEBOUNCE_MS = 300;

const EMPTY_RESULT: PromptValidationResult = {
  valid: true,
  errors: [],
  warnings: [],
  sanitizedPrompt: "",
};

interface UsePromptValidationOptions {
  type?: PromptType;
  debounceMs?: number;
}

export function usePromptValidation(options?: UsePromptValidationOptions) {
  const { type = "prompt", debounceMs = DEBOUNCE_MS } = options ?? {};
  const [result, setResult] = useState<PromptValidationResult>(EMPTY_RESULT);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const validate = useCallback(
    (text: string): PromptValidationResult => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      const validationResult = validatePrompt(text, { type });
      setResult(validationResult);
      return validationResult;
    },
    [type],
  );

  const validateDebounced = useCallback(
    (text: string) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(() => {
        const validationResult = validatePrompt(text, { type });
        setResult(validationResult);
        timerRef.current = null;
      }, debounceMs);
    },
    [type, debounceMs],
  );

  const reset = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setResult(EMPTY_RESULT);
  }, []);

  const isValid = result.valid;
  const errors = result.errors;
  const warnings = result.warnings;

  return useMemo(
    () => ({
      validate,
      validateDebounced,
      reset,
      result,
      isValid,
      errors,
      warnings,
    }),
    [validate, validateDebounced, reset, result, isValid, errors, warnings],
  );
}
