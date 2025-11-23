/**
 * Extracts a user-friendly error message from various error types
 * @param err - The error object (can be unknown type)
 * @param fallbackMessage - The default message if no specific error message is found
 * @returns A string error message
 */
export function getErrorMessage(err: unknown, fallbackMessage = 'An error occurred'): string {
  // Check if it's an Axios error with response data
  if (err && typeof err === 'object' && 'response' in err) {
    const axiosError = err as {
      response?: {
        data?: {
          error?: {
            message?: string;
          };
          message?: string;
        };
      };
    };

    // Try to get error message from nested error object
    const nestedMessage = axiosError.response?.data?.error?.message;
    if (nestedMessage) {
      return nestedMessage;
    }

    // Try to get error message from data.message
    const dataMessage = axiosError.response?.data?.message;
    if (dataMessage) {
      return dataMessage;
    }
  }

  // Check if it's a standard Error object
  if (err instanceof Error) {
    return err.message;
  }

  // Check if it's a string
  if (typeof err === 'string') {
    return err;
  }

  // Return fallback message
  return fallbackMessage;
}
