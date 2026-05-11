import { ProjectService, StoryService, TaskService } from './service'
import { AuthService } from './auth'
import { NotificationService } from './notification'
import { GOOGLE_CLIENT_ID } from './config'
import { initStorage } from './storage'
import type { Story, Priority, Status, Task, Notification, User, UserRole } from './model'

declare const google: any

// --- SERWISY ---
const projectService = new ProjectService()
const storyService = new StoryService()
const taskService = new TaskService()
const authService = new AuthService()
const notificationService = new NotificationService()

// --- DOM: AUTH ---
const loginView = document.getElementById('login-view') as HTMLElement
const guestView = document.getElementById('guest-view') as HTMLElement
const blockedView = document.getElementById('blocked-view') as HTMLElement
const appWrapper = document.getElementById('app-wrapper') as HTMLElement
const navbarControls = document.getElementById('navbar-controls') as HTMLElement

// --- DOM: NAVBAR ---
const userInfo = document.getElementById('user-info') as HTMLElement
const usersNavLink = document.getElementById('users-nav-link') as HTMLAnchorElement
const logoutBtn = document.getElementById('logoutBtn') as HTMLButtonElement

// --- DOM: GŁÓWNE ---
const nameInput = document.getElementById('name') as HTMLInputElement
const descInput = document.getElementById('description') as HTMLInputElement
const addBtn = document.getElementById('addBtn') as HTMLButtonElement
const projectList = document.getElementById('projects') as HTMLElement
const storySection = document.getElementById('story-section') as HTMLElement
const storyNameInput = document.getElementById('storyName') as HTMLInputElement
const storyDescInput = document.getElementById('storyDesc') as HTMLInputElement
const storyPriority = document.getElementById('storyPriority') as HTMLSelectElement
const addStoryBtn = document.getElementById('addStoryBtn') as HTMLButtonElement
const taskNameInput = document.getElementById('taskName') as HTMLInputElement
const taskDescInput = document.getElementById('taskDesc') as HTMLInputElement
const taskPriorityInput = document.getElementById('taskPriority') as HTMLSelectElement
const taskTimeInput = document.getElementById('taskTime') as HTMLInputElement
const taskUserSelect = document.getElementById('taskUser') as HTMLSelectElement
const addTaskBtn = document.getElementById('addTaskBtn') as HTMLButtonElement
const themeToggle = document.getElementById('themeToggle') as HTMLInputElement
const finishTaskBtn = document.getElementById('finishTaskBtn') as HTMLButtonElement

// --- DOM: POWIADOMIENIA ---
const notifCount = document.getElementById('notif-count') as HTMLElement
const notifBadgeLink = document.getElementById('notif-badge-link') as HTMLAnchorElement
const notifNavLink = document.getElementById('notif-nav-link') as HTMLAnchorElement
const mainView = document.getElementById('main-view') as HTMLElement
const notificationsView = document.getElementById('notifications-view') as HTMLElement
const notificationsList = document.getElementById('notifications-list') as HTMLElement
const markAllReadBtn = document.getElementById('markAllReadBtn') as HTMLButtonElement
const backToMainBtn = document.getElementById('backToMainBtn') as HTMLButtonElement
const notifPopupEl = document.getElementById('notif-popup') as HTMLElement

// --- DOM: UŻYTKOWNICY ---
const usersView = document.getElementById('users-view') as HTMLElement
const usersListEl = document.getElementById('users-list') as HTMLElement
const backToMainFromUsersBtn = document.getElementById('backToMainFromUsersBtn') as HTMLButtonElement

// --- STATE ---
let currentUser: User | null = null
let editingProjectId: string | null = null
let selectedStoryId: string | null = null
let selectedTask: Task | null = null
let currentView: 'main' | 'notifications' | 'users' = 'main'
let notifPopupQueue: Notification[] = []
let notifPopupVisible = false

// =====================
// AUTH & ROUTING
// =====================

async function routeByRole(): Promise<void> {
  currentUser = await authService.getCurrentUser()

  if (!currentUser) {
    showScreen('login')
    return
  }

  if (currentUser.blocked) {
    showScreen('blocked')
    document.getElementById('blocked-user-name')!.textContent =
      `${currentUser.firstName} ${currentUser.lastName}`
    return
  }

  if (currentUser.role === 'guest') {
    showScreen('guest')
    document.getElementById('guest-user-name')!.textContent =
      `${currentUser.firstName} ${currentUser.lastName}`
    return
  }

  userInfo.textContent = `${currentUser.firstName} ${currentUser.lastName}`
  showScreen('app')
  usersNavLink.style.display = currentUser.role === 'admin' ? '' : 'none'
  await Promise.all([updateNotifBadge(), renderProjects(), renderStories(), loadUsers()])
}

function showScreen(screen: 'login' | 'guest' | 'blocked' | 'app'): void {
  loginView.style.display = screen === 'login' ? '' : 'none'
  guestView.style.display = screen === 'guest' ? '' : 'none'
  blockedView.style.display = screen === 'blocked' ? '' : 'none'
  appWrapper.style.display = screen === 'app' ? '' : 'none'

  if (screen === 'login') {
    navbarControls.style.display = 'none'
  } else {
    navbarControls.style.display = 'flex'
    notifBadgeLink.style.display = screen === 'app' ? '' : 'none'
    notifNavLink.style.display = screen === 'app' ? '' : 'none'
    if (screen !== 'app') usersNavLink.style.display = 'none'
  }

  if (screen === 'app') {
    showView('main')
  }
}

function logout(): void {
  if (typeof google !== 'undefined' && google.accounts?.id) {
    google.accounts.id.disableAutoSelect()
  }
  authService.logout()
  currentUser = null
  routeByRole()
}

logoutBtn.addEventListener('click', logout)
document.getElementById('logoutBtnGuest')?.addEventListener('click', logout)
document.getElementById('logoutBtnBlocked')?.addEventListener('click', logout)

// =====================
// GOOGLE AUTH
// =====================

async function handleGoogleResponse(response: { credential: string }): Promise<void> {
  const { user, isNew } = await authService.handleGoogleCredential(response.credential)
  currentUser = user

  if (isNew && user.role === 'guest') {
    const admins = await authService.getAdmins()
    await Promise.all(admins.map(admin =>
      sendNotification({
        title: 'Nowe konto użytkownika',
        message: `${user.firstName} ${user.lastName} (${user.email}) zarejestrował się i oczekuje na zatwierdzenie.`,
        priority: 'high',
        recipientId: admin.id
      })
    ))
  }

  await routeByRole()
}

function initGoogleAuth(): void {
  if (!GOOGLE_CLIENT_ID) {
    const warn = document.getElementById('google-config-warning')
    if (warn) warn.style.display = ''
    return
  }

  if (typeof google === 'undefined' || !google.accounts?.id) {
    setTimeout(initGoogleAuth, 100)
    return
  }

  google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: handleGoogleResponse,
    auto_select: false
  })

  google.accounts.id.renderButton(
    document.getElementById('google-signin-btn'),
    { theme: 'outline', size: 'large', text: 'signin_with', locale: 'pl', width: 280 }
  )
}

// =====================
// POWIADOMIENIA
// =====================

function priorityBadgeClass(priority: string): string {
  if (priority === 'high') return 'bg-danger'
  if (priority === 'medium') return 'bg-warning text-dark'
  return 'bg-secondary'
}

async function sendNotification(partial: Omit<Notification, 'id' | 'date' | 'isRead'>): Promise<void> {
  if (!currentUser) return
  const notification: Notification = {
    ...partial,
    id: crypto.randomUUID(),
    date: new Date().toISOString(),
    isRead: false
  }
  await notificationService.create(notification)
  await updateNotifBadge()

  if (
    notification.recipientId === currentUser.id &&
    (notification.priority === 'medium' || notification.priority === 'high')
  ) {
    notifPopupQueue.push(notification)
    if (!notifPopupVisible) showNextPopup()
  }
}

async function updateNotifBadge(): Promise<void> {
  if (!currentUser) return
  const count = await notificationService.getUnreadCount(currentUser.id)
  notifCount.textContent = String(count)
  notifCount.style.display = count > 0 ? 'inline' : 'none'
}

// =====================
// POPUP POWIADOMIEŃ
// =====================

function showNextPopup(): void {
  if (notifPopupQueue.length === 0) {
    notifPopupVisible = false
    return
  }

  notifPopupVisible = true
  const notif = notifPopupQueue.shift()!

  const popupHeader = document.getElementById('notif-popup-header')!
  const popupTitle = document.getElementById('notif-popup-title')!
  const popupBody = document.getElementById('notif-popup-body')!
  const popupQueue = document.getElementById('notif-popup-queue')!

  popupTitle.textContent = notif.title
  popupBody.innerHTML = `
    <p class="mb-1 small">${notif.message}</p>
    <small class="text-muted">${new Date(notif.date).toLocaleString('pl-PL')}</small>
    <span class="badge ms-1 ${priorityBadgeClass(notif.priority)}">${notif.priority}</span>
  `
  popupHeader.className = `card-header py-2 d-flex justify-content-between align-items-center ${
    notif.priority === 'high' ? 'bg-danger text-white' : 'bg-warning'
  }`
  popupQueue.textContent = notifPopupQueue.length > 0 ? `+${notifPopupQueue.length} kolejnych` : ''

  const dismiss = () => {
    notifPopupEl.style.display = 'none'
    notifPopupVisible = false
    setTimeout(showNextPopup, 300)
  }

  document.getElementById('notif-popup-read')!.onclick = async () => {
    await notificationService.markAsRead(notif.id)
    await updateNotifBadge()
    if (currentView === 'notifications') await renderNotificationsList()
    dismiss()
  }
  document.getElementById('notif-popup-dismiss')!.onclick = dismiss
  document.getElementById('notif-popup-close')!.onclick = dismiss

  notifPopupEl.style.display = 'block'
}

// =====================
// WIDOKI APLIKACJI
// =====================

async function showView(view: 'main' | 'notifications' | 'users'): Promise<void> {
  currentView = view
  mainView.style.display = view === 'main' ? '' : 'none'
  notificationsView.style.display = view === 'notifications' ? '' : 'none'
  usersView.style.display = view === 'users' ? '' : 'none'
  if (view === 'notifications') await renderNotificationsList()
  if (view === 'users') await renderUsersView()
}

// =====================
// WIDOK POWIADOMIEŃ
// =====================

async function renderNotificationsList(): Promise<void> {
  if (!currentUser) return
  const notifications = await notificationService.getForUser(currentUser.id)

  if (notifications.length === 0) {
    notificationsList.innerHTML = '<p class="text-center text-muted mt-5 py-5">Brak powiadomień</p>'
    return
  }

  notificationsList.innerHTML = notifications.map(n => `
    <div class="card mb-2 notif-item ${!n.isRead ? 'notif-unread' : ''}"
         style="cursor:pointer" data-notif-id="${n.id}">
      <div class="card-body py-2 px-3">
        <div class="d-flex justify-content-between align-items-start gap-2">
          <div class="flex-grow-1">
            <h6 class="mb-1 ${!n.isRead ? 'fw-bold' : 'text-muted'}">${n.title}</h6>
            <p class="mb-1 small text-muted">${n.message}</p>
            <small class="text-muted">${new Date(n.date).toLocaleString('pl-PL')}</small>
          </div>
          <div class="d-flex flex-column align-items-end gap-1 flex-shrink-0">
            <span class="badge ${priorityBadgeClass(n.priority)}">${n.priority}</span>
            ${!n.isRead
              ? '<span class="badge bg-primary">Nowe</span>'
              : '<span class="badge bg-light text-muted border">Przeczytane</span>'
            }
          </div>
        </div>
      </div>
    </div>
  `).join('')

  notificationsList.querySelectorAll('.notif-item').forEach(el => {
    el.addEventListener('click', async () => {
      await showNotificationDetail(el.getAttribute('data-notif-id')!)
    })
  })
}

async function showNotificationDetail(id: string): Promise<void> {
  const notif = await notificationService.getById(id)
  if (!notif) return

  if (!notif.isRead) {
    await notificationService.markAsRead(id)
    await updateNotifBadge()
    if (currentView === 'notifications') await renderNotificationsList()
  }

  const fresh = await notificationService.getById(id)
  if (!fresh) return

  document.getElementById('notif-detail-title')!.textContent = fresh.title
  document.getElementById('notif-detail-body')!.innerHTML = `
    <p>${fresh.message}</p>
    <hr>
    <div class="d-flex gap-3 flex-wrap">
      <small class="text-muted">Data: ${new Date(fresh.date).toLocaleString('pl-PL')}</small>
      <span class="badge ${priorityBadgeClass(fresh.priority)}">${fresh.priority}</span>
      <span class="badge ${fresh.isRead ? 'bg-light text-muted border' : 'bg-primary'}">
        ${fresh.isRead ? 'Przeczytane' : 'Nieprzeczytane'}
      </span>
    </div>
  `

  const markReadBtn = document.getElementById('notif-detail-mark-read')!
  markReadBtn.style.display = fresh.isRead ? 'none' : 'inline-block'
  markReadBtn.onclick = async () => {
    await notificationService.markAsRead(id)
    await updateNotifBadge()
    if (currentView === 'notifications') await renderNotificationsList()
    markReadBtn.style.display = 'none'
  }

  // @ts-ignore
  new bootstrap.Modal(document.getElementById('notif-detail-modal')).show()
}

notifBadgeLink.addEventListener('click', async e => { e.preventDefault(); await showView('notifications') })
notifNavLink.addEventListener('click', async e => { e.preventDefault(); await showView('notifications') })
backToMainBtn.addEventListener('click', () => showView('main'))
markAllReadBtn.addEventListener('click', async () => {
  if (!currentUser) return
  await notificationService.markAllAsRead(currentUser.id)
  await updateNotifBadge()
  await renderNotificationsList()
})

// =====================
// WIDOK UŻYTKOWNIKÓW (admin)
// =====================

const ROLE_LABELS: Record<string, string> = {
  guest: 'Gość', developer: 'Developer', devops: 'DevOps', admin: 'Admin'
}

async function renderUsersView(): Promise<void> {
  if (!currentUser || currentUser.role !== 'admin') return

  const users = await authService.getAllUsers()

  if (users.length === 0) {
    usersListEl.innerHTML = '<p class="text-center text-muted">Brak użytkowników</p>'
    return
  }

  usersListEl.innerHTML = `
    <div class="table-responsive">
      <table class="table table-striped align-middle">
        <thead>
          <tr>
            <th>Imię i nazwisko</th>
            <th>Email</th>
            <th>Rola</th>
            <th>Status</th>
            <th>Akcje</th>
          </tr>
        </thead>
        <tbody>
          ${users.map(u => `
            <tr data-user-id="${u.id}">
              <td>${u.firstName} ${u.lastName}</td>
              <td class="small text-muted">${u.email}</td>
              <td>
                <select class="form-select form-select-sm role-select" style="width:auto"
                  ${u.id === currentUser!.id ? 'disabled title="Nie możesz zmienić własnej roli"' : ''}>
                  <option value="guest"      ${u.role === 'guest'     ? 'selected' : ''}>Gość</option>
                  <option value="developer"  ${u.role === 'developer' ? 'selected' : ''}>Developer</option>
                  <option value="devops"     ${u.role === 'devops'    ? 'selected' : ''}>DevOps</option>
                  <option value="admin"      ${u.role === 'admin'     ? 'selected' : ''}>Admin</option>
                </select>
              </td>
              <td>
                <span class="badge ${u.blocked ? 'bg-danger' : 'bg-success'}">
                  ${u.blocked ? 'Zablokowany' : 'Aktywny'}
                </span>
              </td>
              <td>
                ${u.id !== currentUser!.id ? `
                  <button class="btn btn-sm ${u.blocked ? 'btn-outline-success' : 'btn-outline-danger'} toggle-block">
                    ${u.blocked ? 'Odblokuj' : 'Zablokuj'}
                  </button>
                ` : '<small class="text-muted">(Ty)</small>'}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `

  usersListEl.querySelectorAll('.role-select').forEach(selectEl => {
    selectEl.addEventListener('change', async () => {
      const tr = selectEl.closest('tr') as HTMLElement
      const userId = tr.dataset.userId!
      const newRole = (selectEl as HTMLSelectElement).value as UserRole
      const allUsers = await authService.getAllUsers()
      const u = allUsers.find(x => x.id === userId)!
      const oldRole = u.role
      u.role = newRole
      await authService.updateUser(u)

      if (newRole !== oldRole) {
        await sendNotification({
          title: 'Zmiana roli',
          message: `Twoja rola została zmieniona z „${ROLE_LABELS[oldRole]}" na „${ROLE_LABELS[newRole]}".`,
          priority: 'medium',
          recipientId: userId
        })
      }
    })
  })

  usersListEl.querySelectorAll('.toggle-block').forEach(btn => {
    btn.addEventListener('click', async () => {
      const tr = btn.closest('tr') as HTMLElement
      const userId = tr.dataset.userId!
      const allUsers = await authService.getAllUsers()
      const u = allUsers.find(x => x.id === userId)!
      u.blocked = !u.blocked
      await authService.updateUser(u)
      await renderUsersView()
    })
  })
}

usersNavLink?.addEventListener('click', async e => { e.preventDefault(); await showView('users') })
backToMainFromUsersBtn?.addEventListener('click', () => showView('main'))

// =====================
// PROJEKTY
// =====================

async function renderProjects(): Promise<void> {
  projectList.innerHTML = ''
  const projects = await projectService.getAll()
  const activeProjectId = authService.getActiveProjectId()

  projects.forEach(project => {
    const div = document.createElement('div')
    div.className = `list-group-item d-flex justify-content-between ${project.id === activeProjectId ? 'active-project' : ''}`
    div.innerHTML = `
      <div class="project-info" style="cursor:pointer; flex:1">
        <b>${project.name}</b><br/>
        <small>${project.description}</small>
      </div>
      <div class="d-flex gap-1 align-items-start">
        <button class="btn btn-sm edit">✏️</button>
        <button class="btn btn-sm delete">🗑️</button>
      </div>
    `

    div.querySelector('.project-info')?.addEventListener('click', async () => {
      authService.setActiveProject(project.id)
      await renderProjects()
      await renderStories()
    })

    div.querySelector('.edit')?.addEventListener('click', e => {
      e.stopPropagation()
      editingProjectId = project.id
      nameInput.value = project.name
      descInput.value = project.description
      addBtn.innerText = 'Zapisz projekt'
    })

    div.querySelector('.delete')?.addEventListener('click', async e => {
      e.stopPropagation()
      await projectService.delete(project.id)
      await renderProjects()
      await renderStories()
    })

    projectList.appendChild(div)
  })
}

addBtn.addEventListener('click', async () => {
  if (!nameInput.value.trim() || !currentUser) return

  if (editingProjectId) {
    await projectService.update({
      id: editingProjectId,
      name: nameInput.value,
      description: descInput.value
    })
    editingProjectId = null
    addBtn.innerText = 'Dodaj projekt'
  } else {
    const newProject = {
      id: crypto.randomUUID(),
      name: nameInput.value,
      description: descInput.value
    }
    await projectService.create(newProject)

    const admins = await authService.getAdmins()
    await Promise.all(admins.map(admin =>
      sendNotification({
        title: 'Utworzono nowy projekt',
        message: `Projekt „${newProject.name}" został utworzony.`,
        priority: 'high',
        recipientId: admin.id
      })
    ))
  }

  nameInput.value = ''
  descInput.value = ''
  await renderProjects()
})

// =====================
// HISTORYJKI
// =====================

addStoryBtn.addEventListener('click', async () => {
  const projectId = authService.getActiveProjectId()
  if (!projectId) { alert('Najpierw wybierz projekt!'); return }
  if (!storyNameInput.value.trim() || !currentUser) return

  const newStory: Story = {
    id: crypto.randomUUID(),
    name: storyNameInput.value,
    description: storyDescInput.value,
    priority: storyPriority.value as Priority,
    projectId,
    ownerId: currentUser.id,
    createdAt: new Date().toISOString(),
    status: 'todo'
  }

  await storyService.create(newStory)
  storyNameInput.value = ''
  storyDescInput.value = ''
  await renderStories()
})

async function renderStories(): Promise<void> {
  const projectId = authService.getActiveProjectId()
  if (!projectId) {
    storySection.style.display = 'none'
    return
  }

  storySection.style.display = 'block'
  const stories = await storyService.getAll(projectId)

  const cols = {
    todo: document.getElementById('col-todo')!,
    doing: document.getElementById('col-doing')!,
    done: document.getElementById('col-done')!
  }
  Object.values(cols).forEach(c => c.innerHTML = '')

  stories.forEach(story => {
    const div = document.createElement('div')
    div.className = 'card p-2 mb-2'
    div.style.cursor = 'pointer'
    div.innerHTML = `
      <b>${story.name}</b>
      <small class="text-muted d-block">${story.description || ''}</small>
      <button class="btn btn-sm btn-outline-secondary next mt-1">➔</button>
    `

    div.addEventListener('click', async () => {
      selectedStoryId = story.id
      await renderTasks(story.id)
    })

    div.querySelector('.next')?.addEventListener('click', async e => {
      e.stopPropagation()
      const next: Record<Status, Status> = { todo: 'doing', doing: 'done', done: 'todo' }
      story.status = next[story.status]
      await storyService.update(story)
      await renderStories()
    })

    cols[story.status].appendChild(div)
  })
}

// =====================
// TASKI
// =====================

async function renderTasks(storyId: string): Promise<void> {
  const [tasks, allUsers] = await Promise.all([
    taskService.getByStory(storyId),
    authService.getAllUsers()
  ])

  const cols = {
    todo: document.getElementById('col-todo')!,
    doing: document.getElementById('col-doing')!,
    done: document.getElementById('col-done')!
  }
  Object.values(cols).forEach(c => c.innerHTML = '')

  tasks.forEach(task => {
    const div = document.createElement('div')
    const assigned = allUsers.find(u => u.id === task.assignedUserId)
    div.className = 'card p-2 mb-2'
    div.style.cursor = 'pointer'
    div.innerHTML = `
      <b>${task.name}</b><br/>
      <small class="text-muted">${assigned ? assigned.firstName : 'Brak osoby'}</small>
      <div class="d-flex gap-1 mt-1">
        <button class="btn btn-sm btn-success done-task">✓ Done</button>
        <button class="btn btn-sm btn-outline-danger delete-task">🗑️</button>
      </div>
    `

    div.addEventListener('click', async () => showTaskDetails(task))

    div.querySelector('.done-task')?.addEventListener('click', async e => {
      e.stopPropagation()
      await finishTask(task)
      await renderTasks(storyId)
    })

    div.querySelector('.delete-task')?.addEventListener('click', async e => {
      e.stopPropagation()
      await deleteTask(task)
      await renderTasks(storyId)
    })

    cols[task.status].appendChild(div)
  })
}

// =====================
// AKCJE TASKÓW
// =====================

async function assignUserToTask(task: Task, userId: string): Promise<void> {
  task.assignedUserId = userId
  task.status = 'doing'
  task.startedAt = new Date().toISOString()
  await taskService.update(task)

  const story = await storyService.getById(task.storyId)

  if (story) {
    await sendNotification({
      title: 'Zadanie w trakcie realizacji',
      message: `Task „${task.name}" w historyjce „${story.name}" jest teraz w trakcie realizacji.`,
      priority: 'low',
      recipientId: story.ownerId
    })
  }

  await sendNotification({
    title: 'Przypisano Cię do zadania',
    message: `Zostałeś przypisany do zadania „${task.name}"${story ? ` w historyjce „${story.name}"` : ''}.`,
    priority: 'high',
    recipientId: userId
  })
}

async function finishTask(task: Task): Promise<void> {
  task.status = 'done'
  task.finishedAt = new Date().toISOString()
  await taskService.update(task)

  const story = await storyService.getById(task.storyId)

  if (story) {
    await sendNotification({
      title: 'Zadanie ukończone',
      message: `Task „${task.name}" w historyjce „${story.name}" został oznaczony jako ukończony.`,
      priority: 'medium',
      recipientId: story.ownerId
    })
  }

  const tasks = await taskService.getByStory(task.storyId)
  const allDone = tasks.every(t => t.status === 'done')
  if (allDone && story) {
    story.status = 'done'
    await storyService.update(story)
  }
}

async function deleteTask(task: Task): Promise<void> {
  const story = await storyService.getById(task.storyId)
  await taskService.delete(task.id)

  if (story) {
    await sendNotification({
      title: 'Zadanie usunięte',
      message: `Task „${task.name}" został usunięty z historyjki „${story.name}".`,
      priority: 'medium',
      recipientId: story.ownerId
    })
  }
}

// =====================
// SZCZEGÓŁY TASKA (MODAL)
// =====================

async function showTaskDetails(task: Task): Promise<void> {
  selectedTask = task
  const allUsers = await authService.getAllUsers()
  const assigned = allUsers.find(u => u.id === task.assignedUserId)

  document.getElementById('taskDetails')!.innerHTML = `
    <p><strong>${task.name}</strong></p>
    <p class="text-muted">${task.description || '<em>Brak opisu</em>'}</p>
    <hr>
    <p>Status: <span class="badge bg-secondary">${task.status}</span></p>
    <p>Priorytet: <span class="badge ${priorityBadgeClass(task.priority)}">${task.priority}</span></p>
    <p>Szacowany czas: <strong>${task.estimatedTime}h</strong></p>
    <p>Przypisany: <strong>${assigned ? `${assigned.firstName} ${assigned.lastName}` : 'Brak'}</strong></p>
    ${task.createdAt ? `<p class="small text-muted">Utworzono: ${new Date(task.createdAt).toLocaleString('pl-PL')}</p>` : ''}
    ${task.startedAt ? `<p class="small text-muted">Rozpoczęto: ${new Date(task.startedAt).toLocaleString('pl-PL')}</p>` : ''}
    ${task.finishedAt ? `<p class="small text-muted">Ukończono: ${new Date(task.finishedAt).toLocaleString('pl-PL')}</p>` : ''}
  `
  // @ts-ignore
  new bootstrap.Modal(document.getElementById('taskModal')).show()
}

finishTaskBtn.addEventListener('click', async () => {
  if (!selectedTask) return
  await finishTask(selectedTask)
  if (selectedTask.storyId) await renderTasks(selectedTask.storyId)
  // @ts-ignore
  bootstrap.Modal.getInstance(document.getElementById('taskModal'))?.hide()
})

// =====================
// DODAWANIE TASKA
// =====================

addTaskBtn.addEventListener('click', async () => {
  if (!selectedStoryId) { alert('Najpierw wybierz historyjkę!'); return }
  if (!taskNameInput.value.trim() || !currentUser) return

  const task: Task = {
    id: crypto.randomUUID(),
    name: taskNameInput.value,
    description: taskDescInput.value,
    priority: taskPriorityInput.value as Priority,
    storyId: selectedStoryId,
    estimatedTime: Number(taskTimeInput.value) || 0,
    status: 'todo',
    createdAt: new Date().toISOString()
  }

  await taskService.create(task)

  const story = await storyService.getById(selectedStoryId)
  if (story) {
    await sendNotification({
      title: 'Nowe zadanie w historyjce',
      message: `Dodano zadanie „${task.name}" do historyjki „${story.name}".`,
      priority: 'medium',
      recipientId: story.ownerId
    })
  }

  if (taskUserSelect.value) {
    await assignUserToTask(task, taskUserSelect.value)
  }

  taskNameInput.value = ''
  taskDescInput.value = ''
  taskTimeInput.value = ''
  taskUserSelect.value = ''

  await renderTasks(selectedStoryId)
})

// =====================
// UŻYTKOWNICY (task assignment)
// =====================

async function loadUsers(): Promise<void> {
  const users = (await authService.getAllUsers()).filter(u => !u.blocked && u.role !== 'guest')
  taskUserSelect.innerHTML = '<option value="">Wybierz</option>'
  users.forEach(u => {
    const option = document.createElement('option')
    option.value = u.id
    option.textContent = `${u.firstName} (${u.role})`
    taskUserSelect.appendChild(option)
  })
}

// =====================
// MOTYW
// =====================

function setTheme(isDark: boolean): void {
  document.body.classList.toggle('dark', isDark)
  localStorage.setItem('theme', isDark ? 'dark' : 'light')
  themeToggle.checked = isDark
}

themeToggle.addEventListener('change', () => setTheme(themeToggle.checked))
setTheme(localStorage.getItem('theme') === 'dark')

// =====================
// INIT
// =====================

;(async () => {
  await initStorage()
  initGoogleAuth()
  await routeByRole()
})()
