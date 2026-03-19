import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';

function SignUp() {
  const [formData, setFormData] = useState({
    username: '',
    age: '',
    gender: '',
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
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const hashedPassword = await hashPassword(formData.password);
      const response = await fetch('http://localhost:3000/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, password: hashedPassword }),
      });

      if (response.ok) {
        alert('Usuario registrado exitosamente');
        navigate('/login');
      } else {
        alert('Error al registrar usuario');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-base-200 p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-center justify-center text-primary text-2xl mb-4 font-bold">Registro de Usuario</h2>
          <form onSubmit={handleSubmit} className="form-control gap-4">
            <div className="form-control w-full">
              <label className="label"><span className="label-text font-semibold">Nombre de Usuario</span></label>
              <input type="text" name="username" value={formData.username} onChange={handleChange} className="input input-bordered w-full focus:input-primary" required />
            </div>
            <div className="form-control w-full">
              <label className="label"><span className="label-text font-semibold">Edad</span></label>
              <input type="number" name="age" value={formData.age} onChange={handleChange} className="input input-bordered w-full focus:input-primary" required min="1" max="120" />
            </div>
            <div className="form-control w-full">
              <label className="label"><span className="label-text font-semibold">Sexo</span></label>
              <select name="gender" value={formData.gender} onChange={handleChange} className="select select-bordered w-full focus:select-primary" required>
                <option value="" disabled>Seleccione una opción...</option>
                <option value="male">Masculino</option>
                <option value="female">Femenino</option>
                <option value="other">Otro</option>
              </select>
            </div>
            <div className="form-control w-full">
              <label className="label"><span className="label-text font-semibold">Contraseña</span></label>
              <input type="password" name="password" value={formData.password} onChange={handleChange} className="input input-bordered w-full focus:input-primary" required minLength="8" />
            </div>
            <div className="card-actions flex-col mt-6 gap-3">
              <button type="submit" className="btn btn-primary w-full shadow-md hover:shadow-lg transition-shadow">Registrar</button>
              <div className="divider text-sm text-base-content/50 my-1">O</div>
              <Link to="/login" className="btn btn-outline btn-secondary w-full">Ir al Login</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default SignUp;
