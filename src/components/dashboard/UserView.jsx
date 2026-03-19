import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

function UserView({ currentUser }) {
  const { t, i18n } = useTranslation();
  const [showEditor, setShowEditor] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [posts, setPosts] = useState([]);
  const [profileImage, setProfileImage] = useState(
    currentUser.profile_image_path 
    ? `http://localhost:3000/${currentUser.profile_image_path}` 
    : null
  );
  const fileInputRef = useRef(null);

  const fetchFeed = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/posts');
      if (!response.ok) throw new Error('Error al cargar el feed');
      const data = await response.json();
      setPosts(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, []);

  const handleSavePost = async () => {
    if (!postContent.trim()) return;
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: currentUser.id, post: postContent })
      });
      if (!response.ok) throw new Error('Error al guardar la publicación');
      setMessage({ type: 'success', text: '¡Publicación compartida con éxito! 🚀' });
      setPostContent('');
      setShowEditor(false);
      fetchFeed(); // Refresh feed
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3000/api/usuarios/${currentUser.id}/profile-image`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Error al subir la imagen');
      
      const data = await response.json();
      const newPath = `http://localhost:3000/${data.path}`;
      setProfileImage(newPath);
      
      const updatedUser = { ...currentUser, profile_image_path: data.path };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      setMessage({ type: 'success', text: 'Foto de perfil actualizada ✨' });
      fetchFeed(); // Refresh to show new avatar in user's posts
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  return (
    <div className="space-y-8">
      {/* Upper Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card bg-primary text-primary-content shadow-xl">
          <div className="card-body">
            <div className="flex items-center gap-4 mb-4">
              <div className="relative group">
                <div className="avatar">
                  <div className="w-20 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2 overflow-hidden bg-base-300">
                    {profileImage ? (
                      <img src={profileImage} alt="Profile" className="object-cover" />
                    ) : (
                      <div className="flex items-center justify-center h-full text-2xl font-bold text-base-content/30">
                        {currentUser.username?.[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>
                <button 
                  onClick={() => fileInputRef.current.click()}
                  className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer"
                >
                  <span className="text-xs font-bold text-white">Cambiar</span>
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageUpload} 
                  className="hidden" 
                  accept="image/png, image/jpeg, image/jpg"
                />
              </div>
              <div>
                <h2 className="card-title text-2xl font-bold">¡Bienvenido de nuevo!</h2>
                <span className="badge badge-secondary badge-sm">{currentUser.role}</span>
              </div>
            </div>

            <p className="opacity-80">Aquí puedes expresarte y ver tu actividad reciente.</p>
            
            <div className="mt-6 p-4 bg-primary-focus/30 rounded-xl border border-white/10">
              {!showEditor ? (
                <button onClick={() => setShowEditor(true)} className="btn btn-secondary w-full gap-2 shadow-lg">
                  <span className="text-xl">+</span> Nueva publicación
                </button>
              ) : (
                <div className="space-y-4 animate-in fade-in zoom-in duration-300">
                  <textarea 
                    className="textarea textarea-bordered w-full bg-base-100 text-base-content text-lg min-h-[120px]" 
                    placeholder="¿Qué tienes en mente? (puedes usar emojis 😊)"
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                  ></textarea>
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setShowEditor(false)} className="btn btn-ghost btn-sm" disabled={loading}>Cancelar</button>
                    <button onClick={handleSavePost} className={`btn btn-secondary btn-sm ${loading ? 'loading' : ''}`} disabled={loading || !postContent.trim()}>Guardar</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="card bg-base-100 shadow-xl border border-base-200">
          <div className="card-body">
            <h2 className="card-title flex justify-between">
              Resumen de Cuenta
              {message && (
                <span className={`text-xs px-2 py-1 rounded animate-pulse ${message.type === 'success' ? 'bg-success/20 text-success' : 'bg-error/20 text-error'}`}>
                  {message.text}
                </span>
              )}
            </h2>
            <div className="stats stats-vertical shadow mt-4">
              <div className="stat">
                <div className="stat-title text-base-content/60">Edad Registrada</div>
                <div className="stat-value text-2xl">{currentUser.age || 'N/A'} {t('common.years')}</div>
              </div>
              <div className="stat">
                <div className="stat-title text-base-content/60">Género</div>
                <div className="stat-value text-2xl uppercase">{currentUser.gender || 'N/A'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Social Feed */}
      <div className="space-y-6 max-w-2xl mx-auto pb-10">
        <h3 className="text-2xl font-bold border-b border-base-300 pb-4">Últimas publicaciones</h3>
        
        {posts.length === 0 ? (
          <div className="text-center py-10 opacity-50">No hay publicaciones todavía. ¡Sé el primero en escribir!</div>
        ) : (
          posts.map(post => (
            <div key={post.id} className="card bg-base-100 shadow-md border border-base-200">
              <div className="card-body p-5">
                {/* Header: Author Info */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="avatar">
                    <div className="w-10 rounded-full bg-base-300">
                      {post.profile_image_path ? (
                        <img src={`http://localhost:3000/${post.profile_image_path}`} alt={post.username} />
                      ) : (
                        <div className="flex items-center justify-center h-full font-bold text-base-content/40">
                          {post.username[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-sm">{post.username}</span>
                    <span className="text-[10px] opacity-50">
                      {new Date(post.posted_date).toLocaleString(i18n.language)}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <p className="text-base text-base-content mb-4 whitespace-pre-wrap">
                  {post.content}
                </p>

                {/* Actions Bar */}
                <div className="flex items-center gap-4 border-t border-base-200 pt-3">
                  <div className="flex items-center gap-1 cursor-pointer hover:text-primary transition-colors">
                    <span className="text-xl text-error">❤</span>
                    <span className="text-sm font-medium">{post.likes_count}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xl">💬</span>
                    <span className="text-sm font-medium">{post.comments.length}</span>
                  </div>
                </div>

                {/* Comments Section */}
                {post.comments.length > 0 && (
                  <div className="mt-4 space-y-3 bg-base-200/50 p-3 rounded-lg">
                    {post.comments.map(comment => (
                      <div key={comment.id} className="text-xs">
                        <span className="font-bold mr-2">{comment.commenter_name}:</span>
                        <span className="opacity-80">{comment.comment}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default UserView;
