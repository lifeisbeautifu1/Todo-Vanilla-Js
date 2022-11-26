const API = axios.create({
  baseURL: 'https://jsonplaceholder.typicode.com/posts',
});

const createPost = async (postData) => {
  const { data } = await API.post('/', postData);
  return data;
};

const deletePost = async (id) => {
  const { data } = await API.delete('/' + id);
  return data;
};

const editPost = async (postData) => {
  const { data } = await API.patch('/' + postData.id, postData);
  return data;
};

const getPosts = async () => {
  const { data } = await API.get('/');
  return data;
};

const postsService = {
  getPosts,
  deletePost,
  createPost,
  editPost,
};

export default postsService;
