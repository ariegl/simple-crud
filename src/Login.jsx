import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';

function Login() {
  const [formData, setFormData] = useState({
    nombreCompleto: '',
    password: ''
  });
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const hashPassword = async (password) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-512', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const hashedPassword = await hashPassword(formData.password);
      
      const response = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombreCompleto: formData.nombreCompleto,
          password: hashedPassword
        }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate('/home');
      } else {
        alert(data.error || 'Error al iniciar sesión');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error de conexión');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-base-200 p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-center justify-center text-primary text-2xl mb-4 font-bold">Iniciar Sesión</h2>
          <form onSubmit={handleSubmit} className="form-control gap-4">
            
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-semibold">Nombre Completo</span>
              </label>
              <input
                type="text"
                placeholder="Ingresa tu nombre"
                className="input input-bordered w-full focus:input-primary"
                id="nombreCompleto"
                name="nombreCompleto"
                value={formData.nombreCompleto}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-semibold">Contraseña</span>
              </label>
              <input
                type="password"
                placeholder="********"
                className="input input-bordered w-full focus:input-primary"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <div className="card-actions flex-col mt-6 gap-3">
              <button type="submit" className="btn btn-primary w-full shadow-md hover:shadow-lg transition-shadow">
                Entrar
              </button>
              
              <div className="divider text-sm text-base-content/50 my-1">¿No tienes cuenta?</div>

              <Link to="/signup" className="btn btn-outline btn-secondary w-full">
                Registrarse
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
