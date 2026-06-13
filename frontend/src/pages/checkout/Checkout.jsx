// frontend/src/pages/checkout/Checkout.jsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Checkout = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (user && user.role === 'CUSTOMER') {
      navigate('/my/checkout');
    } else if (!user) {
      navigate('/login?redirect=/checkout');
    } else {
      navigate('/unauthorized');
    }
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
};

export default Checkout;
