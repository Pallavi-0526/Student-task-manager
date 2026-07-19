const BASE_URL = "https://student-task-manager-maoh.onrender.com";
const token = localStorage.getItem("token");
if (!token) { window.location.replace("./index.html"); }
const today = new Date().toISOString().split('T')[0];
const fullname = localStorage.getItem("fullname");
const welcomeMsg = document.getElementById("welcome-msg");
if (welcomeMsg && fullname) {
    welcomeMsg.textContent = `Hey! Welcome back, ${fullname} 👋`;
}

const navAvatar = document.getElementById("nav-avatar");
if (navAvatar) {
    fetch(`${BASE_URL}/auth/me`, {
        headers: { "Authorization": `Bearer ${token}` }
    }).then(res => res.ok ? res.json() : null)
      .then(user => {
          if (user && user.profile_picture) navAvatar.src = user.profile_picture;
      }).catch(() => {});
}

function createTaskCard(task) {
    const today = new Date().toISOString().split('T')[0];
    const isOverdue = task.deadline && task.deadline < today && !task.completed;

    const card = document.createElement('div');
    card.className = `card shadow-sm mb-2 ${isOverdue ? 'border-danger' : ''}`;
    card.dataset.id = task.id;
    card.draggable = true;
    card.innerHTML = `
        <div class="card-body">
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <span class="task-title-text ${task.completed ? 'text-decoration-line-through text-muted' : ''}" contenteditable="true" spellcheck="false" style="outline:none; cursor:text;" title="Click to edit">
                        ${task.title}
                    </span>
                    ${task._projectName ? `<span class="badge bg-secondary ms-1" style="font-size:10px">🔗 ${task._projectName}</span>` : ''}
                    ${task.deadline ? `<br><small class="text-muted">📅 ${task.deadline}</small>` : ''}
                    ${isOverdue ? '<br><small class="text-danger">⚠️ Overdue</small>' : ''}
                </div>
                <div class="d-flex gap-2 align-items-center">
                    ${task.completed ? '<span class="badge bg-success completed-badge">Completed</span>' : ''}
                    <button class="btn btn-outline-secondary btn-sm toggle-notes-btn" title="Notes">📝</button>
                    <button class="btn btn-outline-secondary btn-sm toggle-subtask-btn" title="Subtasks">📋</button>
                    ${!task.completed ? `<button class="btn btn-success btn-sm complete-task-btn" data-id="${task.id}">✓</button>` : ''}
                    <button class="btn btn-danger btn-sm delete-task-btn" data-id="${task.id}">🗑</button>
                </div>
            </div>
            <div class="notes-section mt-2" style="display:none;">
                <textarea class="form-control notes-input" rows="2" placeholder="Add a note...">${task.notes || ''}</textarea>
                <button class="btn btn-primary btn-sm save-notes-btn mt-1">Save Note</button>
            </div>
            <div class="subtask-section mt-2" style="display:none;">
                <div class="subtask-progress mb-2" style="display:${task.subtasks && task.subtasks.length > 0 ? 'block' : 'none'}">
                    <div class="d-flex justify-content-between mb-1">
                        <small class="subtask-count text-muted">0/${task.subtasks ? task.subtasks.length : 0} completed</small>
                    </div>
                    <div class="progress" style="height:6px;">
                        <div class="progress-bar bg-success subtask-bar" role="progressbar" style="width:0%"></div>
                    </div>
                </div>
                <ul class="list-group list-group-flush subtask-list mb-2"></ul>
                <div class="d-flex gap-2 mt-1">
                    <input type="text" class="form-control form-control-sm subtask-input" placeholder="Add subtask..."/>
                    <button class="btn btn-outline-primary btn-sm add-subtask-btn">Add</button>
                </div>
            </div>
        </div>
    `;

    const toggleNotesBtn = card.querySelector(".toggle-notes-btn");
    toggleNotesBtn.addEventListener("click", function() {
        const notesSection = card.querySelector(".notes-section");
        const isHidden = notesSection.style.display === "none";
        notesSection.style.display = isHidden ? "block" : "none";
        toggleNotesBtn.classList.toggle("btn-outline-secondary", !isHidden);
        toggleNotesBtn.classList.toggle("btn-warning", isHidden);
    });

    const saveNotesBtn = card.querySelector(".save-notes-btn");
    saveNotesBtn.addEventListener("click", async function() {
        const notes = card.querySelector(".notes-input").value;
        try {
            const res = await fetch(`${BASE_URL}/tasks/${task.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({ title: task.title, status: task.status, completed: task.completed, deadline: task.deadline || null, notes: notes })
            });
            if (res.ok) {
                task.notes = notes;
                saveNotesBtn.textContent = "Saved ✓";
                saveNotesBtn.classList.replace("btn-primary", "btn-success");
                setTimeout(() => { saveNotesBtn.textContent = "Save Note"; saveNotesBtn.classList.replace("btn-success", "btn-primary"); }, 1500);
            } else { alert("Could not save note!"); }
        } catch (error) { console.log("Error saving note:", error); }
    });

    const titleEl = card.querySelector(".task-title-text");
    let originalTitle = task.title;
    titleEl.addEventListener("keydown", function(e) {
        if (e.key === "Enter") { e.preventDefault(); titleEl.blur(); }
        if (e.key === "Escape") { titleEl.textContent = originalTitle; titleEl.blur(); }
    });
    titleEl.addEventListener("blur", async function() {
        const newTitle = titleEl.textContent.trim();
        if (newTitle === "" || newTitle === originalTitle) {
            titleEl.textContent = originalTitle;
            return;
        }
        try {
            const res = await fetch(`${BASE_URL}/tasks/${task.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({ title: newTitle, status: task.status, completed: task.completed, deadline: task.deadline || null, notes: task.notes || "" })
            });
            if (res.ok) {
                task.title = newTitle;
                originalTitle = newTitle;
            } else { titleEl.textContent = originalTitle; alert("Could not save title!"); }
        } catch (error) { titleEl.textContent = originalTitle; console.log("Error saving title:", error); }
    });

    const toggleSubtaskBtn = card.querySelector(".toggle-subtask-btn");
    toggleSubtaskBtn.addEventListener("click", function() {
        const section = card.querySelector(".subtask-section");
        const isHidden = section.style.display === "none";
        section.style.display = isHidden ? "block" : "none";
        toggleSubtaskBtn.classList.toggle("btn-outline-secondary", !isHidden);
        toggleSubtaskBtn.classList.toggle("btn-warning", isHidden);
        if (isHidden) renderSubtasks(card, task);
    });

    const addSubtaskBtn = card.querySelector(".add-subtask-btn");
    addSubtaskBtn.addEventListener("click", async function() {
        const input = card.querySelector(".subtask-input");
        const title = input.value.trim();
        if (!title) return;
        try {
            const res = await fetch(`${BASE_URL}/tasks/${task.id}/subtasks`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({ title })
            });
            if (res.ok) {
                const newSubtask = await res.json();
                task.subtasks = task.subtasks || [];
                task.subtasks.push(newSubtask);
                input.value = "";
                renderSubtasks(card, task);
            }
        } catch (e) { console.log("Error adding subtask:", e); }
    });

    card.querySelector(".subtask-input").addEventListener("keydown", function(e) {
        if (e.key === "Enter") card.querySelector(".add-subtask-btn").click();
    });

    function renderSubtasks(card, task) {
        const list = card.querySelector(".subtask-list");
        const bar = card.querySelector(".subtask-bar");
        const countEl = card.querySelector(".subtask-count");
        const progressDiv = card.querySelector(".subtask-progress");
        const subtasks = task.subtasks || [];
        list.innerHTML = "";
        subtasks.forEach(function(st) {
            const li = document.createElement("li");
            li.className = "list-group-item d-flex justify-content-between align-items-center px-0 py-1 bg-transparent border-0";
            li.innerHTML = `
                <span class="${st.completed ? 'text-decoration-line-through text-muted' : ''}" style="font-size:14px">${st.title}</span>
                <div class="d-flex gap-1">
                    <button class="btn btn-success btn-sm py-0 px-1" style="font-size:11px" data-stid="${st.id}">✓</button>
                    <button class="btn btn-danger btn-sm py-0 px-1" style="font-size:11px" data-stid="${st.id}">🗑</button>
                </div>
            `;
            li.querySelector(".btn-success").addEventListener("click", async function() {
                const res = await fetch(`${BASE_URL}/subtasks/${st.id}`, { method: "PUT", headers: { "Authorization": `Bearer ${token}` } });
                if (res.ok) { st.completed = !st.completed; renderSubtasks(card, task); }
            });
            li.querySelector(".btn-danger").addEventListener("click", async function() {
                const res = await fetch(`${BASE_URL}/subtasks/${st.id}`, { method: "DELETE", headers: { "Authorization": `Bearer ${token}` } });
                if (res.ok) { task.subtasks = task.subtasks.filter(s => s.id !== st.id); renderSubtasks(card, task); }
            });
            list.appendChild(li);
        });
        const done = subtasks.filter(s => s.completed).length;
        const total = subtasks.length;
        const pct = total > 0 ? Math.round((done / total) * 100) : 0;
        if (bar) bar.style.width = pct + "%";
        if (countEl) countEl.textContent = `${done}/${total} completed`;
        if (progressDiv) progressDiv.style.display = total > 0 ? "block" : "none";
    }

    if (task.subtasks && task.subtasks.length > 0) renderSubtasks(card, task);

    const completeBtn = card.querySelector(".complete-task-btn");
    if (completeBtn) {
        completeBtn.addEventListener("click", async function() {
            try {
                const res = await fetch(`${BASE_URL}/tasks/${task.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                    body: JSON.stringify({ title: task.title, status: "completed", completed: true, deadline: task.deadline || null })
                });
                if (res.ok) {
                    const rect = completeBtn.getBoundingClientRect();
                    confetti({
                        particleCount: 80,
                        spread: 60,
                        origin: {
                            x: rect.left / window.innerWidth,
                            y: rect.top / window.innerHeight
                        },
                        colors: ["#198754", "#0d6efd", "#ffc107", "#dc3545", "#6f42c1"]
                    });
                    loadTasks();
                } else { alert("Could not complete task!"); }
            } catch (error) { console.log("Error completing task:", error); }
        });
    }

    const deleteBtn = card.querySelector(".delete-task-btn");
    deleteBtn.addEventListener("click", async function() {
        try {
            const res = await fetch(`${BASE_URL}/tasks/${task.id}`, { method: "DELETE", headers: { "Authorization": `Bearer ${token}` } });
            if (res.ok) { loadTasks(); } else { alert("Could not delete task!"); }
        } catch (error) { console.log("Error deleting task:", error); }
    });

    return card;
}

function createProjectCard(project) {
    const today = new Date().toISOString().split('T')[0];
    const isOverdue = project.deadline && project.deadline < today && !project.completed;

    const newCard = document.createElement("div");
    newCard.className = "card shadow-sm mb-3";
    newCard.dataset.id = project.id;
    newCard.draggable = true;
    newCard.innerHTML = `
        <div class="card-body">
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <span class="project-name-text ${project.completed ? 'text-decoration-line-through text-muted' : ''}" contenteditable="true" spellcheck="false" style="outline:none; cursor:text;" title="Click to edit">${project.name}</span>
                    ${project.deadline ? `<br><small class="text-muted">📅 Due: ${project.deadline}</small>` : ''}
                    ${isOverdue ? '<br><small class="text-danger">⚠️ Overdue</small>' : ''}
                </div>
                <div class="d-flex gap-2 align-items-center">
                    ${project.completed ? '<span class="badge bg-success completed-badge">Completed</span>' : ''}
                    <button class="btn btn-outline-secondary btn-sm toggle-linked-tasks-btn" title="Linked Tasks">🔗</button>
                    <button class="btn btn-outline-secondary btn-sm toggle-notes-btn" title="Notes">📝</button>
                    <button class="btn btn-outline-secondary btn-sm toggle-subtask-btn" title="Subtasks">📋</button>
                    ${!project.completed ? `<button class="btn btn-success btn-sm complete-project-btn" data-id="${project.id}">✓</button>` : ''}
                    <button class="btn btn-danger btn-sm delete-project-btn">🗑</button>
                </div>
            </div>
            <div class="linked-tasks-section mt-2" style="display:none;">
                <div id="linked-tasks-${project.id}" class="ps-1"></div>
            </div>
            <div class="notes-section mt-2" style="display:none;">
                <textarea class="form-control notes-input" rows="2" placeholder="Add a note...">${project.notes || ''}</textarea>
                <button class="btn btn-primary btn-sm save-notes-btn mt-1">Save Note</button>
            </div>
            <div class="subtask-section mt-2" style="display:none;">
                <div class="subtask-progress mb-2" style="display:${project.subtasks && project.subtasks.length > 0 ? 'block' : 'none'}">
                    <div class="d-flex justify-content-between mb-1">
                        <small class="subtask-count text-muted">0/${project.subtasks ? project.subtasks.length : 0} completed</small>
                    </div>
                    <div class="progress" style="height:6px;">
                        <div class="progress-bar bg-success subtask-bar" role="progressbar" style="width:0%"></div>
                    </div>
                </div>
                <ul class="list-group list-group-flush subtask-list mb-2"></ul>
                <div class="d-flex gap-2 mt-1">
                    <input type="text" class="form-control form-control-sm subtask-input" placeholder="Add subtask..."/>
                    <button class="btn btn-outline-primary btn-sm add-subtask-btn">Add</button>
                </div>
            </div>
        </div>
    `;

    newCard.querySelector(".toggle-linked-tasks-btn").addEventListener("click", async function() {
        const section = newCard.querySelector(".linked-tasks-section");
        const isHidden = section.style.display === "none";
        section.style.display = isHidden ? "block" : "none";
        this.classList.toggle("btn-outline-secondary", !isHidden);
        this.classList.toggle("btn-warning", isHidden);
        if (isHidden) {
            const res = await fetch(`${BASE_URL}/tasks`, { headers: { "Authorization": `Bearer ${token}` } });
            if (res.ok) {
                const data = await res.json();
                const linked = data.tasks.filter(t => t.project_id === project.id);
                const container = newCard.querySelector(`#linked-tasks-${project.id}`);
                container.innerHTML = linked.length === 0
                    ? '<small class="text-muted">No tasks linked to this project yet.</small>'
                    : linked.map(t => `
                        <div class="d-flex align-items-center gap-2 mb-1">
                            <span class="badge ${t.completed ? 'bg-success' : 'bg-warning text-dark'}">${t.completed ? 'Done' : 'Pending'}</span>
                            <small class="${t.completed ? 'text-decoration-line-through text-muted' : ''}">${t.title}</small>
                            ${t.deadline ? `<small class="text-muted ms-auto">📅 ${t.deadline}</small>` : ''}
                        </div>`).join('');
            }
        }
    });

    const toggleNotesBtn = newCard.querySelector(".toggle-notes-btn");
    toggleNotesBtn.addEventListener("click", function() {
        const notesSection = newCard.querySelector(".notes-section");
        const isHidden = notesSection.style.display === "none";
        notesSection.style.display = isHidden ? "block" : "none";
        toggleNotesBtn.classList.toggle("btn-outline-secondary", !isHidden);
        toggleNotesBtn.classList.toggle("btn-warning", isHidden);
    });

    const saveNotesBtn = newCard.querySelector(".save-notes-btn");
    saveNotesBtn.addEventListener("click", async function() {
        const notes = newCard.querySelector(".notes-input").value;
        try {
            const res = await fetch(`${BASE_URL}/projects/${project.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({ name: project.name, description: project.description || "", deadline: project.deadline || null, notes: notes, completed: project.completed })
            });
            if (res.ok) {
                project.notes = notes;
                saveNotesBtn.textContent = "Saved ✓";
                saveNotesBtn.classList.replace("btn-primary", "btn-success");
                setTimeout(() => { saveNotesBtn.textContent = "Save Note"; saveNotesBtn.classList.replace("btn-success", "btn-primary"); }, 1500);
            } else { alert("Could not save note!"); }
        } catch (error) { console.log("Error saving note:", error); }
    });

    const nameEl = newCard.querySelector(".project-name-text");
    let originalName = project.name;
    nameEl.addEventListener("keydown", function(e) {
        if (e.key === "Enter") { e.preventDefault(); nameEl.blur(); }
        if (e.key === "Escape") { nameEl.textContent = originalName; nameEl.blur(); }
    });
    nameEl.addEventListener("blur", async function() {
        const newName = nameEl.textContent.trim();
        if (newName === "" || newName === originalName) {
            nameEl.textContent = originalName;
            return;
        }
        try {
            const res = await fetch(`${BASE_URL}/projects/${project.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({ name: newName, description: project.description || "", deadline: project.deadline || null, notes: project.notes || "", completed: project.completed })
            });
            if (res.ok) {
                project.name = newName;
                originalName = newName;
            } else { nameEl.textContent = originalName; alert("Could not save name!"); }
        } catch (error) { nameEl.textContent = originalName; console.log("Error saving name:", error); }
    });

    const toggleSubtaskBtn = newCard.querySelector(".toggle-subtask-btn");
    toggleSubtaskBtn.addEventListener("click", function() {
        const section = newCard.querySelector(".subtask-section");
        const isHidden = section.style.display === "none";
        section.style.display = isHidden ? "block" : "none";
        toggleSubtaskBtn.classList.toggle("btn-outline-secondary", !isHidden);
        toggleSubtaskBtn.classList.toggle("btn-warning", isHidden);
        if (isHidden) renderProjectSubtasks(newCard, project);
    });

    const addSubtaskBtn = newCard.querySelector(".add-subtask-btn");
    addSubtaskBtn.addEventListener("click", async function() {
        const input = newCard.querySelector(".subtask-input");
        const title = input.value.trim();
        if (!title) return;
        try {
            const res = await fetch(`${BASE_URL}/projects/${project.id}/subtasks`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({ title })
            });
            if (res.ok) {
                const newSubtask = await res.json();
                project.subtasks = project.subtasks || [];
                project.subtasks.push(newSubtask);
                input.value = "";
                renderProjectSubtasks(newCard, project);
            }
        } catch (e) { console.log("Error adding subtask:", e); }
    });

    newCard.querySelector(".subtask-input").addEventListener("keydown", function(e) {
        if (e.key === "Enter") newCard.querySelector(".add-subtask-btn").click();
    });

    function renderProjectSubtasks(card, project) {
        const list = card.querySelector(".subtask-list");
        const bar = card.querySelector(".subtask-bar");
        const countEl = card.querySelector(".subtask-count");
        const progressDiv = card.querySelector(".subtask-progress");
        const subtasks = project.subtasks || [];
        list.innerHTML = "";
        subtasks.forEach(function(st) {
            const li = document.createElement("li");
            li.className = "list-group-item d-flex justify-content-between align-items-center px-0 py-1 bg-transparent border-0";
            li.innerHTML = `
                <span class="${st.completed ? 'text-decoration-line-through text-muted' : ''}" style="font-size:14px">${st.title}</span>
                <div class="d-flex gap-1">
                    <button class="btn btn-success btn-sm py-0 px-1" style="font-size:11px" data-stid="${st.id}">✓</button>
                    <button class="btn btn-danger btn-sm py-0 px-1" style="font-size:11px" data-stid="${st.id}">🗑</button>
                </div>
            `;
            li.querySelector(".btn-success").addEventListener("click", async function() {
                const res = await fetch(`${BASE_URL}/project-subtasks/${st.id}`, { method: "PUT", headers: { "Authorization": `Bearer ${token}` } });
                if (res.ok) { st.completed = !st.completed; renderProjectSubtasks(card, project); }
            });
            li.querySelector(".btn-danger").addEventListener("click", async function() {
                const res = await fetch(`${BASE_URL}/project-subtasks/${st.id}`, { method: "DELETE", headers: { "Authorization": `Bearer ${token}` } });
                if (res.ok) { project.subtasks = project.subtasks.filter(s => s.id !== st.id); renderProjectSubtasks(card, project); }
            });
            list.appendChild(li);
        });
        const done = subtasks.filter(s => s.completed).length;
        const total = subtasks.length;
        const pct = total > 0 ? Math.round((done / total) * 100) : 0;
        if (bar) bar.style.width = pct + "%";
        if (countEl) countEl.textContent = `${done}/${total} completed`;
        if (progressDiv) progressDiv.style.display = total > 0 ? "block" : "none";
    }

    if (project.subtasks && project.subtasks.length > 0) renderProjectSubtasks(newCard, project);

    newCard.querySelector(".delete-project-btn").addEventListener("click", async function() {
        try {
            const res = await fetch(`${BASE_URL}/projects/${project.id}`, { method: "DELETE", headers: { "Authorization": `Bearer ${token}` } });
            if (res.ok) { loadProjects(); } else { alert("Could not delete project!"); }
        } catch (error) { console.log("Error deleting project:", error); }
    });

   const completeBtn = newCard.querySelector(".complete-project-btn");
    if (completeBtn) {
        completeBtn.addEventListener("click", async function() {
            try {
                const res = await fetch(`${BASE_URL}/projects/${project.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                    body: JSON.stringify({ name: project.name, description: project.description || "", deadline: project.deadline || null, notes: project.notes || "", completed: true })
                });
                if (res.ok) {
                    const rect = completeBtn.getBoundingClientRect();
                    confetti({
                        particleCount: 100,
                        spread: 70,
                        origin: {
                            x: rect.left / window.innerWidth,
                            y: rect.top / window.innerHeight
                        },
                        colors: ["#198754", "#0d6efd", "#ffc107", "#dc3545", "#6f42c1"]
                    });
                    loadProjects();
                } else { alert("Could not complete project!"); }
            } catch (error) { console.log("Error completing project:", error); }
        });
    }

    return newCard;
}

// ── Drag to Reorder ──────────────────────────────────────
function enableDragToReorder(listId, reorderUrl) {
    const list = document.getElementById(listId);
    if (!list) return;
    let dragSrc = null;

    list.addEventListener("dragstart", function(e) {
        if (e.target.closest("[contenteditable]")) { e.preventDefault(); return; }
        dragSrc = e.target.closest(".card");
        if (!dragSrc) return;
        dragSrc.style.opacity = "0.4";
        e.dataTransfer.effectAllowed = "move";
    });

    list.addEventListener("dragover", function(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        const target = e.target.closest(".card");
        if (target && target !== dragSrc) {
            const rect = target.getBoundingClientRect();
            const next = (e.clientY - rect.top) > (rect.height / 2);
            list.insertBefore(dragSrc, next ? target.nextSibling : target);
        }
    });

    list.addEventListener("dragend", async function() {
        if (!dragSrc) return;
        dragSrc.style.opacity = "";
        dragSrc = null;
        const cards = list.querySelectorAll(".card");
        const order = Array.from(cards).map(card => parseInt(card.dataset.id)).filter(Boolean);
        if (order.length === 0) return;
        try {
            await fetch(`${BASE_URL}${reorderUrl}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify(order)
            });
        } catch (e) { console.log("Reorder error:", e); }
    });
}

async function loadTasks() {
    try {
        let projectMap = {};
        const projRes = await fetch(`${BASE_URL}/projects`, { headers: { "Authorization": `Bearer ${token}` } });
        if (projRes.ok) {
            const projData = await projRes.json();
            projData.projects.forEach(p => { projectMap[p.id] = p.name; });
        }

        const response = await fetch(`${BASE_URL}/tasks`, { method: "GET", headers: { "Authorization": `Bearer ${token}` } });
        if (response.ok) {
            const data = await response.json();
            const taskList = document.getElementById("task-list");
            taskList.innerHTML = "";
            data.tasks.forEach(function(task) {
                task._projectName = task.project_id ? (projectMap[task.project_id] || null) : null;
                taskList.appendChild(createTaskCard(task));
            });
            enableDragToReorder("task-list", "/tasks/reorder");

            const today = new Date().toISOString().split('T')[0];
            const total = data.tasks.length;
            const completed = data.tasks.filter(t => t.completed).length;
            const overdue = data.tasks.filter(t => !t.completed && t.deadline && t.deadline < today).length;
            const pending = total - completed;
            const s = document.getElementById("tstat-total");
            if (s) {
                document.getElementById("tstat-total").textContent = total;
                document.getElementById("tstat-pending").textContent = pending;
                document.getElementById("tstat-completed").textContent = completed;
                document.getElementById("tstat-overdue").textContent = overdue;
            }
        } else if (response.status === 401) {
            localStorage.removeItem("token");
            window.location.replace("./index.html");
        }
    } catch (error) { console.log("Error loading tasks:", error); }
}

async function loadProjects() {
    try {
        const response = await fetch(`${BASE_URL}/projects`, { method: "GET", headers: { "Authorization": `Bearer ${token}` } });
        if (response.ok) {
            const data = await response.json();
            const projectList = document.getElementById("project-list");
            projectList.innerHTML = "";
            data.projects.forEach(function(project) {
                projectList.appendChild(createProjectCard(project));
            });
            enableDragToReorder("project-list", "/projects/reorder");

            const ptoday = new Date().toISOString().split('T')[0];
            const ptotal = data.projects.length;
            const pcompleted = data.projects.filter(p => p.completed).length;
            const poverdue = data.projects.filter(p => !p.completed && p.deadline && p.deadline < ptoday).length;
            const ppending = ptotal - pcompleted;
            const ps = document.getElementById("pstat-total");
            if (ps) {
                document.getElementById("pstat-total").textContent = ptotal;
                document.getElementById("pstat-pending").textContent = ppending;
                document.getElementById("pstat-completed").textContent = pcompleted;
                document.getElementById("pstat-overdue").textContent = poverdue;
            }
            const taskProjectSelect = document.getElementById("task-project-select");
            if (taskProjectSelect) {
                const current = taskProjectSelect.value;
                taskProjectSelect.innerHTML = '<option value="">No project</option>';
                data.projects.forEach(function(p) {
                    const opt = document.createElement("option");
                    opt.value = p.id;
                    opt.textContent = p.name;
                    taskProjectSelect.appendChild(opt);
                });
                taskProjectSelect.value = current;
            }
        } else if (response.status === 401) {
            localStorage.removeItem("token");
            window.location.replace("./index.html");
        }
    } catch (error) { console.log("Error loading projects:", error); }
}

loadTasks();
loadProjects();

function filterTasks(type) {
    const cards = document.querySelectorAll("#task-list .card");
    const today = new Date().toISOString().split('T')[0];
    document.querySelectorAll("[id^='filter-']").forEach(btn => {
        btn.classList.remove("active");
        btn.classList.add("btn-outline-secondary");
    });
    document.getElementById(`filter-${type}`).classList.add("active");
    cards.forEach(card => {
        const deadlineEl = card.querySelector("small.text-muted");
        const deadline = deadlineEl ? deadlineEl.textContent.match(/\d{4}-\d{2}-\d{2}/) : null;
        const titleEl = card.querySelector("span");
        const isCompleted = !!card.querySelector(".completed-badge") || (titleEl && titleEl.classList.contains("text-decoration-line-through"));
        const isOverdue = deadline && deadline[0] < today && !isCompleted;
        if (type === "all") card.style.display = "";
        else if (type === "pending") card.style.display = !isCompleted ? "" : "none";
        else if (type === "completed") card.style.display = isCompleted ? "" : "none";
        else if (type === "overdue") card.style.display = isOverdue ? "" : "none";
    });
}

function searchTasks(query) {
    const cards = document.querySelectorAll("#task-list .card");
    cards.forEach(card => {
        const title = card.querySelector("span").textContent.toLowerCase();
        card.style.display = title.includes(query.toLowerCase()) ? "" : "none";
    });
}

function filterProjects(type) {
    const cards = document.querySelectorAll("#project-list .card");
    document.querySelectorAll("[id^='pfilter-']").forEach(btn => btn.classList.remove("active"));
    document.getElementById(`pfilter-${type}`).classList.add("active");
    cards.forEach(card => {
        const completedBadge = card.querySelector(".completed-badge");
        const deadlineEl = card.querySelector("small.text-muted");
        const deadline = deadlineEl ? deadlineEl.textContent.match(/\d{4}-\d{2}-\d{2}/) : null;
        const isCompleted = !!completedBadge;
        const isOverdue = deadline && deadline[0] < today && !isCompleted;
        if (type === "all") card.style.display = "";
        else if (type === "pending") card.style.display = !isCompleted ? "" : "none";
        else if (type === "completed") card.style.display = isCompleted ? "" : "none";
        else if (type === "overdue") card.style.display = isOverdue ? "" : "none";
    });
}

function searchProjects(query) {
    const cards = document.querySelectorAll("#project-list .card");
    cards.forEach(card => {
        const name = card.querySelector("span").textContent.toLowerCase();
        card.style.display = name.includes(query.toLowerCase()) ? "" : "none";
    });
}

document.getElementById("add-task-btn").addEventListener("click", async function() {
    const taskName = document.getElementById("task-title").value;
    const deadline = document.getElementById("task-deadline").value;
    const projectIdEl = document.getElementById("task-project-select");
    const projectId = projectIdEl ? projectIdEl.value : "";
    if (taskName === "") { alert("Please enter a task name"); return; }
    try {
        const response = await fetch(`${BASE_URL}/tasks`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            body: JSON.stringify({ title: taskName, status: "pending", deadline: deadline || null, project_id: projectId ? parseInt(projectId) : null })
        });
        if (response.ok) {
            document.getElementById("task-title").value = "";
            document.getElementById("task-deadline").value = "";
            const psel = document.getElementById("task-project-select");
            if (psel) psel.value = "";
            loadTasks();
        } else if (response.status === 401) { localStorage.removeItem("token"); window.location.replace("./index.html"); }
    } catch (error) { console.log("Error adding task:", error); }
});

document.getElementById("add-project-btn").addEventListener("click", async function() {
    const projectName = document.getElementById("project-input").value;
    const deadline = document.getElementById("project-deadline").value;
    if (projectName === "") { alert("Please enter a project name"); return; }
    try {
        const response = await fetch(`${BASE_URL}/projects`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            body: JSON.stringify({ name: projectName, description: "", deadline: deadline || null })
        });
        if (response.ok) {
            document.getElementById("project-input").value = "";
            document.getElementById("project-deadline").value = "";
            loadProjects();
        } else if (response.status === 401) { localStorage.removeItem("token"); window.location.replace("./index.html"); }
    } catch (error) { console.log("Error adding project:", error); }
});

document.getElementById("logout-btn").addEventListener("click", function() {
    localStorage.removeItem("token");
    localStorage.removeItem("fullname");
    localStorage.removeItem("profile_picture");
    window.location.replace("./index.html");
});

// ── Dark / Light mode toggle ─────────────────────────────
const themeToggle = document.getElementById("theme-toggle");
if (localStorage.getItem("theme") === "light") {
    document.body.classList.add("light-mode");
    themeToggle.textContent = "☀️";
}
themeToggle.addEventListener("click", function() {
    const isLight = document.body.classList.toggle("light-mode");
    themeToggle.textContent = isLight ? "☀️" : "🌙";
    localStorage.setItem("theme", isLight ? "light" : "dark");
});

// ── CSV Export ───────────────────────────────────────────
function downloadCSV(url, filename) {
    fetch(url, { headers: { "Authorization": `Bearer ${token}` } })
        .then(res => { if (!res.ok) throw new Error("Export failed"); return res.blob(); })
        .then(blob => {
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = filename;
            a.click();
            URL.revokeObjectURL(a.href);
        }).catch(e => alert("Could not export: " + e.message));
}
document.getElementById("export-tasks-btn").addEventListener("click", () => downloadCSV(`${BASE_URL}/export/tasks`, "tasks.csv"));
document.getElementById("export-projects-btn").addEventListener("click", () => downloadCSV(`${BASE_URL}/export/projects`, "projects.csv"));

// ── Pomodoro Timer ───────────────────────────────────────
(function() {
    const MODES = {
        work:  { minutes: 25, color: "bg-danger" },
        short: { minutes: 5,  color: "bg-success" },
        long:  { minutes: 15, color: "bg-primary" }
    };
    let currentMode = "work", totalSeconds = 25*60, remainingSeconds = 25*60;
    let timerInterval = null, isRunning = false;
    let sessionsToday = parseInt(localStorage.getItem("pomo_sessions_today") || "0");
    const todayStr = new Date().toISOString().split("T")[0];
    if (localStorage.getItem("pomo_last_date") !== todayStr) {
        sessionsToday = 0;
        localStorage.setItem("pomo_sessions_today", "0");
        localStorage.setItem("pomo_last_date", todayStr);
    }

    const display = document.getElementById("pomo-display");
    const progressBar = document.getElementById("pomo-progress");
    const startBtn = document.getElementById("pomo-start-btn");
    const resetBtn = document.getElementById("pomo-reset-btn");
    const taskSelect = document.getElementById("pomo-task-select");
    const taskLabel = document.getElementById("pomo-task-label");
    const sessionCount = document.getElementById("pomo-session-count");
    const toggleBtn = document.getElementById("toggle-pomodoro-btn");

    toggleBtn.addEventListener("click", function() {
        const float = document.getElementById("pomodoro-float");
        const isHidden = float.style.display === "none" || float.style.display === "";
        float.style.display = isHidden ? "block" : "none";
        if (isHidden) populatePomodoroSelect();
    });

    document.getElementById("close-pomodoro-btn").addEventListener("click", function() {
        document.getElementById("pomodoro-float").style.display = "none";
    });

    function updateDisplay() {
        const m = Math.floor(remainingSeconds / 60).toString().padStart(2, "0");
        const s = (remainingSeconds % 60).toString().padStart(2, "0");
        display.textContent = `${m}:${s}`;
        progressBar.style.width = ((remainingSeconds / totalSeconds) * 100) + "%";
        sessionCount.textContent = `${sessionsToday} session${sessionsToday !== 1 ? "s" : ""} today`;
    }

    function setMode(mode) {
        clearInterval(timerInterval); timerInterval = null; isRunning = false;
        currentMode = mode;
        totalSeconds = MODES[mode].minutes * 60;
        remainingSeconds = totalSeconds;
        startBtn.textContent = "▶ Start";
        progressBar.className = "progress-bar " + MODES[mode].color;
        ["work","short","long"].forEach(m => document.getElementById(`pomo-mode-${m}`).classList.remove("active"));
        document.getElementById(`pomo-mode-${mode}`).classList.add("active");
        updateDisplay();
    }

    function tick() {
        if (remainingSeconds <= 0) {
            clearInterval(timerInterval); timerInterval = null; isRunning = false;
            startBtn.textContent = "▶ Start";
            if (currentMode === "work") {
                sessionsToday++;
                localStorage.setItem("pomo_sessions_today", sessionsToday.toString());
                localStorage.setItem("pomo_last_date", todayStr);
            }
            updateDisplay();
            if (Notification.permission === "granted") {
                new Notification("Pomodoro Timer", { body: currentMode === "work" ? "Work session done! Take a break 🎉" : "Break over! Time to focus 🍅" });
            }
            setTimeout(() => setMode(currentMode === "work" ? (sessionsToday % 4 === 0 ? "long" : "short") : "work"), 500);
            return;
        }
        remainingSeconds--;
        updateDisplay();
    }

    startBtn.addEventListener("click", function() {
        if (isRunning) { clearInterval(timerInterval); timerInterval = null; isRunning = false; startBtn.textContent = "▶ Start"; }
        else { if (Notification.permission === "default") Notification.requestPermission(); timerInterval = setInterval(tick, 1000); isRunning = true; startBtn.textContent = "⏸ Pause"; }
    });
    resetBtn.addEventListener("click", () => setMode(currentMode));
    document.getElementById("pomo-mode-work").addEventListener("click", () => setMode("work"));
    document.getElementById("pomo-mode-short").addEventListener("click", () => setMode("short"));
    document.getElementById("pomo-mode-long").addEventListener("click", () => setMode("long"));
    taskSelect.addEventListener("change", function() {
        taskLabel.textContent = taskSelect.value ? `Focusing on: ${taskSelect.options[taskSelect.selectedIndex].text}` : "No task selected";
    });

    async function populatePomodoroSelect() {
        taskSelect.innerHTML = '<option value="">— none —</option>';
        const taskRes = await fetch(`${BASE_URL}/tasks`, { headers: { "Authorization": `Bearer ${token}` } });
        if (taskRes.ok) {
            const data = await taskRes.json();
            const pending = data.tasks.filter(t => !t.completed);
            if (pending.length > 0) {
                const g = document.createElement("optgroup"); g.label = "📋 Tasks";
                pending.forEach(t => { const o = document.createElement("option"); o.value = "task-"+t.id; o.textContent = t.title; g.appendChild(o); });
                taskSelect.appendChild(g);
            }
        }
        const projRes = await fetch(`${BASE_URL}/projects`, { headers: { "Authorization": `Bearer ${token}` } });
        if (projRes.ok) {
            const data = await projRes.json();
            const pending = data.projects.filter(p => !p.completed);
            if (pending.length > 0) {
                const g = document.createElement("optgroup"); g.label = "📁 Projects";
                pending.forEach(p => { const o = document.createElement("option"); o.value = "project-"+p.id; o.textContent = p.name; g.appendChild(o); });
                taskSelect.appendChild(g);
            }
        }
    }

    setInterval(function() {
        document.title = isRunning
            ? `🍅 ${Math.floor(remainingSeconds/60).toString().padStart(2,"0")}:${(remainingSeconds%60).toString().padStart(2,"0")} — Student Task Manager`
            : "Dashboard - Student Task Manager";
    }, 1000);

    updateDisplay();
})();

// ── Due Date Reminders ───────────────────────────────────
(function() {
    const bell = document.getElementById("reminder-bell");
    const bellDot = document.getElementById("reminder-dot");

    async function requestPermission() {
        if (Notification.permission === "default") {
            const result = await Notification.requestPermission();
            updateBell(result === "granted");
        } else { updateBell(Notification.permission === "granted"); }
    }

    function updateBell(granted) {
        if (bell) { bell.title = granted ? "Reminders on" : "Click to enable reminders"; bell.style.opacity = granted ? "1" : "0.4"; }
    }

    bell.addEventListener("click", function() {
        if (Notification.permission !== "granted") Notification.requestPermission().then(p => updateBell(p === "granted"));
        else alert("Reminders are enabled! You'll be notified for tasks/projects due today, tomorrow, or overdue.");
    });

    function checkDeadlines() {
        if (Notification.permission !== "granted") return;
        const now = new Date();
        const today = now.toISOString().split("T")[0];
        const tomorrow = new Date(now); tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split("T")[0];

        fetch(`${BASE_URL}/tasks`, { headers: { "Authorization": `Bearer ${token}` } })
            .then(r => r.ok ? r.json() : null).then(data => {
                if (!data) return;
                data.tasks.filter(t => !t.completed && t.deadline).forEach(task => {
                    const key = `notified_task_${task.id}_${today}`;
                    if (localStorage.getItem(key)) return;
                    if (task.deadline < today) new Notification("⚠️ Overdue Task", { body: `"${task.title}" was due on ${task.deadline}` });
                    else if (task.deadline === today) new Notification("📅 Due Today", { body: `Task: "${task.title}" is due today!` });
                    else if (task.deadline === tomorrowStr) new Notification("🔔 Due Tomorrow", { body: `Task: "${task.title}" is due tomorrow` });
                    else return;
                    localStorage.setItem(key, "1");
                });
            }).catch(() => {});

        fetch(`${BASE_URL}/projects`, { headers: { "Authorization": `Bearer ${token}` } })
            .then(r => r.ok ? r.json() : null).then(data => {
                if (!data) return;
                data.projects.filter(p => !p.completed && p.deadline).forEach(project => {
                    const key = `notified_project_${project.id}_${today}`;
                    if (localStorage.getItem(key)) return;
                    if (project.deadline < today) new Notification("⚠️ Overdue Project", { body: `"${project.name}" was due on ${project.deadline}` });
                    else if (project.deadline === today) new Notification("📅 Project Due Today", { body: `"${project.name}" is due today!` });
                    else if (project.deadline === tomorrowStr) new Notification("🔔 Project Due Tomorrow", { body: `"${project.name}" is due tomorrow` });
                    else return;
                    localStorage.setItem(key, "1");
                });
            }).catch(() => {});

        fetch(`${BASE_URL}/tasks`, { headers: { "Authorization": `Bearer ${token}` } })
            .then(r => r.ok ? r.json() : null).then(data => {
                if (!data || !bellDot) return;
                const today = new Date().toISOString().split("T")[0];
                bellDot.style.display = data.tasks.some(t => !t.completed && t.deadline && t.deadline <= today) ? "block" : "none";
            }).catch(() => {});
    }

    requestPermission().then(() => checkDeadlines());
    setInterval(checkDeadlines, 60 * 1000);
})();

// ── Keyboard Shortcuts ───────────────────────────────────
(function() {
    // Don't fire shortcuts when typing in inputs or contenteditable
    function isTyping() {
        const el = document.activeElement;
        return el && (
            el.tagName === "INPUT" ||
            el.tagName === "TEXTAREA" ||
            el.tagName === "SELECT" ||
            el.isContentEditable
        );
    }

    document.addEventListener("keydown", function(e) {
        if (isTyping()) return;

        switch(e.key) {
            case "n":
            case "N":
                e.preventDefault();
                document.getElementById("task-title").focus();
                break;

            case "p":
            case "P":
                e.preventDefault();
                document.getElementById("project-input").focus();
                break;

            case "f":
            case "F":
                e.preventDefault();
                document.getElementById("task-search").focus();
                break;

            case "/":
                e.preventDefault();
                document.getElementById("project-search").focus();
                break;

            case "d":
            case "D":
                e.preventDefault();
                document.getElementById("theme-toggle").click();
                break;

            case "Escape":
                document.activeElement.blur();
                document.getElementById("pomodoro-float").style.display = "none";
                break;

            case "?":
                toggleShortcutsHelp();
                break;
        }
    });

    // Shortcuts help overlay
    function toggleShortcutsHelp() {
        let overlay = document.getElementById("shortcuts-overlay");
        if (overlay) { overlay.remove(); return; }

        overlay = document.createElement("div");
        overlay.id = "shortcuts-overlay";
        overlay.style.cssText = `
            position:fixed; inset:0; background:rgba(0,0,0,0.6);
            display:flex; align-items:center; justify-content:center;
            z-index:9999; cursor:pointer;
        `;
        overlay.innerHTML = `
            <div style="background:var(--bg-card,#fff); color:var(--text-card,#212529);
                border-radius:16px; padding:2rem; min-width:320px; max-width:440px;
                box-shadow:0 8px 32px rgba(0,0,0,0.2);">
                <h5 class="mb-3">⌨️ Keyboard Shortcuts</h5>
                <table class="table table-sm mb-0">
                    <tbody>
                        <tr><td><kbd>N</kbd></td><td>New task</td></tr>
                        <tr><td><kbd>P</kbd></td><td>New project</td></tr>
                        <tr><td><kbd>F</kbd></td><td>Search tasks</td></tr>
                        <tr><td><kbd>/</kbd></td><td>Search projects</td></tr>
                        <tr><td><kbd>D</kbd></td><td>Toggle dark mode</td></tr>
                        <tr><td><kbd>Esc</kbd></td><td>Close / unfocus</td></tr>
                        <tr><td><kbd>?</kbd></td><td>Show this help</td></tr>
                    </tbody>
                </table>
                <p class="text-muted small mt-3 mb-0">Click anywhere to close</p>
            </div>
        `;
        overlay.addEventListener("click", () => overlay.remove());
        document.body.appendChild(overlay);
    }
})();

// ── Onboarding ───────────────────────────────────────────
(function() {
    if (localStorage.getItem("onboarded")) return;

    const steps = [
        {
            icon: "👋",
            title: `Welcome, ${fullname || "there"}!`,
            body: "This is your Student Task Manager — a personal workspace to stay on top of your assignments, projects and study goals."
        },
        {
            icon: "🚀",
            title: "What you can do",
            body: `
                <ul class="text-start mt-2" style="font-size:14px;">
                    <li>📋 Create <b>tasks</b> and <b>projects</b></li>
                    <li>✅ Track progress with subtasks & stats</li>
                    <li>🔗 Link tasks to projects</li>
                    <li>🍅 Use the Pomodoro timer to focus</li>
                    <li>🔔 Get deadline reminders</li>
                    <li>⌨️ Use keyboard shortcuts (press <kbd>?</kbd>)</li>
                </ul>
            `
        },
        {
            icon: "🎯",
            title: "You're all set!",
            body: "Press <b>N</b> to add your first task, or <b>P</b> to create a project. Good luck with your studies! 🎓"
        }
    ];

    let current = 0;

    const overlay = document.createElement("div");
    overlay.style.cssText = `
        position:fixed; inset:0; background:rgba(0,0,0,0.6);
        display:flex; align-items:center; justify-content:center;
        z-index:9999;
    `;

    function render() {
        const step = steps[current];
        const isLast = current === steps.length - 1;
        overlay.innerHTML = `
            <div style="background:var(--bg-card,#fff); color:var(--text-card,#212529);
                border-radius:20px; padding:2.5rem; max-width:420px; width:90%;
                box-shadow:0 8px 40px rgba(0,0,0,0.25); text-align:center;">
                <div style="font-size:3rem; margin-bottom:0.5rem;">${step.icon}</div>
                <h4 class="mb-3">${step.title}</h4>
                <div class="mb-4" style="font-size:14px; line-height:1.7;">${step.body}</div>
                <div class="d-flex justify-content-center gap-2 mb-4">
                    ${steps.map((_, i) => `
                        <div style="width:8px;height:8px;border-radius:50%;
                            background:${i === current ? '#0d6efd' : '#dee2e6'};"></div>
                    `).join('')}
                </div>
                <div class="d-flex gap-2 justify-content-center">
                    ${current > 0 ? `<button class="btn btn-outline-secondary" id="ob-back">← Back</button>` : ''}
                    <button class="btn btn-primary px-4" id="ob-next">
                        ${isLast ? "Let's go! 🎉" : "Next →"}
                    </button>
                    ${!isLast ? `<button class="btn btn-link text-muted" id="ob-skip" style="font-size:13px;">Skip</button>` : ''}
                </div>
            </div>
        `;

        overlay.querySelector("#ob-next").addEventListener("click", function() {
            if (isLast) { dismiss(); }
            else { current++; render(); }
        });

        const backBtn = overlay.querySelector("#ob-back");
        if (backBtn) backBtn.addEventListener("click", function() { current--; render(); });

        const skipBtn = overlay.querySelector("#ob-skip");
        if (skipBtn) skipBtn.addEventListener("click", dismiss);
    }

    function dismiss() {
        localStorage.setItem("onboarded", "1");
        overlay.remove();
    }

    render();
    document.body.appendChild(overlay);
})();
