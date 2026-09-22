import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { authApi } from '../services/api';
import { waitForFirebaseAuth } from '../services/firebaseAuth';
import DashboardLayout from '../layouts/DashboardLayout';

export default function ProtectedRoute() {
  const [state, setState] = useState({ loading: true, user: null });

  useEffect(() => {
    let mounted = true;

    waitForFirebaseAuth()
      .then(() => authApi.me())
      .then((response) => {
        if (mounted) setState({ loading: false, user: response.user });
      })
      .catch(() => {
        if (mounted) setState({ loading: false, user: null });
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (state.loading) {
    return (
      <div className="min-h-screen bg-[#080C14] flex items-center justify-center text-slate-500">
        Checking dashboard session…
      </div>
    );
  }

  if (!state.user) return <Navigate to="/login" replace />;

  return <DashboardLayout user={state.user} />;
}
