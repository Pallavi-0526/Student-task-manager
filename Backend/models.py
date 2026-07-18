from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    fullname = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    profile_picture = Column(String, nullable=True)
    tasks = relationship("Task", back_populates="owner")
    projects = relationship("Project", back_populates="owner")
    activity_logs = relationship("ActivityLog", back_populates="owner")

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, default="")
    deadline = Column(String, nullable=True)
    completed = Column(Boolean, default=False)
    notes = Column(String, nullable=True, default="")
    display_order = Column(Integer, default=0)
    owner_id = Column(Integer, ForeignKey("users.id"))
    tasks = relationship("Task", back_populates="project")
    subtasks = relationship("ProjectSubtask", back_populates="parent_project", cascade="all, delete-orphan")
    owner = relationship("User", back_populates="projects")

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    status = Column(String, default="pending")
    completed = Column(Boolean, default=False)
    deadline = Column(String, nullable=True)
    notes = Column(String, nullable=True, default="")
    display_order = Column(Integer, default=0)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id"))
    subtasks = relationship("Subtask", back_populates="parent_task", cascade="all, delete-orphan")
    owner = relationship("User", back_populates="tasks")
    project = relationship("Project", back_populates="tasks")

class Subtask(Base):
    __tablename__ = "subtasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    completed = Column(Boolean, default=False)
    parent_task_id = Column(Integer, ForeignKey("tasks.id"))
    parent_task = relationship("Task", back_populates="subtasks")

class ProjectSubtask(Base):
    __tablename__ = "project_subtasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    completed = Column(Boolean, default=False)
    parent_project_id = Column(Integer, ForeignKey("projects.id"))
    parent_project = relationship("Project", back_populates="subtasks")

class ActivityLog(Base):
    __tablename__ = "activity_logs"
 
    id = Column(Integer, primary_key=True, index=True)
    action = Column(String, nullable=False)        # e.g. "task_created"
    description = Column(String, nullable=False)   # e.g. "Created task 'SS Lab'"
    timestamp = Column(String, nullable=False)     # ISO string
    owner_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("User", back_populates="activity_logs")