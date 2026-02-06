import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, clearError } from '../slices/authSlice';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  
  const dispatch = useDispatch();
  const { loading, error, token, user } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  useEffect(() => {
    if (token && user) {
      if (user.role === 'customer') {
        navigate('/customer/dashboard');
      } else if (user.role === 'seller') {
        navigate('/seller/dashboard');
      } else if (user.role === 'admin') {
        navigate('/admin/dashboard');
      }
    }
  }, [token, user, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(loginUser({ email, password }));
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white p-8 rounded-lg shadow">
          <h2 className="text-2xl font-bold text-center mb-6">Login</h2>
          
          {error && (
            <div className="bg-red-100 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border rounded"
                placeholder="Enter email"
                required
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-700 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded"
                placeholder="Enter password"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 text-white py-2 rounded hover:bg-black disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
          
          <p className="text-center mt-4">
            Don't have an account?{' '}
            <Link to="/register" className="text-gray-900 hover:text-black">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;