import React, { useState, useEffect } from 'react';
import './App.css';

// --- Interfaces (sem alteração) ---
interface User {
  id: number;
  username:string;
}
interface Comment {
  postId: number;
  id: number;
  name: string;
  email: string;
  body: string;
}
interface Post {
  id: number;
  userId: number;
  title: string;
  body: string;
}
interface PostWithAuthorAndComments extends Post {
  username: string;
  comments?: Comment[];
  commentsLoading?: boolean;
  areCommentsVisible?: boolean; 
}

const App: React.FC = () => {
  const [posts, setPosts] = useState<PostWithAuthorAndComments[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // ESTADO ATUALIZADO para um objeto com title e body
  const [newPost, setNewPost] = useState({ title: '', body: '' });

  // NOVA FUNÇÃO para lidar com a mudança em ambos os campos (título e corpo)
  const handleNewPostChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewPost(prevPost => ({
      ...prevPost,
      [name]: value
    }));
  };

  // --- Lógica de busca e toggle (sem alteração) ---
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 1500));
        const [postsResponse, usersResponse] = await Promise.all([
          fetch('https://jsonplaceholder.typicode.com/posts'),
          fetch('https://jsonplaceholder.typicode.com/users')
        ]);
        if (!postsResponse.ok || !usersResponse.ok) throw new Error(`HTTP error!`);
        const postsData: Post[] = await postsResponse.json();
        const usersData: User[] = await usersResponse.json();
        const usersMap = new Map(usersData.map(user => [user.id, user.username]));
        const combinedPosts = postsData.map(post => ({
          ...post,
          username: usersMap.get(post.userId) || 'Usuário Desconhecido'
        }));
        setPosts(combinedPosts);
      } catch (e) {
        if (e instanceof Error) setError(e.message);
        else setError('Ocorreu um erro desconhecido');
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  const handleToggleComments = async (postId: number) => {
    const postIndex = posts.findIndex(p => p.id === postId);
    if (postIndex === -1) return;
    const currentPost = posts[postIndex];
    const updatedPosts = [...posts];
    if (currentPost.comments) {
      updatedPosts[postIndex] = { ...currentPost, areCommentsVisible: !currentPost.areCommentsVisible };
      setPosts(updatedPosts);
      return;
    }
    try {
      updatedPosts[postIndex] = { ...currentPost, commentsLoading: true };
      setPosts(updatedPosts);
      const response = await fetch(`https://jsonplaceholder.typicode.com/comments?postId=${postId}`);
      if (!response.ok) throw new Error('Falha ao buscar comentários');
      const commentsData: Comment[] = await response.json();
      updatedPosts[postIndex] = { ...currentPost, comments: commentsData, commentsLoading: false, areCommentsVisible: true };
      setPosts(updatedPosts);
    } catch (err) {
      console.error(err);
      updatedPosts[postIndex] = { ...currentPost, commentsLoading: false };
      setPosts(updatedPosts);
    }
  };


  if (loading) {
    return <div className="loading-screen"><p className="loading-text">Carregando posts...</p></div>;
  }

  if (error) {
    return <div className="error-screen"><p className="error-text">Erro ao buscar dados: {error}</p></div>;
  }

  return (
    <div className="app">
      <div className="container">
        <h1 className="main-title">Blog Posts - JSONPlaceholder</h1>

        {/* ESTRUTURA ATUALIZADA com campos para título e corpo */}
        <div className="idea-box-container">
          <input
            type="text"
            name="title" // Atributo 'name' para identificar o campo
            className="idea-box-input"
            placeholder="Título do novo post"
            value={newPost.title}
            onChange={handleNewPostChange}
          />
          <textarea 
            name="body" // Atributo 'name' para identificar o campo
            className="idea-box-textarea" 
            placeholder="Escreva sua ideia aqui..."
            rows={5}
            value={newPost.body}
            onChange={handleNewPostChange}
          ></textarea>
          <button className="idea-box-button">
            Publicar Ideia
          </button>
        </div>

        <div className="posts-list">
          {posts.map((post) => (
            <div key={post.id} className="post-card">
              <div className="card-content-wrapper">
                <div className="post-details">
                  <div className="post-header">
                    <h2 className="post-title">{post.title}</h2>
                    <p className="post-author">por: @{post.username}</p>
                  </div>
                  <p className="post-body">{post.body}</p>
                  
                  {post.areCommentsVisible && (
                    <div className="new-comment-area">
                      <input 
                        type="text" 
                        className="new-comment-input" 
                        placeholder="Adicione um comentário..."
                      />
                      <button className="new-comment-button">Enviar</button>
                    </div>
                  )}

                  <div className="card-actions">
                     <button 
                       className="toggle-comments-btn" 
                       onClick={() => handleToggleComments(post.id)}
                       disabled={post.commentsLoading}
                     >
                       {post.commentsLoading ? 'Carregando...' : (post.areCommentsVisible ? 'Ocultar Comentários' : 'Ver Comentários')}
                     </button>
                  </div>
                </div>

                {(post.commentsLoading || (post.comments && post.areCommentsVisible)) && (
                   <div className="comments-section">
                    <h3 className="comments-title">Comentários</h3>
                    {post.commentsLoading && !post.comments && (
                        <p className="comments-loading">Carregando...</p>
                    )}
                    {post.comments && post.comments.map(comment => (
                      <div key={comment.id} className="comment">
                        <p className="comment-body">{comment.body}</p>
                        <span className="comment-author">- {comment.email}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default App;