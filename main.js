import postsService from './postService.js';
import userService from './userService.js';

// App state

let allPosts = [];
let starredPosts = [];
let page = 1;
let pages = 5;
const pageSize = 20;
let posts = [];
let users = [];
let isEdit = false;
let selectedId = null;
let selectedPost = null;
let i = 0;

// Loading

const loader = document.querySelector('.loader');

const loading = new CustomEvent('loading');

const stopLoading = new CustomEvent('stopLoading');

document.addEventListener('loading', () => {
  loader.classList.remove('hidden');
});

document.addEventListener('stopLoading', () => {
  loader.classList.add('hidden');
});

// Render UI

const firstCol = document.querySelector('.first-col');
const secondCol = document.querySelector('.second-col');
const thirdCol = document.querySelector('.third-col');

const dropdownList = document.querySelector('.dropdown__list');

const renderUsers = () => {
  users.forEach((user) => {
    dropdownList.innerHTML += `
    <div class="dropdown__list-item">
    ${user.name}
    </div>`;
  });
  const dropdownItems = document.querySelectorAll('.dropdown__list-item');

  dropdownItems.forEach((item) =>
    item.addEventListener('click', (e) => {
      userField.value = e.target.textContent.trim();
      select.classList.remove('form__control--invalid');
    })
  );
};

const fetchAllDataAndRender = async () => {
  try {
    // Start Loading
    document.dispatchEvent(loading);
    // Get posts
    allPosts = await postsService.getPosts();
    // Set pages
    pages = Math.round(allPosts.length / pageSize);

    // Shuffle
    // allPosts = allPosts.sort(() => Math.random() - 0.5);

    // Get all users
    users = await userService.getUsers();

    // Render users in select
    renderUsers();

    // Append user data to each post respectively
    allPosts = allPosts.map((post) => {
      return {
        ...post,
        user: users.find((u) => u.id === post.userId),
      };
    });

    // Get all starred posts & render them
    if (localStorage.getItem('starredPosts')) {
      starredPosts = JSON.parse(localStorage.getItem('starredPosts'));
    }

    allPosts = allPosts.filter(
      (post) => !starredPosts.map((p) => p.id).includes(post.id)
    );

    // Paginate posts
    posts = allPosts.slice(
      (page - 1) * pageSize,
      pageSize + (page - 1) * pageSize
    );

    // Render posts
    renderPosts([...starredPosts, ...posts], false);
  } catch (error) {
    console.log(error);
  } finally {
    // Stop loading
    document.dispatchEvent(stopLoading);
  }
};

const renderNewPost = (p, before) => {
  const post = document.createElement('li');
  post.setAttribute('data-id', p.id);
  post.classList.add('post');
  post.classList.add('group');
  post.innerHTML = `<figure class="post__figure">
                <blockquote class="post__blockquote">
                  <h2 class="post__title">
                    ${p.title}
                  </h2>
                  <p class="post__body">
                    ${p.body}
                  </p>
                </blockquote>
                <figcaption class="post__fig-caption">
                  <div class="post__avatar">${p.user?.name[0]}</div>
                  <div class="post__content">
                    <div class="post__author">${p.user?.name}</div>
                    <div class="post__company">
                      ${p.user?.company?.name}
                    </div>
                  </div>
                </figcaption>
              </figure>
              <div class="post__controls group-hover:visible group-hover:opacity-100 group-hover:translate-y-0">
                <button  class="post__button post__button--edit">
                  <i class="fa-solid fa-pen"></i>
                </button>
                <button tabindex="0" class="post__button post__button--delete">
                  <i class="fa-solid fa-trash"></i>
                </button>
                <button tabindex="0" class="post__button post__button--star">
                 <i class="fa-regular ${
                   starredPosts.find((post) => p.id === post.id) && 'fa-solid'
                 } fa-star"></i>
                </button>
              </div>`;
  if (i % 3 == 0) {
    if (before) firstCol.insertBefore(post, firstCol.firstChild);
    else firstCol.appendChild(post);
  } else if (i % 3 == 1) {
    if (before) secondCol.insertBefore(post, secondCol.firstChild);
    else secondCol.appendChild(post);
  } else {
    if (before) thirdCol.insertBefore(post, thirdCol.firstChild);
    else thirdCol.appendChild(post);
  }
  const starBtn = post.querySelector('.post__button--star');
  starBtn.addEventListener('click', () => {
    const star = starBtn.querySelector('.fa-star');
    if (star.classList.contains('fa-solid')) {
      star.classList.remove('fa-solid');
      removePostFromStarred(p.id);
    } else {
      star.classList.add('fa-solid');
      addPostToStarred(p.id);
    }
  });
  const deleteBtn = post.querySelector('.post__button--delete');
  deleteBtn.addEventListener('click', () => {
    removePost(p.id);
  });
  const editBtn = post.querySelector('.post__button--edit');
  editBtn.addEventListener('click', () => {
    setModalToEdit(p.id);
  });
  i++;
};

const renderPosts = (posts = [], before) => {
  posts.forEach((p) => {
    renderNewPost(p, before);
  });
};

const updatePostElement = (updatedPost) => {
  const postElement = document.querySelector(`[data-id="${updatedPost.id}"]`);
  postElement.querySelector('.post__title').textContent = updatedPost?.title;
  postElement.querySelector('.post__body').textContent = updatedPost?.body;
  postElement.querySelector('.post__avatar').textContent =
    updatedPost?.user?.name[0];
  postElement.querySelector('.post__author').textContent =
    updatedPost?.user?.name;
  postElement.querySelector('.post__company').textContent =
    updatedPost?.user?.company?.name;
};

fetchAllDataAndRender();

tippy('#dark-mode-toggle', {
  content: 'Change theme',
});

// Modal

const modal = document.querySelector('#modal');

const deleteModal = document.querySelector('#delete-modal');

const closeModalBtn = document.querySelector('#close-modal');

const closeDeleteModalBtn = document.querySelectorAll('.close-delete-modal');

const deleteStarredPostBtn = document.querySelector('#delete-starred-post-btn');

const modalTitle = document.querySelector('#modal-title');

const submitText = document.querySelector('#submit-text');

deleteStarredPostBtn.addEventListener('click', () => {
  starredPosts = starredPosts.filter((p) => p.id !== selectedId);
  localStorage.setItem('starredPosts', JSON.stringify(starredPosts));
  removePost(selectedId);
  deleteModal.classList.toggle('hidden');
  selectedId = null;
});

const setModalToEdit = (id) => {
  let post = null;
  if (starredPosts.find((p) => p.id === id)) {
    post = starredPosts.find((p) => p.id === id);
  } else {
    post = posts.find((p) => p.id === id);
  }
  selectedPost = post;
  isEdit = true;
  toggleModal();
  userField.value = post?.user?.name;
  titleField.value = post?.title;
  bodyField.value = post?.body;
  modalTitle.textContent = 'Update post';
  submitText.textContent = 'Update Post';
};

const clearForm = () => {
  titleControl.classList.remove('invalid');
  titleField.value = '';
  bodyControl.classList.remove('invalid');
  bodyField.value = '';
  select.classList.remove('form__control--invalid');
  userField.value = '';
};

const toggleModal = () => {
  modal.classList.toggle('hidden');
  modalTitle.textContent = 'Create new post';
  submitText.textContent = 'Create Post';
  clearForm();
};

closeDeleteModalBtn.forEach((btn) =>
  btn.addEventListener('click', () => {
    deleteModal.classList.toggle('hidden');
  })
);

closeModalBtn.addEventListener('click', () => {
  isEdit = false;
  toggleModal();
});

modal.addEventListener('click', (event) => {
  const self = event.target.closest('.modal__body');
  if (!self) {
    isEdit = false;
    modal.classList.add('hidden');
  }
});

deleteModal.addEventListener('click', (event) => {
  const self = event.target.closest('.close-modal__body');
  if (!self) {
    deleteModal.classList.add('hidden');
  }
});

const createPost = async (postData) => {
  try {
    let post = await postsService.createPost(postData);

    post = {
      ...post,
      user: users.find((u) => u.id === post.userId),
    };

    allPosts.unshift(post);
    posts.unshift(post);

    renderNewPost(post, true);
  } catch (error) {
    console.log(error);
  }
};

const removePost = async (id) => {
  try {
    if (starredPosts.find((post) => post.id === id)) {
      deleteModal.classList.toggle('hidden');
      selectedId = id;
      return;
    }
    await postsService.deletePost(id);
    allPosts = allPosts.filter((post) => post.id !== id);
    posts = posts.filter((post) => post.id !== id);
    const post = document.querySelector(`[data-id="${id}"]`);
    post.remove();
  } catch (error) {
    console.log(error);
  }
};

const updatePost = async (postData) => {
  try {
    await postsService.editPost(postData);
    postData = {
      ...postData,
      user: users.find((u) => u.id === postData.userId),
    };
    allPosts = allPosts.map((post) =>
      post.id === postData.id ? postData : post
    );
    if (starredPosts.find((p) => p.id === postData.id)) {
      starredPosts = starredPosts.map((p) =>
        p.id === postData.id ? postData : p
      );
      localStorage.setItem('starredPosts', JSON.stringify(starredPosts));
    }
    posts = posts.map((post) => (post.id === postData.id ? postData : post));
    updatePostElement(postData);
  } catch (error) {
    console.log(error);
  }
};

const addPostToStarred = (id) => {
  starredPosts.unshift(posts.find((p) => p.id === id));
  localStorage.setItem('starredPosts', JSON.stringify(starredPosts));
};

const removePostFromStarred = (id) => {
  starredPosts = starredPosts.filter((p) => p.id !== id);
  localStorage.setItem('starredPosts', JSON.stringify(starredPosts));
};

// Form submit

const postForm = document.querySelector('#post-form');

const titleField = document.querySelector('#title');
const titleControl = document.querySelector('#title-control');

const bodyField = document.querySelector('#body');
const bodyControl = document.querySelector('#body-control');

const submitBtn = document.querySelector('#submit');

titleField.addEventListener('input', (e) => {
  if (titleControl.classList.contains('invalid')) {
    titleControl.classList.remove('invalid');
  }
});

bodyField.addEventListener('input', () => {
  if (bodyControl.classList.contains('invalid')) {
    bodyControl.classList.remove('invalid');
  }
});

postForm.addEventListener('submit', (e) => {
  e.preventDefault();
  let isError = false;
  if (!titleField.value) {
    titleControl.classList.add('invalid');
    isError = true;
  }
  if (!bodyField.value) {
    bodyControl.classList.add('invalid');
    isError = true;
  }
  if (!userField.value) {
    select.classList.add('form__control--invalid');
    isError = true;
  }

  if (isError) return;

  const newPost = {
    ...selectedPost,
    title: titleField.value,
    body: bodyField.value,
    userId: users.find((u) => u.name === userField.value.trim()).id,
  };

  if (isEdit) {
    updatePost(newPost);
  } else {
    createPost(newPost);
  }

  submitBtn.classList.add('loading');
  submitBtn.querySelector('span').textContent = 'Loading...';

  setTimeout(() => {
    titleField.value = '';
    bodyField.value = '';
    userField.value = '';
    submitBtn.classList.remove('loading');
    submitBtn.querySelector('span').textContent = isEdit
      ? 'Edit Post'
      : 'Create Post';
    modal.classList.toggle('hidden');
    selectedPost = null;
  }, 2000);
});

const createBtn = document.querySelector('#create');

createBtn.addEventListener('click', toggleModal);

// Imitate pagination on scroll

let isFetching = false;

const main = document.querySelector('main');

const scrollBtn = document.querySelector('#scrollTop');

scrollBtn.addEventListener('click', () => window.scrollTo(0, 0));

scrollBtn.classList.add('hidden');

const paginateOnScroll = () => {
  if (window.scrollY > main.offsetHeight - main.offsetTop) {
    if (!isFetching) {
      isFetching = true;
      fetchMorePosts();
    }
  }
};

const fetchMorePosts = () => {
  if (page === pages) {
    window.removeEventListener('scroll', paginateOnScroll);
    scrollBtn.classList.remove('hidden');
    return;
  }
  document.dispatchEvent(loading);
  setTimeout(() => {
    page = Math.min(page + 1, pages);
    const newPosts = allPosts.slice(
      (page - 1) * pageSize,
      pageSize + (page - 1) * pageSize
    );
    posts = [...posts, ...newPosts];
    renderPosts(newPosts, false, false);
    document.dispatchEvent(stopLoading);
    isFetching = false;
  }, 1000);
};

window.addEventListener('scroll', paginateOnScroll);

// Proximity hover effect

const leftEye = document.querySelector('#leftEye');
const rightEye = document.querySelector('#rightEye');

const leftRect = leftEye.getBoundingClientRect();

document.addEventListener('mousemove', (e) => {
  const leftX = leftRect.left + window.scrollX + leftRect.width / 2;
  const leftY = leftRect.top + +window.scrollY + leftRect.height / 2;

  const rad = Math.atan2(e.pageX - leftX, e.pageY - leftY);
  const rot = rad * (180 / Math.PI) * -1 + 180;

  leftEye.style.transform = `rotate(${rot}deg)`;
  rightEye.style.transform = `rotate(${rot}deg)`;
});

// Select user

const select = document.querySelector('#select');
const userField = document.querySelector('#user');
const dropdown = document.querySelector('#dropdown');
const clear = document.querySelector('.form__clear');

select.addEventListener('click', () => {
  dropdown.classList.toggle('hidden');
  select.classList.add('focus');
});

select.addEventListener('blur', () => {
  dropdown.classList.add('hidden');
  select.classList.remove('focus');
});

clear.addEventListener('click', () => {
  userField.value = '';
});

// Dark mode

let isDarkMode = false;

if (localStorage.getItem('isDarkMode')) {
  isDarkMode = JSON.parse(localStorage.getItem('isDarkMode'));
}

const toggleDarkModeBtn = document.querySelector('#dark-mode-toggle');

const icon = toggleDarkModeBtn.querySelector('.icon');

if (isDarkMode) {
  document.body.classList.add('dark');
  icon.classList.add('fa-sun');
  icon.classList.remove('fa-moon');
}

toggleDarkModeBtn.addEventListener('click', () => {
  isDarkMode = !isDarkMode;
  localStorage.setItem('isDarkMode', isDarkMode);
  icon.classList.toggle('fa-sun');
  icon.classList.toggle('fa-moon');
  document.body.classList.toggle('dark');
});
