import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL from '../../config/apiConfig';

const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState('Verifying...');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setError('Invalid verification link.');
      setMessage('');
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/auth/verify?token=${token}`);
        setMessage(response.data.message || 'Email verified successfully!');

        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Verification failed.');
        setMessage('');
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  return (
    <div style={{ maxWidth: '400px', margin: '2rem auto', textAlign: 'center' }}>
      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default VerifyEmail;
