import React, { useEffect, useMemo, useState } from "react";

// Tipos
type TaskStatus = "pending" | "progress" | "completed";
type TaskPriority = "low" | "medium" | "high";
type AuthMode = "login" | "register";

interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
}

interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  tasks: Task[];
}

interface TaskFormState {
  title: string;
  description: string;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
}

interface AuthFormState {
  name: string;
  email: string;
  password: string;
}

//Iconos SVG minimalistas 
const IconCheck: React.FC = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IconClock: React.FC = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const IconPlay: React.FC = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 3l14 9-14 9V3z" />
  </svg>
);

const IconCheckCircle: React.FC = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const IconList: React.FC = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 6h11M9 12h11M9 18h11" />
    <circle cx="4" cy="6" r="1" fill="currentColor" stroke="none" />
    <circle cx="4" cy="12" r="1" fill="currentColor" stroke="none" />
    <circle cx="4" cy="18" r="1" fill="currentColor" stroke="none" />
  </svg>
);

// Constantes 
const STORAGE_KEYS = {
  users: "taskflow_users_v1",
  session: "taskflow_session_v1",
};

const STATUS_LABELS: Record<TaskStatus, string> = {
  pending: "Pendiente",
  progress: "En progreso",
  completed: "Completada",
};

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "Baja",
  medium: "Media",
  high: "Alta",
};

const STATUS_ORDER: TaskStatus[] = ["pending", "progress", "completed"];

const EMPTY_TASK: TaskFormState = {
  title: "",
  description: "",
  dueDate: "",
  priority: "medium",
  status: "pending",
};

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function uid() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

// Componente principal
export default function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [sessionEmail, setSessionEmail] = useState<string>("");
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [authForm, setAuthForm] = useState<AuthFormState>({
    name: "",
    email: "",
    password: "",
  });
  const [authError, setAuthError] = useState<string>("");

  const [taskForm, setTaskForm] = useState<TaskFormState>(EMPTY_TASK);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [search, setSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  useEffect(() => {
    const savedUsers = readJSON<User[]>(STORAGE_KEYS.users, []);
    const savedSession = localStorage.getItem(STORAGE_KEYS.session) ?? "";
    setUsers(savedUsers);
    setSessionEmail(savedSession);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (sessionEmail) {
      localStorage.setItem(STORAGE_KEYS.session, sessionEmail);
    } else {
      localStorage.removeItem(STORAGE_KEYS.session);
    }
  }, [sessionEmail]);

  const currentUser = useMemo(
    () => users.find((user) => user.email === sessionEmail) ?? null,
    [users, sessionEmail]
  );

  const tasks = currentUser?.tasks ?? [];

  const filteredTasks = useMemo(() => {
    const text = search.trim().toLowerCase();
    return tasks.filter((task) => {
      const matchesText =
        !text ||
        task.title.toLowerCase().includes(text) ||
        task.description.toLowerCase().includes(text);
      const matchesStatus =
        statusFilter === "all" || task.status === statusFilter;
      const matchesPriority =
        priorityFilter === "all" || task.priority === priorityFilter;
      return matchesText && matchesStatus && matchesPriority;
    });
  }, [tasks, search, statusFilter, priorityFilter]);

  const groupedTasks = useMemo(() => {
    return STATUS_ORDER.reduce<Record<TaskStatus, Task[]>>(
      (acc, status) => {
        acc[status] = filteredTasks.filter((task) => task.status === status);
        return acc;
      },
      { pending: [], progress: [], completed: [] }
    );
  }, [filteredTasks]);

  function updateCurrentUserTasks(nextTasks: Task[]) {
    setUsers((prevUsers) =>
      prevUsers.map((user) =>
        user.email === sessionEmail ? { ...user, tasks: nextTasks } : user
      )
    );
  }

  function resetTaskForm() {
    setTaskForm(EMPTY_TASK);
    setEditingId(null);
  }

  function handleAuthChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setAuthForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleAuthSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAuthError("");

    const name = authForm.name.trim();
    const email = authForm.email.trim().toLowerCase();
    const password = authForm.password.trim();

    if (!email || !password) {
      setAuthError("Completa correo y contraseña.");
      return;
    }

    if (authMode === "register") {
      if (!name) {
        setAuthError("Ingresa tu nombre.");
        return;
      }
      if (password.length < 6) {
        setAuthError("La contraseña debe tener al menos 6 caracteres.");
        return;
      }
      if (users.some((user) => user.email === email)) {
        setAuthError("Ese correo ya está registrado.");
        return;
      }
      const newUser: User = { id: uid(), name, email, password, tasks: [] };
      setUsers((prev) => [...prev, newUser]);
      setSessionEmail(email);
      setAuthForm({ name: "", email: "", password: "" });
      setAuthMode("login");
      return;
    }

    const user = users.find(
      (item) => item.email === email && item.password === password
    );
    if (!user) {
      setAuthError("Credenciales inválidas.");
      return;
    }
    setSessionEmail(email);
    setAuthForm({ name: "", email: "", password: "" });
  }

  function handleLogout() {
    setSessionEmail("");
    setSearch("");
    setStatusFilter("all");
    setPriorityFilter("all");
    resetTaskForm();
  }

  function handleTaskChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    const { name, value } = e.target;
    setTaskForm((prev) => ({ ...prev, [name]: value } as TaskFormState));
  }

  function handleTaskSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const title = taskForm.title.trim();
    if (!title) return;

    const nextTask: Task = {
      id: editingId ?? uid(),
      title,
      description: taskForm.description.trim(),
      dueDate: taskForm.dueDate,
      priority: taskForm.priority,
      status: taskForm.status,
    };

    const nextTasks = editingId
      ? tasks.map((task) => (task.id === editingId ? nextTask : task))
      : [nextTask, ...tasks];

    updateCurrentUserTasks(nextTasks);
    resetTaskForm();
  }

  function handleEdit(task: Task) {
    setEditingId(task.id);
    setTaskForm({
      title: task.title,
      description: task.description,
      dueDate: task.dueDate,
      priority: task.priority,
      status: task.status,
    });
  }

  function handleDelete(taskId: string) {
    const confirmed = window.confirm("¿Seguro que deseas eliminar esta tarea?");
    if (!confirmed) return;
    updateCurrentUserTasks(tasks.filter((task) => task.id !== taskId));
    if (editingId === taskId) resetTaskForm();
  }

  function handleToggleComplete(task: Task) {
    const nextStatus: TaskStatus =
      task.status === "completed" ? "pending" : "completed";
    updateCurrentUserTasks(
      tasks.map((item) =>
        item.id === task.id ? { ...item, status: nextStatus } : item
      )
    );
  }

  function handleStatusChange(taskId: string, status: TaskStatus) {
    updateCurrentUserTasks(
      tasks.map((task) => (task.id === taskId ? { ...task, status } : task))
    );
  }

  function handlePriorityChange(taskId: string, priority: TaskPriority) {
    updateCurrentUserTasks(
      tasks.map((task) => (task.id === taskId ? { ...task, priority } : task))
    );
  }

  // Vista de autenticación 
  if (!currentUser) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="brand">
            <div className="brand-icon">
              <IconCheck />
            </div>
            <div>
              <h1 className="brand-title">TodoTareas</h1>
              <p className="brand-subtitle">
                Organiza tus tareas de forma simple y rápida.
              </p>
            </div>
          </div>

          <div className="tab-row">
            <button
              type="button"
              className={authMode === "login" ? "tab tab-active" : "tab"}
              onClick={() => {
                setAuthMode("login");
                setAuthError("");
              }}
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              className={authMode === "register" ? "tab tab-active" : "tab"}
              onClick={() => {
                setAuthMode("register");
                setAuthError("");
              }}
            >
              Registrarse
            </button>
          </div>

          <form className="form" onSubmit={handleAuthSubmit}>
            {authMode === "register" && (
              <input
                name="name"
                value={authForm.name}
                onChange={handleAuthChange}
                placeholder="Nombre completo"
                className="input"
              />
            )}
            <input
              name="email"
              type="email"
              value={authForm.email}
              onChange={handleAuthChange}
              placeholder="Correo electrónico"
              className="input"
            />
            <input
              name="password"
              type="password"
              value={authForm.password}
              onChange={handleAuthChange}
              placeholder="Contraseña"
              className="input"
            />
            {authError && <div className="error-box">{authError}</div>}
            <button type="submit" className="btn btn-primary">
              {authMode === "login" ? "Entrar" : "Crear cuenta"}
            </button>
          </form>

          <p className="auth-note">
            Datos guardados localmente con{" "}
            <strong>localStorage</strong>.
          </p>
        </div>
      </div>
    );
  }

  // Vista principal
  return (
    <div className="app-shell">
      <header className="header">
        <div>
          <h1 className="page-title">TodoTareas</h1>
          <p className="page-subtitle">
            Hola, <strong>{currentUser.name}</strong>. Gestiona tus tareas desde
            un solo lugar.
          </p>
        </div>
        <button type="button" onClick={handleLogout} className="btn btn-secondary">
          Cerrar sesión
        </button>
      </header>

      {/* ── Estadísticas ── */}
      <section className="stats-grid">
        <div className="stat-card pending-card">
          <div className="stat-icon">
            <IconClock />
          </div>
          <div>
            <h3>Pendientes</h3>
            <p className="stat-number">
              {tasks.filter((t) => t.status === "pending").length}
            </p>
          </div>
        </div>

        <div className="stat-card progress-card">
          <div className="stat-icon">
            <IconPlay />
          </div>
          <div>
            <h3>En progreso</h3>
            <p className="stat-number">
              {tasks.filter((t) => t.status === "progress").length}
            </p>
          </div>
        </div>

        <div className="stat-card completed-card">
          <div className="stat-icon">
            <IconCheckCircle />
          </div>
          <div>
            <h3>Completadas</h3>
            <p className="stat-number">
              {tasks.filter((t) => t.status === "completed").length}
            </p>
          </div>
        </div>

        <div className="stat-card total-card">
          <div className="stat-icon">
            <IconList />
          </div>
          <div>
            <h3>Total</h3>
            <p className="stat-number">{tasks.length}</p>
          </div>
        </div>
      </section>

      {/* ── Formulario + Filtros ── */}
      <main className="top-grid">
        <section className="panel">
          <h2 className="section-title">
            {editingId ? "Editar tarea" : "Nueva tarea"}
          </h2>
          <form className="form" onSubmit={handleTaskSubmit}>
            <input
              name="title"
              value={taskForm.title}
              onChange={handleTaskChange}
              placeholder="Título de la tarea"
              className="input"
            />
            <textarea
              name="description"
              value={taskForm.description}
              onChange={handleTaskChange}
              placeholder="Descripción (opcional)"
              rows={4}
              className="textarea"
            />
            <div className="grid-2">
              <input
                name="dueDate"
                type="date"
                value={taskForm.dueDate}
                onChange={handleTaskChange}
                className="input"
              />
              <select
                name="priority"
                value={taskForm.priority}
                onChange={handleTaskChange}
                className="input"
              >
                <option value="low">Prioridad baja</option>
                <option value="medium">Prioridad media</option>
                <option value="high">Prioridad alta</option>
              </select>
            </div>
            <select
              name="status"
              value={taskForm.status}
              onChange={handleTaskChange}
              className="input"
            >
              <option value="pending">Pendiente</option>
              <option value="progress">En progreso</option>
              <option value="completed">Completada</option>
            </select>
            <div className="button-row">
              <button type="submit" className="btn btn-primary">
                {editingId ? "Guardar cambios" : "Crear tarea"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetTaskForm}
                  className="btn btn-ghost"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="panel">
          <h2 className="section-title">Buscar y filtrar</h2>
          <div className="form">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por título o descripción…"
              className="input"
            />
            <div className="grid-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input"
              >
                <option value="all">Todos los estados</option>
                <option value="pending">Pendiente</option>
                <option value="progress">En progreso</option>
                <option value="completed">Completada</option>
              </select>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="input"
              >
                <option value="all">Todas las prioridades</option>
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
              </select>
            </div>
          </div>
        </section>
      </main>

      <section className="task-columns">
        {STATUS_ORDER.map((status) => (
          <div className="column" key={status}>
            <div className="column-header">
              <h3>{STATUS_LABELS[status]}</h3>
              <span className="count-badge">{groupedTasks[status].length}</span>
            </div>

            {groupedTasks[status].length === 0 ? (
              <div className="empty-state">Sin tareas en esta columna.</div>
            ) : (
              groupedTasks[status].map((task) => (
                <article className="task-card" key={task.id}>
                  <div className="task-top">
                    <div>
                      <h4 className="task-title">{task.title}</h4>
                      <p className="task-description">
                        {task.description || "Sin descripción"}
                      </p>
                    </div>
                    <span className={`priority-badge priority-${task.priority}`}>
                      {PRIORITY_LABELS[task.priority]}
                    </span>
                  </div>

                  <div className="meta-row">
                    <span>Vence: {task.dueDate || "Sin fecha"}</span>
                    <span>{STATUS_LABELS[task.status]}</span>
                  </div>

                  <div className="task-actions">
                    <button
                      type="button"
                      onClick={() => handleEdit(task)}
                      className="btn btn-light"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(task.id)}
                      className="btn btn-danger"
                    >
                      Eliminar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleComplete(task)}
                      className="btn btn-light"
                    >
                      {task.status === "completed"
                        ? "Marcar pendiente"
                        : "Completar"}
                    </button>
                  </div>

                  <div className="inline-controls">
                    <select
                      value={task.status}
                      onChange={(e) =>
                        handleStatusChange(task.id, e.target.value as TaskStatus)
                      }
                      className="inline-select"
                    >
                      <option value="pending">Pendiente</option>
                      <option value="progress">En progreso</option>
                      <option value="completed">Completada</option>
                    </select>
                    <select
                      value={task.priority}
                      onChange={(e) =>
                        handlePriorityChange(
                          task.id,
                          e.target.value as TaskPriority
                        )
                      }
                      className="inline-select"
                    >
                      <option value="low">Baja</option>
                      <option value="medium">Media</option>
                      <option value="high">Alta</option>
                    </select>
                  </div>
                </article>
              ))
            )}
          </div>
        ))}
      </section>
    </div>
  );
}
