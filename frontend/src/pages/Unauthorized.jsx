import React from 'react';
import { Link } from 'react-router-dom';

const Unauthorized = () => (
  <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6 text-center">
    <h1 className="text-3xl font-bold mb-3">Access Denied</h1>
    <p className="text-gray-400 mb-8 max-w-md">
      Your account does not have permission to view this page.
    </p>
    <div className="flex gap-4">
      <Link to="/" className="px-5 py-2 rounded bg-blue-600 hover:bg-blue-500 transition">
        Go Home
      </Link>
      <Link to="/login" className="px-5 py-2 rounded border border-gray-600 hover:border-gray-400 transition">
        Switch Account
      </Link>
    </div>
  </div>
);

export default Unauthorized;
