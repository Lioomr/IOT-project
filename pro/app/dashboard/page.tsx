// app/dashboard/page.tsx
import React from 'react';
import Dashboard from '../components/Dashboard/Dashboard'; // Adjust import path if needed

// This page component simply renders the Dashboard component.
// The Dashboard component itself handles its internal state (login, data fetching, etc.)
// and already includes "use client" directive.
export default function DashboardPage() {
  return (
    <div>
      {/* You could add a specific layout or wrapper around the dashboard here if needed */}
      <Dashboard />
    </div>
  );
}
