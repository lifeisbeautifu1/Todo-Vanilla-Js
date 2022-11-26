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
let selectedPost = null;
let selectedElementPost = null;
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
    // Fetch posts
    allPosts = await postsService.getPosts();
    // Set pages
    pages = Math.round(allPosts.length / pageSize);

    // Shuffle
    allPosts = allPosts.sort((a, b) => Math.random() - 0.5);
    // Fetch all users
    users = await userService.getUsers();

    renderUsers();
    // Append user data to each post respectively
    allPosts = allPosts.map((post) => {
      return {
        ...post,
        user: users.find((u) => u.id === post.userId),
      };
    });

    if (localStorage.getItem('starredPosts')) {
      starredPosts = JSON.parse(localStorage.getItem('starredPosts'));
      renderPosts(starredPosts, false, true);
    }

    posts = allPosts.slice(
      (page - 1) * pageSize,
      pageSize + (page - 1) * pageSize
    );

    // Stop loading
    document.dispatchEvent(stopLoading);

    renderPosts(posts, false, false);
  } catch (error) {
    console.log(error);
  }
};

const renderNewPost = (p, before, starred) => {
  const post = document.createElement('li');
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
                 <i class="fa-regular ${starred && 'fa-solid'} fa-star"></i>
                </button>
              </div>`;
  if (i % 3 === 0) {
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
      starredPosts = starredPosts.filter((post) => post.id !== p.id);
      localStorage.setItem('starredPosts', JSON.stringify(starredPosts));
    } else {
      star.classList.add('fa-solid');
      starred = true;
      starredPosts.unshift(p);
      localStorage.setItem('starredPosts', JSON.stringify(starredPosts));
    }
  });
  const deleteBtn = post.querySelector('.post__button--delete');
  deleteBtn.addEventListener('click', () => {
    if (starred) {
      selectedPost = p;
      selectedElementPost = post;
      deleteModal.classList.toggle('hidden');
    } else {
      removePost(post, p);
    }
  });
  const editBtn = post.querySelector('.post__button--edit');
  editBtn.addEventListener('click', () => {
    setModalToEdit(post, p);
  });
  const editTippy = tippy('.post__button--edit', {
    content: 'Edit post',
  });
  const deleteTippy = tippy('.post__button--delete', {
    content: 'Delete post',
  });
  const starTippy = tippy('.post__button--star', {
    content: 'Star post',
  });
  tippy.createSingleton([...editTippy, ...deleteTippy, ...starTippy], {
    delay: 300,
    moveTransition: 'transform 0.3s ease-out',
  });
  i++;
};

const renderPosts = (posts = [], before, starred) => {
  posts.forEach((p) => {
    renderNewPost(p, before, starred);
  });
};

const updatePostElement = (newPost) => {
  console.log(selectedElementPost, newPost);
  selectedElementPost.querySelector('.post__title').textContent =
    newPost?.title;
  selectedElementPost.querySelector('.post__body').textContent = newPost?.body;
  selectedElementPost.querySelector('.post__avatar').textContent =
    newPost?.user?.name[0];
  selectedElementPost.querySelector('.post__author').textContent =
    newPost?.user?.name;
  selectedElementPost.querySelector('.post__company').textContent =
    newPost?.user?.company?.name;
  const controls = selectedElementPost.querySelector('.post__controls');
  controls.remove();
  selectedElementPost.innerHTML += `
  <div class="post__controls group-hover:visible group-hover:opacity-100 group-hover:translate-y-0">
                <button  class="post__button post__button--edit">
                  <i class="fa-solid fa-pen"></i>
                </button>
                <button tabindex="0" class="post__button post__button--delete">
                  <i class="fa-solid fa-trash"></i>
                </button>
                <button tabindex="0" class="post__button post__button--star">
                 <i class="fa-regular ${
                   starredPosts.find((p) => p.id === newPost.id) && 'fa-solid'
                 } fa-star"></i>
                </button>
     </div>`;
  const starBtn = selectedElementPost.querySelector('.post__button--star');
  starBtn.addEventListener('click', () => {
    const star = starBtn.querySelector('.fa-star');
    if (star.classList.contains('fa-solid')) {
      star.classList.remove('fa-solid');
      starredPosts = starredPosts.filter((post) => post.id !== newPost.id);
      localStorage.setItem('starredPosts', JSON.stringify(starredPosts));
    } else {
      star.classList.add('fa-solid');
      starred = true;
      starredPosts.unshift(newPost);
      localStorage.setItem('starredPosts', JSON.stringify(starredPosts));
    }
  });
  const deleteBtn = selectedElementPost.querySelector('.post__button--delete');
  deleteBtn.addEventListener('click', () => {
    if (starred) {
      selectedPost = p;
      selectedElementPost = post;
      deleteModal.classList.toggle('hidden');
    } else {
      removePost(selectedElementPost, p);
    }
  });
  const editBtn = selectedElementPost.querySelector('.post__button--edit');
  editBtn.addEventListener('click', () => {
    setModalToEdit(selectedElementPost, newPost);
  });
  console.log(newPost);
  console.log(selectedElementPost);
};

fetchAllDataAndRender();

// Modal

const modal = document.querySelector('#modal');

const deleteModal = document.querySelector('#delete-modal');

const closeModalBtn = document.querySelector('#close-modal');

const closeDeleteModalBtn = document.querySelectorAll('.close-delete-modal');

const deleteStarredPostBtn = document.querySelector('#delete-starred-post-btn');

const modalTitle = document.querySelector('#modal-title');

const submitText = document.querySelector('#submit-text');

deleteStarredPostBtn.addEventListener('click', () => {
  removePost(selectedElementPost, selectedPost);
  starredPosts = starredPosts.filter((p) => p.id !== selectedPost.id);
  localStorage.setItem('starredPosts', JSON.stringify(starredPosts));
  deleteModal.classList.toggle('hidden');
});

const setModalToEdit = (postEl, p) => {
  selectedPost = p;
  selectedElementPost = postEl;
  isEdit = true;
  toggleModal();
  userField.value = p.user.name;
  titleField.value = p.title;
  bodyField.value = p.body;
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

const toggleModal = (e) => {
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
  // selectedPost = null;
  // selectedElementPost = null;
  toggleModal();
});

modal.addEventListener('click', (event) => {
  const self = event.target.closest('.modal__body');
  if (!self) {
    isEdit = false;
    // selectedPost = null;
    // selectedElementPost = null;
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

const removePost = async (postElement, postData) => {
  try {
    await postsService.deletePost(postData?.id);
    allPosts = allPosts.filter((post) => post.id !== postData.id);
    posts = posts.filter((post) => post.id !== postData.id);
    postElement.remove();
  } catch (error) {
    console.log(error);
  }
};

const updatePost = async (postData) => {
  try {
    await postsService.editPost(postData);
    postData.user = users.find((u) => u.id === postData.userId);
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
  }, 2000);
});

// Create post

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

const anchor = document.getElementById('anchor');

const rect = anchor.getBoundingClientRect();

const eyes = document.querySelectorAll('.eye');

const anchorX = rect.left + rect.width / 2;
const anchorY = rect.top + rect.height / 2;

document.addEventListener('mousemove', (e) => {
  const mouseX = e.clientX;
  const mouseY = e.clientY;

  const angleDeg = angle(mouseX, mouseY, anchorX, anchorY);

  eyes.forEach((eye) => {
    eye.style.transform = `rotate(${angleDeg - 90}deg)`;
  });
});

function angle(cx, cy, ex, ey) {
  const dy = ey - cy;
  const dx = ex - cx;

  const rad = Math.atan2(dy, dx);

  const deg = (rad * 180) / Math.PI;

  return deg;
}

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
