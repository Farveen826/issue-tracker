from flask import Flask, request, jsonify
from flask_cors import CORS
from models import storage, Issue
import math

app = Flask(__name__)
CORS(app)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok"})

@app.route('/issues', methods=['GET'])
def get_issues():
    # Get query parameters
    search = request.args.get('search', '').lower()
    status_filter = request.args.get('status', '')
    priority_filter = request.args.get('priority', '')
    assignee_filter = request.args.get('assignee', '')
    sort_by = request.args.get('sortBy', 'id')
    sort_order = request.args.get('sortOrder', 'asc')
    page = int(request.args.get('page', 1))
    page_size = int(request.args.get('pageSize', 10))
    
    # Get all issues
    issues = storage.get_all_issues()
    
    # Apply search
    if search:
        issues = [issue for issue in issues if search in issue.title.lower()]
    
    # Apply filters
    if status_filter:
        issues = [issue for issue in issues if issue.status == status_filter]
    
    if priority_filter:
        issues = [issue for issue in issues if issue.priority == priority_filter]
    
    if assignee_filter:
        issues = [issue for issue in issues if issue.assignee == assignee_filter]
    
    # Apply sorting
    reverse = sort_order == 'desc'
    if sort_by == 'title':
        issues.sort(key=lambda x: x.title.lower(), reverse=reverse)
    elif sort_by == 'status':
        issues.sort(key=lambda x: x.status, reverse=reverse)
    elif sort_by == 'priority':
        priority_order = {'Low': 1, 'Medium': 2, 'High': 3}
        issues.sort(key=lambda x: priority_order.get(x.priority, 0), reverse=reverse)
    elif sort_by == 'assignee':
        issues.sort(key=lambda x: x.assignee, reverse=reverse)
    elif sort_by == 'updatedAt':
        issues.sort(key=lambda x: x.updated_at, reverse=reverse)
    else:  # Default to ID
        issues.sort(key=lambda x: x.id, reverse=reverse)
    
    # Calculate pagination
    total = len(issues)
    start = (page - 1) * page_size
    end = start + page_size
    paginated_issues = issues[start:end]
    
    # Convert to dict format
    issues_data = [issue.to_dict() for issue in paginated_issues]
    
    return jsonify({
        'issues': issues_data,
        'pagination': {
            'page': page,
            'pageSize': page_size,
            'total': total,
            'totalPages': math.ceil(total / page_size)
        }
    })

@app.route('/issues/<int:issue_id>', methods=['GET'])
def get_issue(issue_id):
    issue = storage.get_issue(issue_id)
    if not issue:
        return jsonify({'error': 'Issue not found'}), 404
    
    return jsonify(issue.to_dict())

@app.route('/issues', methods=['POST'])
def create_issue():
    data = request.get_json()
    
    if not data or 'title' not in data:
        return jsonify({'error': 'Title is required'}), 400
    
    issue = Issue(
        title=data['title'],
        description=data.get('description', ''),
        status=data.get('status', 'Open'),
        priority=data.get('priority', 'Medium'),
        assignee=data.get('assignee', '')
    )
    
    created_issue = storage.add_issue(issue)
    return jsonify(created_issue.to_dict()), 201

@app.route('/issues/<int:issue_id>', methods=['PUT'])
def update_issue(issue_id):
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    updated_issue = storage.update_issue(issue_id, data)
    if not updated_issue:
        return jsonify({'error': 'Issue not found'}), 404
    
    return jsonify(updated_issue.to_dict())

@app.route('/issues/<int:issue_id>', methods=['DELETE'])
def delete_issue(issue_id):
    issue = storage.get_issue(issue_id)
    if not issue:
        return jsonify({'error': 'Issue not found'}), 404
    
    storage.delete_issue(issue_id)
    return jsonify({'message': 'Issue deleted successfully'})

if __name__ == '__main__':
    app.run(debug=True, port=5000)