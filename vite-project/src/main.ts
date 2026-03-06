import { ProjectService, StoryService } from "./service";
import { SessionService } from "./session";
import type { Story, Priority, Status } from "./model";

// Inicjalizacja serwisów
const projectService = new ProjectService();
const storyService = new StoryService();
const session = new SessionService();

// Elementy DOM - Użytkownik i Projekty
const userInfo = document.getElementById("user-info") as HTMLElement;
const nameInput = document.getElementById("name") as HTMLInputElement;
const descInput = document.getElementById("description") as HTMLInputElement;
const addBtn = document.getElementById("addBtn") as HTMLButtonElement;
const projectList = document.getElementById("projects") as HTMLUListElement;

// Elementy DOM - Historyjki (Stories)
const storySection = document.getElementById("story-section") as HTMLElement;
const storyNameInput = document.getElementById("storyName") as HTMLInputElement;
const storyDescInput = document.getElementById("storyDesc") as HTMLInputElement;
const storyPriority = document.getElementById("storyPriority") as HTMLSelectElement;
const addStoryBtn = document.getElementById("addStoryBtn") as HTMLButtonElement;

let editingProjectId: string | null = null;

// --- LOGIKA UŻYTKOWNIKA ---
const user = session.getCurrentUser();
userInfo.innerText = `Użytkownik: ${user.firstName} ${user.lastName}`;

// --- RENDEROWANIE PROJEKTÓW ---
function renderProjects() {
  projectList.innerHTML = "";
  const projects = projectService.getAll();
  const activeProjectId = session.getActiveProjectId();

  projects.forEach(project => {
    const li = document.createElement("div"); // Zmień li na div dla list-group-item
li.className = `list-group-item list-group-item-action d-flex justify-content-between align-items-center ${project.id === activeProjectId ? "active-project" : ""}`;
li.innerHTML = `
  <div class="project-info" style="cursor:pointer; flex-grow: 1;">
    <h6 class="mb-0">${project.name}</h6>
    <small class="text-muted">${project.description.substring(0, 30)}...</small>
  </div>
  <div class="btn-group btn-group-sm">
    <button class="btn btn-outline-secondary edit-btn">✏️</button>
    <button class="btn btn-outline-danger delete-btn">🗑️</button>
  </div>
`;

    // Wybór aktywnego projektu
    li.querySelector(".project-info")?.addEventListener("click", () => {
      session.setActiveProject(project.id);
      renderProjects();
      renderStories();
    });

    // Edycja
    li.querySelector(".edit-btn")?.addEventListener("click", (e) => {
      e.stopPropagation();
      nameInput.value = project.name;
      descInput.value = project.description;
      editingProjectId = project.id;
      addBtn.innerText = "Zapisz zmiany";
    });

    // Usuwanie
    li.querySelector(".delete-btn")?.addEventListener("click", (e) => {
      e.stopPropagation();
      projectService.delete(project.id);
      if (session.getActiveProjectId() === project.id) {
        localStorage.removeItem("active_project_id");
      }
      renderProjects();
      renderStories();
    });

    projectList.appendChild(li);
  });
}

// --- RENDEROWANIE HISTORYJEK (BOARD) ---
function renderStories() {
  const activeProjectId = session.getActiveProjectId();
  
  if (!activeProjectId) {
    storySection.style.display = "none";
    return;
  }

  storySection.style.display = "block";
  const stories = storyService.getAll(activeProjectId);

  const cols = {
    todo: document.getElementById("col-todo")!,
    doing: document.getElementById("col-doing")!,
    done: document.getElementById("col-done")!
  };

  // Czyścimy kolumny
  Object.values(cols).forEach(c => c.innerHTML = "");

  stories.forEach(story => {
    const div = document.createElement("div");
const priorityColor = story.priority === 'high' ? 'danger' : (story.priority === 'medium' ? 'warning' : 'success');

div.className = `card shadow-sm mb-2 story-card border-start border-4 border-${priorityColor}`;
div.innerHTML = `
  <div class="card-body p-2">
    <h6 class="card-title mb-1">${story.name}</h6>
    <p class="card-text small text-muted mb-2">${story.description}</p>
    <button class="btn btn-sm btn-light w-100 next-status-btn">➔ Przesuń</button>
  </div>
`;

    div.querySelector(".next-status-btn")?.addEventListener("click", () => {
        const nextStatus: Record<Status, Status> = {
            'todo': 'doing',
            'doing': 'done',
            'done': 'todo'
        };
        story.status = nextStatus[story.status];
        storyService.update(story);
        renderStories();
    });

    cols[story.status].appendChild(div);
  });
}

// --- EVENT LISTENERY ---

// Dodawanie/Edycja Projektu
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

// Dodawanie Historyjki
addStoryBtn.addEventListener("click", () => {
  const activeId = session.getActiveProjectId();
  if (!activeId) return;

  const newStory: Story = {
    id: crypto.randomUUID(),
    name: storyNameInput.value,
    description: storyDescInput.value,
    priority: storyPriority.value as Priority,
    projectId: activeId,
    ownerId: session.getCurrentUser().id,
    createdAt: new Date().toISOString(),
    status: 'todo'
  };

  storyService.create(newStory);
  storyNameInput.value = "";
  storyDescInput.value = "";
  renderStories();
});

// Start aplikacji
renderProjects();
renderStories();