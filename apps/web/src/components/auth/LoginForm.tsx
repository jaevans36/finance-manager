import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';
import styled from 'styled-components';

const Heading = styled.h2`
  color: #222;
  margin-bottom: 20px;
`;

const Label = styled.label`
  color: #333;
  display: block;
  margin-bottom: 5px;
`;

export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Invalid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.login(email, password);
      login(response.accessToken, response.refreshToken, response.user);
      navigate('/dashboard');
    } catch (error: unknown) {
      if (error instanceof Error) {
        setApiError(error.message || 'Login failed. Please check your credentials.');
      } else {
        setApiError('Login failed. Please check your credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '20px' }}>
      <Heading>Sign In</Heading>
      
      {apiError && (
        <div style={{ 
          padding: '10px', 
          marginBottom: '15px', 
          backgroundColor: '#fee', 
          color: '#c00',
          borderRadius: '4px'
        }}>
          {apiError}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <Label htmlFor="email">
            Email
          </Label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setErrors({ ...errors, email: '' });
            }}
            autoComplete="email"
            style={{
              width: '100%',
              padding: '8px',
              fontSize: '14px',
              border: errors.email ? '1px solid #c00' : '1px solid #ccc',
              borderRadius: '4px',
            }}
            disabled={isLoading}
          />
          {errors.email && (
            <span style={{ color: '#c00', fontSize: '12px' }}>{errors.email}</span>
          )}
        </div>

        <div style={{ marginBottom: '20px' }}>
          <Label htmlFor="password">
            Password
          </Label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setErrors({ ...errors, password: '' });
            }}
            autoComplete="current-password"
            style={{
              width: '100%',
              padding: '8px',
              fontSize: '14px',
              border: errors.password ? '1px solid #c00' : '1px solid #ccc',
              borderRadius: '4px',
            }}
            disabled={isLoading}
          />
          {errors.password && (
            <span style={{ color: '#c00', fontSize: '12px' }}>{errors.password}</span>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: isLoading ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
          }}
        >
          {isLoading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <div style={{ marginTop: '15px', textAlign: 'center' }}>
        <Link to="/forgot-password" style={{ fontSize: '14px', color: '#007bff' }}>
          Forgot your password?
        </Link>
      </div>

      <p style={{ marginTop: '20px', textAlign: 'center' }}>
        Don&apos;t have an account? <Link to="/register">Create one</Link>
      </p>
    </div>
  );
};
