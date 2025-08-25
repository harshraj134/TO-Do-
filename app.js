// app.js — To‑Do List with localStorage, filters, and inline edit
(function () {
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const form = $('#new-task-form');
  const input = $('#task-input');
  const list = $('#task-list');
  const clearBtn = $('#clear-completed');
  const itemsLeft = $('#items-left');
  const filterRadios = $$('input[name="filter"]');

  const STORAGE_KEY = 'todo.tasks.v1';
  let state = {
    tasks: load(),
    filter: 'all',
  };

  function uid() {
    return Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
  }

  function load() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tasks));
  }

  function addTask(title) {
    const trimmed = title.trim();
    if (!trimmed) return;
    state.tasks.push({ id: uid(), title: trimmed, completed: false });
    save();
    render();
  }

  function toggleTask(id) {
    const t = state.tasks.find(t => t.id === id);
    if (t) t.completed = !t.completed;
    save();
    render();
  }

  function deleteTask(id) {
    state.tasks = state.tasks.filter(t => t.id !== id);
    save();
    render();
  }

  function clearCompleted() {
    state.tasks = state.tasks.filter(t => !t.completed);
    save();
    render();
  }

  function editTask(id, newTitle) {
    const t = state.tasks.find(t => t.id === id);
    if (!t) return;
    const val = newTitle.trim();
    if (!val) {
      // if empty after edit, remove task
      state.tasks = state.tasks.filter(x => x.id !== id);
    } else {
      t.title = val;
    }
    save();
    render();
  }

  function setFilter(value) {
    state.filter = value;
    render();
  }

  function filteredTasks() {
    switch (state.filter) {
      case 'active': return state.tasks.filter(t => !t.completed);
      case 'completed': return state.tasks.filter(t => t.completed);
      default: return state.tasks;
    }
  }

  function updateCounter() {
    const left = state.tasks.filter(t => !t.completed).length;
    itemsLeft.textContent = `${left} item${left !== 1 ? 's' : ''} left`;
  }

  function render() {
    list.innerHTML = '';
    const tasks = filteredTasks();
    for (const t of tasks) {
      list.appendChild(renderItem(t));
    }
    updateCounter();
    // Keep the correct filter radio selected
    filterRadios.forEach(r => { r.checked = (r.value === state.filter); });
  }

  function renderItem(task) {
    const li = document.createElement('li');
    li.className = 'item' + (task.completed ? ' completed' : '');
    li.dataset.id = task.id;

    // Checkbox
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.className = 'item__checkbox';
    cb.checked = task.completed;
    cb.setAttribute('aria-label', 'Mark complete');
    cb.addEventListener('change', () => toggleTask(task.id));

    // Title (label)
    const title = document.createElement('span');
    title.className = 'item__title';
    title.textContent = task.title;

    // Actions
    const actions = document.createElement('div');
    actions.className = 'item__actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'icon-btn';
    editBtn.title = 'Edit';
    editBtn.setAttribute('aria-label', 'Edit task');
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', () => startEdit(li, task));

    const delBtn = document.createElement('button');
    delBtn.className = 'icon-btn icon-btn--danger';
    delBtn.title = 'Delete';
    delBtn.setAttribute('aria-label', 'Delete task');
    delBtn.textContent = 'Delete';
    delBtn.addEventListener('click', () => deleteTask(task.id));

    actions.append(editBtn, delBtn);
    li.append(cb, title, actions);

    // Double‑click to edit
    li.addEventListener('dblclick', (e) => {
      // prevent dblclick on buttons
      if (e.target.closest('.icon-btn')) return;
      startEdit(li, task);
    });

    return li;
  }

  function startEdit(li, task) {
    // Replace title span with an input
    const span = li.querySelector('.item__title');
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'edit-input';
    input.value = task.title;
    li.replaceChild(input, span);
    input.focus();
    input.setSelectionRange(task.title.length, task.title.length);

    function finish(commit) {
      input.removeEventListener('keydown', onKey);
      input.removeEventListener('blur', onBlur);
      if (commit) {
        editTask(task.id, input.value);
      } else {
        render();
      }
    }
    function onKey(e) {
      if (e.key === 'Enter') finish(true);
      else if (e.key === 'Escape') finish(false);
    }
    function onBlur() { finish(true); }

    input.addEventListener('keydown', onKey);
    input.addEventListener('blur', onBlur);
  }

  // Event wiring
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    addTask(input.value);
    input.value = '';
    input.focus();
  });

  clearBtn.addEventListener('click', clearCompleted);

  filterRadios.forEach(radio => {
    radio.addEventListener('change', () => setFilter(radio.value));
  });

  // Keyboard shortcut: Enter adds, Ctrl+L clears completed
  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && (e.key === 'l' || e.key === 'L')) {
      e.preventDefault();
      clearCompleted();
    }
  });

  // Initial render
  render();
})();