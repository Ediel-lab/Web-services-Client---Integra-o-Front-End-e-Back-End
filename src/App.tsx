import React, { useState, useEffect } from 'react';
import './App.css';

// --- Interfaces Atualizadas ---
interface User {
  id: number;
  // Adicionado username para corresponder à API e ao pedido
  username: string;
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

// Interface combinada com as novas propriedades
interface PostWithAuthorAndComments extends Post {
  // Renomeado de authorName para username
  username: string;
  comments?: Comment[];
  commentsLoading?: boolean;
  // Nova propriedade para controlar a visibilidade
  areCommentsVisible?: boolean; 
}

const App: React.FC = () => {
  const [posts, setPosts] = useState<PostWithAuthorAndComments[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 1500));
        const [postsResponse, usersResponse] = await Promise.all([
          fetch('https://jsonplaceholder.typicode.com/posts'),
          fetch('https://jsonplaceholder.typicode.com/users')
        ]);

        if (!postsResponse.ok || !usersResponse.ok) {
          throw new Error(`HTTP error!`);
        }

        const postsData: Post[] = await postsResponse.json();
        const usersData: User[] = await usersResponse.json();

        // Mapa agora armazena o username
        const usersMap = new Map(usersData.map(user => [user.id, user.username]));

        // Combina os dados usando a propriedade 'username'
        const combinedPosts = postsData.map(post => ({
          ...post,
          username: usersMap.get(post.userId) || 'Usuário Desconhecido'
        }));

        setPosts(combinedPosts);
      } catch (e) {
        if (e instanceof Error) {
            setError(e.message);
        } else {
            setError('Ocorreu um erro desconhecido');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  // --- LÓGICA DE TOGGLE ATUALIZADA ---
  const handleToggleComments = async (postId: number) => {
    const postIndex = posts.findIndex(p => p.id === postId);
    if (postIndex === -1) return;

    const currentPost = posts[postIndex];
    const updatedPosts = [...posts];

    // Caso 1: Comentários já foram carregados, apenas alterna a visibilidade
    if (currentPost.comments) {
      updatedPosts[postIndex] = { ...currentPost, areCommentsVisible: !currentPost.areCommentsVisible };
      setPosts(updatedPosts);
      return;
    }

    // Caso 2: Primeira vez clicando, busca os comentários
    try {
      updatedPosts[postIndex] = { ...currentPost, commentsLoading: true };
      setPosts(updatedPosts);

      const response = await fetch(`https://jsonplaceholder.typicode.com/comments?postId=${postId}`);
      if (!response.ok) throw new Error('Falha ao buscar comentários');
      
      const commentsData: Comment[] = await response.json();
      
      // Adiciona os comentários e define a visibilidade como true
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
        <div className="posts-list">
          {posts.map((post) => (
            <div key={post.id} className="post-card">
              <div className="card-content-wrapper">
                <div className="post-details">
                  <div className="post-header">
                    <h2 className="post-title">{post.title}</h2>
                    {/* Alterado para post.username */}
                    <p className="post-author">por: @{post.username}</p>
                  </div>
                  <p className="post-body">{post.body}</p>
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

                {/* Condição de renderização atualizada para usar a nova flag de visibilidade */}
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