import { ProjectService, StoryService, TaskService } from "./service";
import { SessionService } from "./session";
import type { Story, Priority, Status, Task } from "./model";

// --- SERWISY ---
const projectService = new ProjectService();
const storyService = new StoryService();
const taskService = new TaskService();
const session = new SessionService();

// --- DOM ---
const userInfo = document.getElementById("user-info") as HTMLElement;

const nameInput = document.getElementById("name") as HTMLInputElement;
const descInput = document.getElementById("description") as HTMLInputElement;
const addBtn = document.getElementById("addBtn") as HTMLButtonElement;
const projectList = document.getElementById("projects") as HTMLUListElement;

const storySection = document.getElementById("story-section") as HTMLElement;
const storyNameInput = document.getElementById("storyName") as HTMLInputElement;
const storyDescInput = document.getElementById("storyDesc") as HTMLInputElement;
const storyPriority = document.getElementById("storyPriority") as HTMLSelectElement;
const addStoryBtn = document.getElementById("addStoryBtn") as HTMLButtonElement;

const taskNameInput = document.getElementById("taskName") as HTMLInputElement;
const taskDescInput = document.getElementById("taskDesc") as HTMLInputElement;
const taskPriorityInput = document.getElementById("taskPriority") as HTMLSelectElement;
const taskTimeInput = document.getElementById("taskTime") as HTMLInputElement;
const taskUserSelect = document.getElementById("taskUser") as HTMLSelectElement;
const addTaskBtn = document.getElementById("addTaskBtn") as HTMLButtonElement;

const themeToggle = document.getElementById("themeToggle") as HTMLInputElement;
const finishTaskBtn = document.getElementById("finishTaskBtn") as HTMLButtonElement;

// --- STATE ---
let editingProjectId: string | null = null;
let selectedStoryId: string | null = null;
let selectedTask: Task | null = null;

// --- USER ---
const user = session.getCurrentUser();
userInfo.innerText = `Użytkownik: ${user.firstName} ${user.lastName}`;

// =====================
// PROJECTS
// =====================
function renderProjects() {
  projectList.innerHTML = "";
  const projects = projectService.getAll();
  const activeProjectId = session.getActiveProjectId();

  projects.forEach(project => {
    const div = document.createElement("div");

    div.className = `list-group-item d-flex justify-content-between ${project.id === activeProjectId ? "active-project" : ""}`;
    div.innerHTML = `
      <div class="project-info">
        <b>${project.name}</b><br/>
        <small>${project.description}</small>
      </div>
      <div>
        <button class="edit">✏️</button>
        <button class="delete">🗑️</button>
      </div>
    `;

    div.querySelector(".project-info")?.addEventListener("click", () => {
      session.setActiveProject(project.id);
      renderProjects();
      renderStories();
    });

    div.querySelector(".edit")?.addEventListener("click", (e) => {
      e.stopPropagation();
      editingProjectId = project.id;
      nameInput.value = project.name;
      descInput.value = project.description;
    });

    div.querySelector(".delete")?.addEventListener("click", (e) => {
      e.stopPropagation();
      projectService.delete(project.id);
      renderProjects();
      renderStories();
    });

    projectList.appendChild(div);
  });
}
addBtn.addEventListener("click", () => {
  if (editingProjectId) {
    projectService.update({
      id: editingProjectId,
      name: nameInput.value,
      description: descInput.value
    });

    editingProjectId = null;
    addBtn.innerText = "Dodaj projekt";
  } else {
    projectService.create({
      id: crypto.randomUUID(),
      name: nameInput.value,
      description: descInput.value
    });
  }

  nameInput.value = "";
  descInput.value = "";

  renderProjects();
});
// =====================
// STORIES
// =====================

addStoryBtn.addEventListener("click", () => {
  const projectId = session.getActiveProjectId();

  if (!projectId) {
    alert("Najpierw wybierz projekt!");
    return;
  }

  const newStory: Story = {
    id: crypto.randomUUID(),
    name: storyNameInput.value,
    description: storyDescInput.value,
    priority: storyPriority.value as Priority,
    projectId: projectId,
    ownerId: session.getCurrentUser().id,
    createdAt: new Date().toISOString(),
    status: "todo"
  };

  storyService.create(newStory);

  // reset inputów
  storyNameInput.value = "";
  storyDescInput.value = "";

  renderStories();
});

function renderStories() {
  const projectId = session.getActiveProjectId();
  if (!projectId) {
    storySection.style.display = "none";
    return;
  }

  storySection.style.display = "block";

  const stories = storyService.getAll(projectId);

  const cols = {
    todo: document.getElementById("col-todo")!,
    doing: document.getElementById("col-doing")!,
    done: document.getElementById("col-done")!
  };

  Object.values(cols).forEach(c => c.innerHTML = "");

  stories.forEach(story => {
    const div = document.createElement("div");

    div.className = "card p-2 mb-2";
    div.innerHTML = `
      <b>${story.name}</b>
      <button class="next">➔</button>
    `;

    div.addEventListener("click", () => {
      selectedStoryId = story.id;
      renderTasks(story.id);
    });

    div.querySelector(".next")?.addEventListener("click", (e) => {
      e.stopPropagation();

      const next: Record<Status, Status> = {
        todo: "doing",
        doing: "done",
        done: "todo"
      };

      story.status = next[story.status];
      storyService.update(story);
      renderStories();
    });

    cols[story.status].appendChild(div);
  });
}

// =====================
// TASKS
// =====================
function renderTasks(storyId: string) {
  const tasks = taskService.getByStory(storyId);

  const cols = {
    todo: document.getElementById("col-todo")!,
    doing: document.getElementById("col-doing")!,
    done: document.getElementById("col-done")!
  };

  Object.values(cols).forEach(c => c.innerHTML = "");

  tasks.forEach(task => {
    const div = document.createElement("div");

    const assigned = session.getAllUsers()
      .find(u => u.id === task.assignedUserId);

    div.className = "card p-2 mb-2";
    div.innerHTML = `
      <b>${task.name}</b><br/>
      <small>${assigned ? assigned.firstName : "Brak osoby"}</small>
      <button class="done">Done</button>
    `;

    div.addEventListener("click", () => showTaskDetails(task));

    div.querySelector(".done")?.addEventListener("click", (e) => {
      e.stopPropagation();
      finishTask(task);
      renderTasks(storyId);
    });

    cols[task.status].appendChild(div);
  });
}

// =====================
// TASK ACTIONS
// =====================
function assignUserToTask(task: Task, userId: string) {
  task.assignedUserId = userId;
  task.status = "doing";
  task.startedAt = new Date().toISOString();
  taskService.update(task);
}

function finishTask(task: Task) {
  task.status = "done";
  task.finishedAt = new Date().toISOString();
  taskService.update(task);

  const tasks = taskService.getByStory(task.storyId);
  const allDone = tasks.every(t => t.status === "done");

  if (allDone) {
    const story = storyService
      .getAll(session.getActiveProjectId()!)
      .find(s => s.id === task.storyId);

    if (story) {
      story.status = "done";
      storyService.update(story);
    }
  }
}

// =====================
// TASK DETAILS (MODAL)
// =====================
function showTaskDetails(task: Task) {
  selectedTask = task;

  const details = document.getElementById("taskDetails")!;
  details.innerHTML = `
    <p>${task.name}</p>
    <p>Status: ${task.status}</p>
  `;

  // @ts-ignore
  new bootstrap.Modal(document.getElementById("taskModal")).show();
}

finishTaskBtn.addEventListener("click", () => {
  if (!selectedTask) return;

  finishTask(selectedTask);
  renderTasks(selectedTask.storyId);

  // @ts-ignore
  bootstrap.Modal.getInstance(document.getElementById("taskModal")).hide();
});

// =====================
// ADD TASK
// =====================
addTaskBtn.addEventListener("click", () => {
 if (!selectedStoryId) {
  alert("Najpierw wybierz story!");
  return;
}

  const task: Task = {
    id: crypto.randomUUID(),
    name: taskNameInput.value,
    description: taskDescInput.value,
    priority: taskPriorityInput.value as Priority,
    storyId: selectedStoryId,
    estimatedTime: Number(taskTimeInput.value),
    status: "todo",
    createdAt: new Date().toISOString()
  };

  taskService.create(task);

if (taskUserSelect.value) {
  assignUserToTask(task, taskUserSelect.value);
}

  renderTasks(selectedStoryId);
});

// =====================
// USERS
// =====================
function loadUsers() {
  const users = session.getAllUsers().filter(u => u.role !== "admin");

  taskUserSelect.innerHTML = `<option value="">Wybierz</option>`;

  users.forEach(u => {
    const option = document.createElement("option");
    option.value = u.id;
    option.textContent = `${u.firstName} (${u.role})`;
    taskUserSelect.appendChild(option);
  });
}

// =====================
// THEME
// =====================
function setTheme(isDark: boolean) {
  document.body.classList.toggle("dark", isDark);
  localStorage.setItem("theme", isDark ? "dark" : "light");
  themeToggle.checked = isDark;
}

themeToggle.addEventListener("change", () => {
  setTheme(themeToggle.checked);
});

const savedTheme = localStorage.getItem("theme");
setTheme(savedTheme === "dark");

// =====================
// INIT
// =====================
renderProjects();
renderStories();
loadUsers();