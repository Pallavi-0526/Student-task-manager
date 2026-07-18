from pydantic import BaseModel
from typing import Optional

class TaskCreate(BaseModel):
    title: str
    status: str = "pending"
    deadline: Optional[str] = None
    notes: Optional[str] = ""
    completed: bool = False
    project_id: Optional[int] = None

class TaskUpdate(BaseModel):
    title: str
    status: str = "pending"
    completed: bool = False
    deadline: Optional[str] = None
    notes: Optional[str] = ""
    project_id: Optional[int] = None

class TaskResponse(BaseModel):
    id: int
    title: str
    status: str
    completed: bool
    deadline: Optional[str] = None
    notes: Optional[str] = ""
    project_id: Optional[int] = None
    subtasks: list["SubtaskResponse"] = []

    class Config:
        from_attributes = True

class ProjectCreate(BaseModel):
    name: str
    description: str = ""
    deadline: Optional[str] = None
    notes: Optional[str] = ""
    completed: bool = False

class ProjectResponse(BaseModel):
    id: int
    name: str
    description: str
    deadline: Optional[str] = None
    completed: bool = False
    notes: Optional[str] = ""

    class Config:
        from_attributes = True

class SubtaskCreate(BaseModel):
    title: str

class SubtaskResponse(BaseModel):
    id: int
    title: str
    completed: bool
    parent_task_id: int

    class Config:
        from_attributes = True

class ProjectSubtaskCreate(BaseModel):
    title: str

class ProjectSubtaskResponse(BaseModel):
    id: int
    title: str
    completed: bool
    parent_project_id: int

    class Config:
        from_attributes = True

class ActivityLogResponse(BaseModel):
    id: int
    action: str
    description: str
    timestamp: str

    class Config:
        from_attributes = True

class UserCreate(BaseModel):
    fullname: str
    email: str
    password: str

class UserResponse(BaseModel):
    id: int
    fullname: str
    email: str
    profile_picture: Optional[str] = None

    class Config:
        from_attributes = True

class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UpdateProfilePicture(BaseModel):
    profile_picture: str

class UpdateName(BaseModel):
    fullname: str

class ChangePassword(BaseModel):
    current_password: str
    new_password: str
