from datetime import datetime
import json

class Issue:
    def __init__(self, title, description, status="Open", priority="Medium", assignee=""):
        self.id = None
        self.title = title
        self.description = description
        self.status = status
        self.priority = priority
        self.assignee = assignee
        self.created_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'status': self.status,
            'priority': self.priority,
            'assignee': self.assignee,
            'createdAt': self.created_at.isoformat() + 'Z',
            'updatedAt': self.updated_at.isoformat() + 'Z'
        }
    
    def update(self, data):
        if 'title' in data:
            self.title = data['title']
        if 'description' in data:
            self.description = data['description']
        if 'status' in data:
            self.status = data['status']
        if 'priority' in data:
            self.priority = data['priority']
        if 'assignee' in data:
            self.assignee = data['assignee']
        self.updated_at = datetime.utcnow()

# In-memory storage (replace with database in production)
class IssueStorage:
    def __init__(self):
        self.issues = []
        self.next_id = 1
        self._init_sample_data()
    
    def _init_sample_data(self):
        # Add some sample data
        sample_issues = [
            Issue("Login page not working", "Users cannot login to the application", "Open", "High", "john.doe"),
            Issue("Add dark mode", "Implement dark mode theme for the application", "In Progress", "Medium", "jane.smith"),
            Issue("Fix mobile responsiveness", "Mobile view is broken on some pages", "Open", "Low", ""),
            Issue("Database optimization", "Improve query performance", "Closed", "High", "mike.johnson"),
            Issue("Add user registration", "Allow new users to register", "Open", "Medium", "sarah.wilson")
        ]
        
        for issue in sample_issues:
            self.add_issue(issue)
    
    def add_issue(self, issue):
        issue.id = self.next_id
        self.next_id += 1
        self.issues.append(issue)
        return issue
    
    def get_issue(self, issue_id):
        return next((issue for issue in self.issues if issue.id == issue_id), None)
    
    def get_all_issues(self):
        return self.issues
    
    def update_issue(self, issue_id, data):
        issue = self.get_issue(issue_id)
        if issue:
            issue.update(data)
            return issue
        return None
    
    def delete_issue(self, issue_id):
        self.issues = [issue for issue in self.issues if issue.id != issue_id]

storage = IssueStorage()