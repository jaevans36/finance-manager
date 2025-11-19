/**
 * Password Strength Validation Utility
 * Provides real-time password strength feedback and validation
 */

export interface PasswordRequirements {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  checkCommonPasswords: boolean;
}

export interface PasswordStrength {
  score: number; // 0-4 (very weak to very strong)
  label: 'very weak' | 'weak' | 'fair' | 'strong' | 'very strong';
  feedback: string[];
  isValid: boolean;
  requirements: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecialChar: boolean;
    notCommon: boolean;
  };
}

// List of commonly breached passwords (subset for demonstration)
// In production, use a more comprehensive list or API like Have I Been Pwned
const COMMON_PASSWORDS = new Set([
  'password',
  '123456',
  '123456789',
  'qwerty',
  'abc123',
  'password1',
  'password123',
  '12345678',
  '111111',
  '123123',
  'admin',
  'letmein',
  'welcome',
  'monkey',
  '1234567890',
  '1234567',
  'sunshine',
  'master',
  'dragon',
  'baseball',
  'iloveyou',
  'trustno1',
  'princess',
  'football',
]);

const DEFAULT_REQUIREMENTS: PasswordRequirements = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  checkCommonPasswords: true,
};

/**
 * Validate password against requirements and return strength analysis
 */
export function validatePasswordStrength(
  password: string,
  requirements: Partial<PasswordRequirements> = {}
): PasswordStrength {
  const reqs = { ...DEFAULT_REQUIREMENTS, ...requirements };
  const feedback: string[] = [];

  // Check individual requirements
  const hasMinLength = password.length >= reqs.minLength;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
  const notCommon = !COMMON_PASSWORDS.has(password.toLowerCase());

  // Build feedback messages
  if (!hasMinLength) {
    feedback.push(`Password must be at least ${reqs.minLength} characters long`);
  }

  if (reqs.requireUppercase && !hasUppercase) {
    feedback.push('Include at least one uppercase letter');
  }

  if (reqs.requireLowercase && !hasLowercase) {
    feedback.push('Include at least one lowercase letter');
  }

  if (reqs.requireNumbers && !hasNumber) {
    feedback.push('Include at least one number');
  }

  if (reqs.requireSpecialChars && !hasSpecialChar) {
    feedback.push('Include at least one special character (!@#$%^&* etc.)');
  }

  if (reqs.checkCommonPasswords && !notCommon) {
    feedback.push('This password is too common. Please choose a more unique password');
  }

  // Calculate strength score (0-4)
  let score = 0;

  // Base score from length
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;

  // Character diversity
  if (hasUppercase && hasLowercase) score++;
  if (hasNumber) score++;
  if (hasSpecialChar) score++;

  // Penalize for common passwords
  if (!notCommon) score = Math.max(0, score - 2);

  // Penalize for short passwords
  if (password.length < 6) score = 0;

  // Cap at 4
  score = Math.min(4, score);

  // Determine label
  const labels: Array<PasswordStrength['label']> = ['very weak', 'weak', 'fair', 'strong', 'very strong'];
  const label = labels[score];

  // Check if password meets all requirements
  const isValid =
    hasMinLength &&
    (!reqs.requireUppercase || hasUppercase) &&
    (!reqs.requireLowercase || hasLowercase) &&
    (!reqs.requireNumbers || hasNumber) &&
    (!reqs.requireSpecialChars || hasSpecialChar) &&
    (!reqs.checkCommonPasswords || notCommon);

  return {
    score,
    label,
    feedback,
    isValid,
    requirements: {
      minLength: hasMinLength,
      hasUppercase,
      hasLowercase,
      hasNumber,
      hasSpecialChar,
      notCommon,
    },
  };
}

/**
 * Generate suggestions to improve password strength
 */
export function generatePasswordSuggestions(password: string): string[] {
  const strength = validatePasswordStrength(password);
  const suggestions: string[] = [];

  if (strength.score >= 4) {
    return ['Your password is very strong!'];
  }

  if (password.length < 12) {
    suggestions.push('Try making your password longer (12+ characters)');
  }

  if (!strength.requirements.hasSpecialChar) {
    suggestions.push('Add special characters to make it stronger');
  }

  if (!/\d{2,}/.test(password)) {
    suggestions.push('Include multiple numbers');
  }

  if (!/[A-Z]{2,}/.test(password)) {
    suggestions.push('Use more than one uppercase letter');
  }

  // Check for patterns
  if (/(.)\1{2,}/.test(password)) {
    suggestions.push('Avoid repeating the same character multiple times');
  }

  if (/012|123|234|345|456|567|678|789|890/.test(password)) {
    suggestions.push('Avoid sequential numbers');
  }

  if (/abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz/i.test(password)) {
    suggestions.push('Avoid sequential letters');
  }

  if (!strength.requirements.notCommon) {
    suggestions.push('Choose a more unique password that has never been breached');
  }

  return suggestions;
}

/**
 * Check if password has been breached (placeholder for external API integration)
 * In production, integrate with Have I Been Pwned API
 */
export async function checkPasswordBreach(password: string): Promise<boolean> {
  // TODO: Integrate with Have I Been Pwned API
  // For now, just check against local common passwords list
  return COMMON_PASSWORDS.has(password.toLowerCase());
}

/**
 * Estimate time to crack password (rough estimate for educational purposes)
 */
export function estimateCrackTime(password: string): string {
  const charsetSize = calculateCharsetSize(password);
  const combinations = Math.pow(charsetSize, password.length);
  
  // Assume 1 billion attempts per second (modern GPU)
  const secondsToCrack = combinations / 1e9;
  
  if (secondsToCrack < 1) return 'Instantly';
  if (secondsToCrack < 60) return 'Less than a minute';
  if (secondsToCrack < 3600) return `${Math.ceil(secondsToCrack / 60)} minutes`;
  if (secondsToCrack < 86400) return `${Math.ceil(secondsToCrack / 3600)} hours`;
  if (secondsToCrack < 31536000) return `${Math.ceil(secondsToCrack / 86400)} days`;
  if (secondsToCrack < 31536000 * 100) return `${Math.ceil(secondsToCrack / 31536000)} years`;
  return 'Centuries';
}

function calculateCharsetSize(password: string): number {
  let size = 0;
  if (/[a-z]/.test(password)) size += 26; // Lowercase letters
  if (/[A-Z]/.test(password)) size += 26; // Uppercase letters
  if (/\d/.test(password)) size += 10; // Numbers
  if (/[^a-zA-Z0-9]/.test(password)) size += 32; // Special characters (approximate)
  return size;
}

/**
 * Sanitize password error messages (never expose password in error messages)
 */
export function sanitizePasswordError(error: unknown): string {
  if (error instanceof Error) {
    // Remove any potential password values from error messages
    return error.message.replace(/password[=:]?\s*\S+/gi, 'password: [REDACTED]');
  }
  return 'Password validation error';
}
