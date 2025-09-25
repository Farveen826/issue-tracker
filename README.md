# Issue Tracker

A full-stack issue tracking application built as part of a hiring assignment.

## Tech Stack
- **Backend**: Python Flask with REST APIs
- **Frontend**: Angular with TypeScript
- **Database**: In-memory storage (for demo purposes)

## Features
- ✅ View issues in a professional table interface
- ✅ Search issues by title
- ✅ Filter by status, priority, and assignee  
- ✅ Sort by any column (ascending/descending)
- ✅ Pagination with configurable page size
- ✅ Create new issues with validation
- ✅ Edit existing issues
- ✅ View detailed issue information
- ✅ RESTful API with full CRUD operations

## API Endpoints
- `GET /health` - Health check
- `GET /issues` - Get all issues (supports search, filters, sorting, pagination)
- `GET /issues/:id` - Get single issue
- `POST /issues` - Create new issue
- `PUT /issues/:id` - Update existing issue

## Setup Instructions

### Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
python app.py