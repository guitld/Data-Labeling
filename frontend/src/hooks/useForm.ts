import { useState, useCallback } from 'react';

interface FormState<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  isSubmitting: boolean;
  isValid: boolean;
}

interface UseFormOptions<T> {
  initialValues: T;
  validate?: (values: T) => Partial<Record<keyof T, string>>;
  onSubmit: (values: T) => Promise<void> | void;
}

export const useForm = <T extends Record<string, any>>({
  initialValues,
  validate,
  onSubmit
}: UseFormOptions<T>) => {
  const [state, setState] = useState<FormState<T>>({
    values: initialValues,
    errors: {},
    isSubmitting: false,
    isValid: true
  });

  const setValue = useCallback((field: keyof T, value: any) => {
    setState(prev => {
      const newValues = { ...prev.values, [field]: value };
      const errors = validate ? validate(newValues) : {};
      const isValid = Object.keys(errors).length === 0;
      
      return {
        ...prev,
        values: newValues,
        errors,
        isValid
      };
    });
  }, [validate]);

  const setError = useCallback((field: keyof T, error: string) => {
    setState(prev => ({
      ...prev,
      errors: { ...prev.errors, [field]: error }
    }));
  }, []);

  const clearErrors = useCallback(() => {
    setState(prev => ({
      ...prev,
      errors: {}
    }));
  }, []);

  const reset = useCallback(() => {
    setState({
      values: initialValues,
      errors: {},
      isSubmitting: false,
      isValid: true
    });
  }, [initialValues]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validate) {
      const errors = validate(state.values);
      if (Object.keys(errors).length > 0) {
        setState(prev => ({
          ...prev,
          errors
        }));
        return;
      }
    }

    setState(prev => ({ ...prev, isSubmitting: true }));
    
    try {
      await onSubmit(state.values);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setState(prev => ({ ...prev, isSubmitting: false }));
    }
  }, [state.values, validate, onSubmit]);

  return {
    values: state.values,
    errors: state.errors,
    isSubmitting: state.isSubmitting,
    isValid: state.isValid,
    setValue,
    setError,
    clearErrors,
    reset,
    handleSubmit
  };
};
