import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSocial } from '../../hooks/useSocial';
import ProfileCard from './ProfileCard';
import FriendshipPanel from './FriendshipPanel';
import PostCard from './PostCard';

function UserView({ currentUser }) {
  const { i18n } = useTranslation();
  const social = useSocial(currentUser);
  const [showEditor, setShowEditor] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [msg, setMsg] = useState(null);

  const handleFriendStatus = async (id, status) => {
    await fetch(`http://localhost:3000/api/friendships/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    social.fetchFriendData();
  };

  const handleAddFriend = async (username) => {
    const res = await fetch('http://localhost:3000/api/friendships/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requester_id: currentUser.id, addressee_username: username })
    });
    const data = await res.json();
    setMsg({ type: res.ok ? 'success' : 'error', text: res.ok ? 'Solicitud enviada' : data.error });
    setTimeout(() => setMsg(null), 3000);
  };

  const handleSavePost = async () => {
    const res = await fetch('http://localhost:3000/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: currentUser.id, post: postContent })
    });
    if (res.ok) {
      setPostContent('');
      setShowEditor(false);
      social.fetchFeed();
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="space-y-6">
        <ProfileCard currentUser={currentUser} onPostCreate={() => setShowEditor(true)} />
        <FriendshipPanel 
          currentUser={currentUser} 
          friendRequests={social.friendRequests} 
          friendsList={social.friendsList} 
          onlineUsers={social.onlineUsers} 
          onStatusUpdate={handleFriendStatus} 
          onAddFriend={handleAddFriend} 
        />
        {msg && <div className={`alert ${msg.type === 'success' ? 'alert-success' : 'alert-error'} text-white text-xs p-2`}>{msg.text}</div>}
      </div>

      <div className="lg:col-span-2 space-y-6">
        {showEditor && (
          <div className="card bg-base-100 shadow-lg border-2 border-primary/20 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="card-body p-4">
              <textarea className="textarea textarea-bordered w-full text-lg h-32" placeholder="¿Qué quieres compartir?" value={postContent} onChange={(e) => setPostContent(e.target.value)} />
              <div className="card-actions justify-end mt-2">
                <button onClick={() => setShowEditor(false)} className="btn btn-ghost btn-sm">Cancelar</button>
                <button onClick={handleSavePost} className="btn btn-primary btn-sm" disabled={!postContent.trim()}>Publicar</button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {social.posts.map(post => (
            <PostCard 
              key={post.id} 
              post={post} 
              currentUser={currentUser} 
              onlineUsers={social.onlineUsers} 
              onLike={social.handleLike} 
              onComment={social.handleComment} 
              onDelete={social.handleDeletePost} 
              language={i18n.language} 
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default UserView;
