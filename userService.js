const API = axios.create({
  baseURL: 'https://jsonplaceholder.typicode.com/users',
});

const getUsers = async () => {
  const { data } = await API.get('/');
  return data;
};

const getUser = async (id) => {
  const { data } = await API.get('/' + id);
  return data;
};

const userService = {
  getUsers,
  getUser,
};

export default userService;
