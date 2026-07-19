from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
import csv
import io
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import List
import models
import schemas
import auth
from database import engine, get_db

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500",
        "https://student-task-manager-frontend-kfbc.onrender.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    token = credentials.credentials
    payload = auth.verify_token(token)
    if payload is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
    email = payload.get("sub")
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user

from datetime import datetime
 
def log_activity(db, user_id: int, action: str, description: str):
    entry = models.ActivityLog(
        action=action,
        description=description,
        timestamp=datetime.utcnow().isoformat(),
        owner_id=user_id
    )
    db.add(entry)
    db.commit()

# ─── AUTH ENDPOINTS ─────────────────────────────

@app.post("/auth/register", response_model=schemas.UserResponse)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == user.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    new_user = models.User(
        fullname=user.fullname,
        email=user.email,
        hashed_password=auth.hash_password(user.password)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/auth/login", response_model=schemas.TokenResponse)
def login(request: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == request.email).first()
    if not user or not auth.verify_password(request.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    token = auth.create_access_token({"sub": user.email})
    return {"access_token": token, "token_type": "bearer"}

@app.get("/auth/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user

@app.get("/")
def home():
    return {"message": "Student Task Manager API is running!"}

# ─── TASK ENDPOINTS ─────────────────────────────

@app.get("/tasks")
def get_tasks(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    tasks = db.query(models.Task).filter(
        models.Task.owner_id == current_user.id
    ).order_by(models.Task.display_order).all()
    return {"tasks": tasks}

@app.post("/tasks", response_model=schemas.TaskResponse)
def create_task(task: schemas.TaskCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Set display_order to max + 1
    max_order = db.query(models.Task).filter(models.Task.owner_id == current_user.id).count()
    new_task = models.Task(
        title=task.title,
        status=task.status,
        deadline=task.deadline,
        notes=task.notes,
        completed=False,
        project_id=task.project_id,
        display_order=max_order,
        owner_id=current_user.id
    )
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    log_activity(db, current_user.id, "task_created", f"Created task '{new_task.title}'")
    return new_task

@app.put("/tasks/{task_id}", response_model=schemas.TaskResponse)
def update_task(task_id: int, task: schemas.TaskUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    existing_task = db.query(models.Task).filter(
        models.Task.id == task_id, models.Task.owner_id == current_user.id
    ).first()
    if not existing_task:
        raise HTTPException(status_code=404, detail="Task not found")
    existing_task.title = task.title
    existing_task.status = task.status
    existing_task.completed = task.completed
    existing_task.deadline = task.deadline
    existing_task.notes = task.notes
    existing_task.project_id = task.project_id
    db.commit()
    db.refresh(existing_task)
    if task.completed and not existing_task.completed:
        log_activity(db, current_user.id, "task_completed", f"Completed task '{existing_task.title}'")
    else:
        log_activity(db, current_user.id, "task_updated", f"Updated task '{existing_task.title}'")
    return existing_task

@app.put("/tasks/reorder", response_model=None)
def reorder_tasks(order: List[int], db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    for index, task_id in enumerate(order):
        db.query(models.Task).filter(
            models.Task.id == task_id,
            models.Task.owner_id == current_user.id
        ).update({"display_order": index})
    db.commit()
    return {"message": "Tasks reordered"}

@app.delete("/tasks/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    task = db.query(models.Task).filter(
        models.Task.id == task_id, models.Task.owner_id == current_user.id
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(task)
    log_activity(db, current_user.id, "task_deleted", f"Deleted task '{task.title}'")
    db.commit()
    return {"message": "Task deleted successfully"}

# ─── PROJECT ENDPOINTS ──────────────────────────

@app.get("/projects")
def get_projects(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    projects = db.query(models.Project).filter(
        models.Project.owner_id == current_user.id
    ).order_by(models.Project.display_order).all()
    return {"projects": projects}

@app.post("/projects", response_model=schemas.ProjectResponse)
def create_project(project: schemas.ProjectCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    max_order = db.query(models.Project).filter(models.Project.owner_id == current_user.id).count()
    new_project = models.Project(
        name=project.name,
        description=project.description,
        deadline=project.deadline,
        notes=project.notes,
        completed=False,
        display_order=max_order,
        owner_id=current_user.id
    )
    db.add(new_project)
    db.commit()
    db.refresh(new_project)
    log_activity(db, current_user.id, "project_created", f"Created project '{new_project.name}'")
    return new_project

@app.put("/projects/reorder", response_model=None)
def reorder_projects(order: List[int], db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    for index, project_id in enumerate(order):
        db.query(models.Project).filter(
            models.Project.id == project_id,
            models.Project.owner_id == current_user.id
        ).update({"display_order": index})
    db.commit()
    return {"message": "Projects reordered"}

@app.put("/projects/{project_id}", response_model=schemas.ProjectResponse)
def update_project(project_id: int, project: schemas.ProjectCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    existing_project = db.query(models.Project).filter(
        models.Project.id == project_id, models.Project.owner_id == current_user.id
    ).first()
    if not existing_project:
        raise HTTPException(status_code=404, detail="Project not found")
    existing_project.name = project.name
    existing_project.completed = project.completed
    existing_project.notes = project.notes
    db.commit()
    db.refresh(existing_project)
    if project.completed and not existing_project.completed:
        log_activity(db, current_user.id, "project_completed", f"Completed project '{existing_project.name}'")
    else:
        log_activity(db, current_user.id, "project_updated", f"Updated project '{existing_project.name}'")
    return existing_project

@app.delete("/projects/{project_id}")
def delete_project(project_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    project = db.query(models.Project).filter(
        models.Project.id == project_id, models.Project.owner_id == current_user.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    db.delete(project)
    log_activity(db, current_user.id, "project_deleted", f"Deleted project '{project.name}'")
    db.commit()
    return {"message": "Project deleted successfully"}

# ─── SUBTASK ENDPOINTS ──────────────────────────────────

@app.post("/tasks/{task_id}/subtasks", response_model=schemas.SubtaskResponse)
def create_subtask(task_id: int, subtask: schemas.SubtaskCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    task = db.query(models.Task).filter(models.Task.id == task_id, models.Task.owner_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    new_subtask = models.Subtask(title=subtask.title, completed=False, parent_task_id=task_id)
    db.add(new_subtask)
    db.commit()
    db.refresh(new_subtask)
    return new_subtask

@app.put("/subtasks/{subtask_id}", response_model=schemas.SubtaskResponse)
def complete_subtask(subtask_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    subtask = db.query(models.Subtask).filter(models.Subtask.id == subtask_id).first()
    if not subtask:
        raise HTTPException(status_code=404, detail="Subtask not found")
    subtask.completed = not subtask.completed
    db.commit()
    db.refresh(subtask)
    return subtask

@app.delete("/subtasks/{subtask_id}")
def delete_subtask(subtask_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    subtask = db.query(models.Subtask).filter(models.Subtask.id == subtask_id).first()
    if not subtask:
        raise HTTPException(status_code=404, detail="Subtask not found")
    db.delete(subtask)
    db.commit()
    return {"message": "Subtask deleted"}

# ─── PROJECT SUBTASK ENDPOINTS ──────────────────────────

@app.post("/projects/{project_id}/subtasks", response_model=schemas.ProjectSubtaskResponse)
def create_project_subtask(project_id: int, subtask: schemas.ProjectSubtaskCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    project = db.query(models.Project).filter(models.Project.id == project_id, models.Project.owner_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    new_subtask = models.ProjectSubtask(title=subtask.title, completed=False, parent_project_id=project_id)
    db.add(new_subtask)
    db.commit()
    db.refresh(new_subtask)
    return new_subtask

@app.put("/project-subtasks/{subtask_id}", response_model=schemas.ProjectSubtaskResponse)
def complete_project_subtask(subtask_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    subtask = db.query(models.ProjectSubtask).filter(models.ProjectSubtask.id == subtask_id).first()
    if not subtask:
        raise HTTPException(status_code=404, detail="Subtask not found")
    subtask.completed = not subtask.completed
    db.commit()
    db.refresh(subtask)
    return subtask

@app.delete("/project-subtasks/{subtask_id}")
def delete_project_subtask(subtask_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    subtask = db.query(models.ProjectSubtask).filter(models.ProjectSubtask.id == subtask_id).first()
    if not subtask:
        raise HTTPException(status_code=404, detail="Subtask not found")
    db.delete(subtask)
    db.commit()
    return {"message": "Subtask deleted"}

# ─── EXPORT ENDPOINTS ───────────────────────────────────

@app.get("/export/tasks")
def export_tasks_csv(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    tasks = db.query(models.Task).filter(models.Task.owner_id == current_user.id).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Title", "Status", "Completed", "Deadline", "Notes"])
    for task in tasks:
        writer.writerow([task.id, task.title, task.status, "Yes" if task.completed else "No", task.deadline or "", task.notes or ""])
    output.seek(0)
    return StreamingResponse(iter([output.getvalue()]), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=tasks.csv"})

@app.get("/export/projects")
def export_projects_csv(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    projects = db.query(models.Project).filter(models.Project.owner_id == current_user.id).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Name", "Description", "Completed", "Deadline", "Notes"])
    for project in projects:
        writer.writerow([project.id, project.name, project.description or "", "Yes" if project.completed else "No", project.deadline or "", project.notes or ""])
    output.seek(0)
    return StreamingResponse(iter([output.getvalue()]), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=projects.csv"})

# ─── AUTH UPDATE ENDPOINTS ───────────────────────────────

@app.put("/auth/update-name", response_model=schemas.UserResponse)
def update_name(data: schemas.UpdateName, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    current_user.fullname = data.fullname
    db.commit()
    db.refresh(current_user)
    return current_user

@app.put("/auth/change-password")
def change_password(data: schemas.ChangePassword, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if not auth.verify_password(data.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    current_user.hashed_password = auth.hash_password(data.new_password)
    db.commit()
    return {"message": "Password changed successfully"}

@app.put("/auth/update-picture", response_model=schemas.UserResponse)
def update_picture(data: schemas.UpdateProfilePicture, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    current_user.profile_picture = data.profile_picture
    db.commit()
    db.refresh(current_user)
    return current_user

@app.get("/activity", response_model=list[schemas.ActivityLogResponse])
def get_activity(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    logs = db.query(models.ActivityLog).filter(
        models.ActivityLog.owner_id == current_user.id
    ).order_by(models.ActivityLog.id.desc()).limit(50).all()
    return logs