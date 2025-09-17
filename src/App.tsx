import React, { useState, useEffect } from 'react';
import './App.css';

// Novas interfaces para os dados que vamos buscar
interface User {
  id: number;
  name: string;
}

interface Comment {
  postId: number;
  id: number;
  name: string;
  email: string;
  body: string;
}

// Interface original do Post
interface Post {
  id: number;
  userId: number;
  title: string;
  body: string;
}

// Interface combinada para facilitar o uso no componente
// Agora cada post terá o nome do autor e, opcionalmente, seus comentários.
interface PostWithAuthorAndComments extends Post {
  username: string;
  comments?: Comment[]; // Comentários são opcionais
  commentsLoading?: boolean; // Para mostrar um feedback de carregamento
}

const App: React.FC = () => {
  // O estado agora armazena nossos objetos de post combinados
  const [posts, setPosts] = useState<PostWithAuthorAndComments[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // useEffect foi atualizado para buscar posts e usuários simultaneamente
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Simula um delay para vermos o estado de "Carregando..."
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Busca posts e usuários em paralelo para otimizar o tempo de carregamento
        const [postsResponse, usersResponse] = await Promise.all([
          fetch('https://jsonplaceholder.typicode.com/posts'),
          fetch('https://jsonplaceholder.typicode.com/users')
        ]);

        if (!postsResponse.ok || !usersResponse.ok) {
          throw new Error(`HTTP error!`);
        }

        const postsData: Post[] = await postsResponse.json();
        const usersData: User[] = await usersResponse.json();

        // Cria um mapa de usuários (id -> nome) para facilitar a busca do nome do autor
        const usersMap = new Map(usersData.map(user => [user.id, user.name]));

        // Combina os dados dos posts com os nomes dos autores
        const combinedPosts = postsData.map(post => ({
          ...post,
          username: usersMap.get(post.userId) || 'Autor Desconhecido'
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

  // Função para carregar ou esconder os comentários de um post
  const handleToggleComments = async (postId: number) => {
    const postIndex = posts.findIndex(p => p.id === postId);
    if (postIndex === -1) return;

    const currentPost = posts[postIndex];

    // Se os comentários já existem, vamos apenas escondê-los (removê-los do estado)
    if (currentPost.comments) {
      const updatedPosts = [...posts];
      delete updatedPosts[postIndex].comments;
      setPosts(updatedPosts);
      return;
    }
    
    // Se não existem, vamos buscá-los na API
    try {
      // Atualiza o estado para mostrar que os comentários estão carregando
      let updatedPosts = [...posts];
      updatedPosts[postIndex] = { ...currentPost, commentsLoading: true };
      setPosts(updatedPosts);

      const response = await fetch(`https://jsonplaceholder.typicode.com/comments?postId=${postId}`);
      if (!response.ok) {
        throw new Error('Falha ao buscar comentários');
      }
      const commentsData: Comment[] = await response.json();

      // Atualiza o estado com os comentários carregados
      updatedPosts = [...posts];
      updatedPosts[postIndex] = { ...currentPost, comments: commentsData, commentsLoading: false };
      setPosts(updatedPosts);

    } catch (err) {
      console.error(err);
      // Remove o status de carregamento em caso de erro
      const updatedPosts = [...posts];
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
        <div className="posts-grid">
          {posts.map((post) => (
            <div key={post.id} className="post-card">
              <div className="post-header">
                <h2 className="post-title">{post.title}</h2>
                <p className="post-author">por: {post.username}</p>
              </div>
              <p className="post-body">{post.body}</p>
              
              <div className="card-actions">
                 <button className="toggle-comments-btn" onClick={() => handleToggleComments(post.id)}>
                   {post.comments ? 'Ocultar Comentários' : 'Ver Comentários'}
                 </button>
              </div>

              {post.commentsLoading && <p className="comments-loading">Carregando comentários...</p>}

              {post.comments && (
                <div className="comments-section">
                  <h3 className="comments-title">Comentários</h3>
                  {post.comments.map(comment => (
                    <div key={comment.id} className="comment">
                      <p className="comment-body">{comment.body}</p>
                      <span className="comment-author">- {comment.email}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default App;