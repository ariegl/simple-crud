import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';

function Home() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const modalRef = useRef(null);
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
    navigate('/login');
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/usuarios');
      if (!response.ok) throw new Error('Error fetching users');
      const data = await response.json();
      setUsers(data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const confirmDelete = (id) => {
    setDeleteId(id);
    if (modalRef.current) modalRef.current.showModal();
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/usuarios/${deleteId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Error deleting user');
      setUsers(users.filter(u => u.id !== deleteId));
      setToast({ type: 'success', message: 'Usuario eliminado correctamente' });
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    } finally {
      setDeleteId(null);
      if (modalRef.current) modalRef.current.close();
    }
  };

  const filteredUsers = users.filter(u => 
    (u.username || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="flex justify-center items-center h-screen bg-base-200"><span className="loading loading-dots loading-lg text-primary"></span></div>;

  return (
    <div className="min-h-screen bg-base-200 p-4 md:p-8 font-sans">
      <div className="container mx-auto max-w-6xl space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 border-b border-base-content/10 pb-6">
          <div>
            <h1 className="text-4xl font-extrabold text-base-content tracking-tight">Hola, {currentUser.username || 'Usuario'}</h1>
            <p className="text-base-content/60 mt-1">Dashboard de gestión de registros</p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button onClick={handleLogout} className="btn btn-ghost text-error">Cerrar Sesión</button>
            <Link to="/signup" className="btn btn-primary gap-2 shadow-lg shadow-primary/30 hover:scale-105 transition-transform">Nuevo Usuario</Link>
          </div>
        </div>

        <div className="card bg-base-100 shadow-xl overflow-hidden border border-base-200">
          <div className="p-4 border-b border-base-200 bg-base-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
            <h2 className="text-xl font-bold px-2">Listado de Registros</h2>
            <input type="text" placeholder="Buscar por nombre de usuario..." className="input input-bordered input-sm w-full max-w-xs" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>

          <div className="overflow-x-auto w-full">
            <table className="table table-zebra w-full">
              <thead className="bg-base-200/50 text-base-content/70 text-xs uppercase font-bold tracking-wider">
                <tr>
                  <th className="py-4 pl-6">ID</th>
                  <th className="py-4">Username</th>
                  <th className="py-4">Age</th>
                  <th className="py-4">Gender</th>
                  <th className="py-4">Registered Date</th>
                  <th className="py-4 pr-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover">
                    <th className="pl-6 font-mono opacity-50">#{u.id}</th>
                    <td className="font-semibold text-base">{u.username}</td>
                    <td>{u.age} years</td>
                    <td><span className="badge badge-sm font-medium py-3 px-3 badge-info bg-blue-100 text-blue-700 border-transparent">{u.gender}</span></td>
                    <td>{u.registered_date ? new Date(u.registered_date).toLocaleString() : 'N/A'}</td>
                    <td className="pr-6 text-center">
                      <button onClick={() => confirmDelete(u.id)} className="btn btn-ghost btn-sm text-error">Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <dialog ref={modalRef} className="modal modal-bottom sm:modal-middle">
        <div className="modal-box">
          <h3 className="font-bold text-lg text-error">¿Eliminar registro?</h3>
          <div className="modal-action">
            <button className="btn btn-ghost mr-2" onClick={() => setDeleteId(null)}>Cancelar</button>
            <button className="btn btn-error" onClick={handleDelete}>Sí, eliminar</button>
          </div>
        </div>
      </dialog>

      {toast && <div className="toast toast-end"><div className={`alert ${toast.type === 'success' ? 'alert-success' : 'alert-error'} text-white`}><span>{toast.message}</span></div></div>}
    </div>
  );
}

export default Home;
