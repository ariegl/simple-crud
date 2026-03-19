import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000');

function UserView({ currentUser }) {
  const { t, i18n } = useTranslation();
  const [showEditor, setShowEditor] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [commentInputs, setCommentInputs] = useState({});
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

    // Socket listeners
    socket.on('newPost', () => {
      fetchFeed();
    });

    socket.on('updateLikes', () => {
      fetchFeed();
    });

    socket.on('newComment', () => {
      fetchFeed();
    });

    return () => {
      socket.off('newPost');
      socket.off('updateLikes');
      socket.off('newComment');
    };
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
      fetchFeed();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleLike = async (postId) => {
    try {
      const response = await fetch(`http://localhost:3000/api/posts/${postId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: currentUser.id })
      });
      if (response.ok) fetchFeed();
    } catch (err) {
      console.error(err);
    }
  };

  const handleComment = async (postId) => {
    const comment = commentInputs[postId];
    if (!comment?.trim()) return;

    try {
      const response = await fetch(`http://localhost:3000/api/posts/${postId}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: currentUser.id, comment })
      });
      if (response.ok) {
        setCommentInputs(prev => ({ ...prev, [postId]: '' }));
        fetchFeed();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('¿Seguro que quieres eliminar esta publicación?')) return;

    try {
      const response = await fetch(`http://localhost:3000/api/posts/${postId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: currentUser.id })
      });
      if (response.ok) fetchFeed();
    } catch (err) {
      console.error(err);
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
      fetchFeed();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  return (
    <div className="space-y-8">
      {/* Upper Cards section (Avatar & New Post) */}
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
                <button onClick={() => fileInputRef.current.click()} className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer">
                  <span className="text-xs font-bold text-white">Cambiar</span>
                </button>
                <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/png, image/jpeg, image/jpg" />
              </div>
              <div>
                <h2 className="card-title text-2xl font-bold">¡Bienvenido!</h2>
                <span className="badge badge-secondary badge-sm uppercase">{currentUser.role}</span>
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-primary-focus/30 rounded-xl border border-white/10">
              {!showEditor ? (
                <button onClick={() => setShowEditor(true)} className="btn btn-secondary w-full gap-2 shadow-lg">
                  <span className="text-xl">+</span> Nueva publicación
                </button>
              ) : (
                <div className="space-y-4">
                  <textarea className="textarea textarea-bordered w-full bg-base-100 text-base-content text-lg min-h-[100px]" placeholder="¿Qué estás pensando?" value={postContent} onChange={(e) => setPostContent(e.target.value)} />
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setShowEditor(false)} className="btn btn-ghost btn-sm">Cancelar</button>
                    <button onClick={handleSavePost} className={`btn btn-secondary btn-sm ${loading ? 'loading' : ''}`} disabled={loading || !postContent.trim()}>Publicar</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-xl border border-base-200">
          <div className="card-body">
            <h2 className="card-title flex justify-between">
              Resumen
              {message && <span className="text-xs badge badge-ghost font-normal animate-pulse">{message.text}</span>}
            </h2>
            <div className="stats stats-vertical shadow mt-2">
              <div className="stat">
                <div className="stat-title opacity-60">Edad</div>
                <div className="stat-value text-2xl">{currentUser.age || 'N/A'} {t('common.years')}</div>
              </div>
              <div className="stat">
                <div className="stat-title opacity-60">Género</div>
                <div className="stat-value text-2xl uppercase text-primary">{currentUser.gender || 'N/A'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Social Feed */}
      <div className="space-y-6 max-w-2xl mx-auto pb-10">
        <h3 className="text-2xl font-bold border-b border-base-300 pb-2">Feed Social</h3>
        
        {posts.map(post => (
          <div key={post.id} className="card bg-base-100 shadow-sm border border-base-200">
            <div className="card-body p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="avatar">
                      <div className="w-10 rounded-full bg-base-300">
                        {post.profile_image_path ? (
                          <img src={`http://localhost:3000/${post.profile_image_path}`} alt={post.username} />
                        ) : (
                          <div className="flex items-center justify-center h-full font-bold text-base-content/40">{post.username[0].toUpperCase()}</div>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="font-bold text-sm leading-tight">{post.username}</div>
                      <div className="text-[10px] opacity-40">{new Date(post.posted_date).toLocaleString(i18n.language)}</div>
                    </div>
                  </div>
                  {post.user_id === currentUser.id && (
                    <button 
                      onClick={() => handleDeletePost(post.id)}
                      className="btn btn-ghost btn-xs text-error opacity-30 hover:opacity-100"
                    >
                      Eliminar
                    </button>
                  )}
                </div>

              <p className="text-base mb-4 whitespace-pre-wrap">{post.content}</p>

              <div className="flex items-center gap-6 border-t border-base-200 pt-3">
                <button onClick={() => handleLike(post.id)} className="flex items-center gap-1.5 group">
                  <span className="text-xl group-hover:scale-125 transition-transform">❤</span>
                  <span className="text-sm font-semibold">{post.likes_count}</span>
                </button>
                <div className="flex items-center gap-1.5">
                  <span className="text-xl">💬</span>
                  <span className="text-sm font-semibold">{post.comments.length}</span>
                </div>
              </div>

              {/* Comments Display */}
              {post.comments.length > 0 && (
                <div className="mt-4 space-y-2 bg-base-200/40 p-3 rounded-lg border border-base-200">
                  {post.comments.map(c => (
                    <div key={c.id} className="text-xs leading-relaxed">
                      <span className="font-bold text-primary mr-1.5">{c.commenter_name}:</span>
                      <span className="opacity-80">{c.comment}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* New Comment Input */}
              <div className="mt-4 flex gap-2">
                <input 
                  type="text" 
                  className="input input-bordered input-sm flex-1 bg-base-50" 
                  placeholder="Escribe un comentario..."
                  value={commentInputs[post.id] || ''}
                  onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                  onKeyPress={(e) => e.key === 'Enter' && handleComment(post.id)}
                />
                <button onClick={() => handleComment(post.id)} className="btn btn-primary btn-sm px-4">Enviar</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default UserView;
