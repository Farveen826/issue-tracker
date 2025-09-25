import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface Issue {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  assignee: string;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse {
  issues: Issue[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalIssues: number;
    pageSize: number;
  };
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div style="padding: 20px; background: #f8f9fa; min-height: 100vh; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <!-- Header -->
      <header style="text-align: center; margin-bottom: 30px; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h1 style="color: #2c3e50; margin: 0; font-size: 2.5em;">Issue Tracker</h1>
        <p style="color: #7f8c8d; margin: 10px 0 0 0;">Manage and track your project issues</p>
      </header>

      <!-- Controls Section -->
      <div style="background: white; padding: 25px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 20px;">
        <!-- Search and Create Button Row -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 15px;">
          <div style="flex: 1; min-width: 300px;">
            <input 
              type="text" 
              [(ngModel)]="searchTerm" 
              (input)="onSearchChange()"
              placeholder="Search issues by title..."
              style="width: 100%; padding: 12px; border: 2px solid #e9ecef; border-radius: 8px; font-size: 16px; transition: border-color 0.3s;">
          </div>
          <button 
            (click)="openCreateModal()"
            style="background: #28a745; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; transition: all 0.3s; white-space: nowrap;">
            + Create Issue
          </button>
        </div>

        <!-- Filters Row -->
        <div style="display: flex; gap: 15px; flex-wrap: wrap; align-items: center;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <label style="font-weight: 600; color: #495057;">Status:</label>
            <select 
              [(ngModel)]="statusFilter" 
              (change)="applyFilters()"
              style="padding: 8px 12px; border: 2px solid #e9ecef; border-radius: 6px; background: white;">
              <option value="">All Statuses</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          <div style="display: flex; align-items: center; gap: 8px;">
            <label style="font-weight: 600; color: #495057;">Priority:</label>
            <select 
              [(ngModel)]="priorityFilter" 
              (change)="applyFilters()"
              style="padding: 8px 12px; border: 2px solid #e9ecef; border-radius: 6px; background: white;">
              <option value="">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div style="display: flex; align-items: center; gap: 8px;">
            <label style="font-weight: 600; color: #495057;">Assignee:</label>
            <select 
              [(ngModel)]="assigneeFilter" 
              (change)="applyFilters()"
              style="padding: 8px 12px; border: 2px solid #e9ecef; border-radius: 6px; background: white;">
              <option value="">All Assignees</option>
              <option *ngFor="let assignee of uniqueAssignees" [value]="assignee">{{assignee}}</option>
            </select>
          </div>

          <!-- Sort Controls -->
          <div style="display: flex; align-items: center; gap: 8px; margin-left: auto;">
            <label style="font-weight: 600; color: #495057;">Sort by:</label>
            <select 
              [(ngModel)]="sortField" 
              (change)="applySorting()"
              style="padding: 8px 12px; border: 2px solid #e9ecef; border-radius: 6px; background: white;">
              <option value="id">ID</option>
              <option value="title">Title</option>
              <option value="status">Status</option>
              <option value="priority">Priority</option>
              <option value="updatedAt">Updated Date</option>
            </select>
            
            <button 
              (click)="toggleSortDirection()"
              style="background: #6c757d; color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; transition: all 0.3s;">
              {{sortDirection === 'asc' ? '↑' : '↓'}}
            </button>
          </div>
        </div>

        <!-- Results Summary -->
        <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e9ecef; display: flex; justify-content: space-between; align-items: center;">
          <span style="color: #6c757d;">
            Showing {{filteredIssues.length}} of {{allIssues.length}} issues
          </span>
          <div style="display: flex; align-items: center; gap: 10px;">
            <label style="color: #6c757d;">Page size:</label>
            <select 
              [(ngModel)]="pageSize" 
              (change)="changePageSize()"
              style="padding: 4px 8px; border: 1px solid #e9ecef; border-radius: 4px;">
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="25">25</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" style="text-align: center; padding: 60px;">
        <div style="display: inline-block; width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #007bff; border-radius: 50%; animation: spin 1s linear infinite;"></div>
        <h3 style="color: #007bff; margin-top: 20px;">Loading issues...</h3>
      </div>

      <!-- Error State -->
      <div *ngIf="error" style="background: #f8d7da; color: #721c24; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #f5c6cb;">
        <h4>Connection Error</h4>
        <p>{{error}}</p>
        <button (click)="loadIssues()" style="background: #dc3545; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
          Retry
        </button>
      </div>

      <!-- Issues Table -->
      <div *ngIf="!loading && !error" style="background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <!-- Table Header -->
        <div style="background: #f8f9fa; padding: 15px 20px; border-bottom: 2px solid #dee2e6; font-weight: 600; color: #495057;">
          <div style="display: grid; grid-template-columns: 60px 2fr 120px 100px 150px 140px 80px; gap: 15px; align-items: center;">
            <div>ID</div>
            <div>Title</div>
            <div>Status</div>
            <div>Priority</div>
            <div>Assignee</div>
            <div>Updated</div>
            <div>Actions</div>
          </div>
        </div>

        <!-- Table Rows -->
        <div *ngFor="let issue of paginatedIssues; let i = index" 
             (click)="viewIssue(issue)"
             style="padding: 15px 20px; border-bottom: 1px solid #e9ecef; cursor: pointer; transition: background-color 0.2s;"
             [style.background]="i % 2 === 0 ? '#ffffff' : '#f8f9fa'"
             (mouseenter)="$any($event.target).style.backgroundColor = '#e3f2fd'"
             (mouseleave)="$any($event.target).style.backgroundColor = i % 2 === 0 ? '#ffffff' : '#f8f9fa'">
          <div style="display: grid; grid-template-columns: 60px 2fr 120px 100px 150px 140px 80px; gap: 15px; align-items: center;">
            <div style="font-weight: 600; color: #6c757d;">{{issue.id}}</div>
            <div style="color: #212529; font-weight: 500;">{{issue.title}}</div>
            <div>
              <span [style.background]="getStatusColor(issue.status)" 
                    style="color: white; padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; text-transform: uppercase;">
                {{issue.status}}
              </span>
            </div>
            <div>
              <span [style.background]="getPriorityColor(issue.priority)"
                    style="color: white; padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: 600;">
                {{issue.priority}}
              </span>
            </div>
            <div style="color: #6c757d;">{{issue.assignee || 'Unassigned'}}</div>
            <div style="color: #6c757d; font-size: 13px;">{{formatDate(issue.updatedAt)}}</div>
            <div (click)="$event.stopPropagation()">
              <button (click)="editIssue(issue)" 
                      style="background: #007bff; color: white; border: none; padding: 6px 12px; border-radius: 4px; font-size: 12px; cursor: pointer;">
                Edit
              </button>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div *ngIf="paginatedIssues.length === 0" style="text-align: center; padding: 60px; color: #6c757d;">
          <h4>No issues found</h4>
          <p>Try adjusting your search or filter criteria</p>
        </div>

        <!-- Pagination -->
        <div *ngIf="paginatedIssues.length > 0" style="padding: 20px; background: #f8f9fa; display: flex; justify-content: space-between; align-items: center;">
          <div style="color: #6c757d;">
            Page {{currentPage}} of {{totalPages}} ({{filteredIssues.length}} total results)
          </div>
          <div style="display: flex; gap: 5px;">
            <button (click)="changePage(currentPage - 1)" 
                    [disabled]="currentPage <= 1"
                    style="padding: 8px 12px; border: 1px solid #dee2e6; background: white; border-radius: 4px; cursor: pointer;"
                    [style.opacity]="currentPage <= 1 ? '0.5' : '1'">
              Previous
            </button>
            
            <button *ngFor="let page of getPageNumbers()" 
                    (click)="changePage(page)"
                    [style.background]="page === currentPage ? '#007bff' : 'white'"
                    [style.color]="page === currentPage ? 'white' : '#495057'"
                    style="padding: 8px 12px; border: 1px solid #dee2e6; border-radius: 4px; cursor: pointer; min-width: 40px;">
              {{page}}
            </button>
            
            <button (click)="changePage(currentPage + 1)" 
                    [disabled]="currentPage >= totalPages"
                    style="padding: 8px 12px; border: 1px solid #dee2e6; background: white; border-radius: 4px; cursor: pointer;"
                    [style.opacity]="currentPage >= totalPages ? '0.5' : '1'">
              Next
            </button>
          </div>
        </div>
      </div>

      <!-- Create/Edit Modal -->
      <div *ngIf="showModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000;">
        <div style="background: white; padding: 30px; border-radius: 10px; width: 90%; max-width: 500px; max-height: 90vh; overflow-y: auto;">
          <h3 style="margin: 0 0 20px 0; color: #2c3e50;">{{editMode ? 'Edit Issue' : 'Create New Issue'}}</h3>
          
          <form [formGroup]="issueForm" (ngSubmit)="saveIssue()">
            <div style="margin-bottom: 15px;">
              <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #495057;">Title *</label>
              <input type="text" formControlName="title" 
                     style="width: 100%; padding: 10px; border: 2px solid #e9ecef; border-radius: 5px; font-size: 14px;"
                     [style.border-color]="issueForm.get('title')?.invalid && issueForm.get('title')?.touched ? '#dc3545' : '#e9ecef'">
            </div>

            <div style="margin-bottom: 15px;">
              <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #495057;">Description *</label>
              <textarea formControlName="description" rows="4"
                        style="width: 100%; padding: 10px; border: 2px solid #e9ecef; border-radius: 5px; font-size: 14px; resize: vertical;"
                        [style.border-color]="issueForm.get('description')?.invalid && issueForm.get('description')?.touched ? '#dc3545' : '#e9ecef'"></textarea>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
              <div>
                <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #495057;">Status</label>
                <select formControlName="status" style="width: 100%; padding: 10px; border: 2px solid #e9ecef; border-radius: 5px;">
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              <div>
                <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #495057;">Priority</label>
                <select formControlName="priority" style="width: 100%; padding: 10px; border: 2px solid #e9ecef; border-radius: 5px;">
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>

            <div style="margin-bottom: 20px;">
              <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #495057;">Assignee</label>
              <input type="text" formControlName="assignee" 
                     style="width: 100%; padding: 10px; border: 2px solid #e9ecef; border-radius: 5px; font-size: 14px;"
                     placeholder="Enter assignee name">
            </div>

            <div style="display: flex; gap: 10px; justify-content: flex-end;">
              <button type="button" (click)="closeModal()" 
                      style="padding: 10px 20px; border: 2px solid #6c757d; background: white; color: #6c757d; border-radius: 5px; cursor: pointer;">
                Cancel
              </button>
              <button type="submit" [disabled]="issueForm.invalid || saving"
                      style="padding: 10px 20px; border: none; background: #28a745; color: white; border-radius: 5px; cursor: pointer;"
                      [style.opacity]="issueForm.invalid || saving ? '0.5' : '1'">
                {{saving ? 'Saving...' : (editMode ? 'Update Issue' : 'Create Issue')}}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Issue Detail Modal -->
      <div *ngIf="showDetailModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000;">
        <div style="background: white; padding: 30px; border-radius: 10px; width: 90%; max-width: 600px; max-height: 90vh; overflow-y: auto;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h3 style="margin: 0; color: #2c3e50;">Issue Details</h3>
            <button (click)="closeDetailModal()" style="background: none; border: none; font-size: 20px; cursor: pointer; color: #6c757d;">×</button>
          </div>
          
          <div *ngIf="selectedIssue" style="background: #f8f9fa; padding: 20px; border-radius: 8px; font-family: 'Courier New', monospace; white-space: pre-wrap; font-size: 13px; line-height: 1.4;">{{selectedIssueJson}}</div>
        </div>
      </div>

      <!-- Backend Status -->
      <div style="text-align: center; margin-top: 30px; padding: 15px; background: white; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
        <span style="color: #6c757d;">Backend Status: </span>
        <span [style.color]="backendConnected ? '#28a745' : '#dc3545'" style="font-weight: 600;">
          {{backendConnected ? 'Connected' : 'Disconnected'}}
        </span>
      </div>
    </div>

    <style>
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      button:hover:not(:disabled) {
        opacity: 0.8;
        transform: translateY(-1px);
      }
      
      input:focus, select:focus, textarea:focus {
        outline: none;
        border-color: #007bff !important;
        box-shadow: 0 0 0 3px rgba(0,123,255,0.1);
      }
    </style>
  `
})
export class AppComponent implements OnInit {
  // Data properties
  allIssues: Issue[] = [];
  filteredIssues: Issue[] = [];
  paginatedIssues: Issue[] = [];
  uniqueAssignees: string[] = [];
  
  // UI state
  loading = true;
  error = '';
  backendConnected = false;
  
  // Search and filters
  searchTerm = '';
  statusFilter = '';
  priorityFilter = '';
  assigneeFilter = '';
  
  // Sorting
  sortField = 'id';
  sortDirection: 'asc' | 'desc' = 'asc';
  
  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;
  
  // Modals
  showModal = false;
  showDetailModal = false;
  editMode = false;
  saving = false;
  selectedIssue: Issue | null = null;
  selectedIssueJson = '';
  
  // Form
  issueForm: FormGroup;

  constructor(private http: HttpClient, private fb: FormBuilder) {
    this.issueForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      status: ['Open'],
      priority: ['Medium'],
      assignee: ['']
    });
  }

  ngOnInit() {
    this.loadIssues();
  }

  loadIssues() {
    this.loading = true;
    this.error = '';
    
    this.http.get<ApiResponse>('http://localhost:5000/issues').subscribe({
      next: (response) => {
        this.allIssues = response.issues || [];
        this.backendConnected = true;
        this.loading = false;
        this.updateUniqueAssignees();
        this.applyFilters();
      },
      error: (error) => {
        this.backendConnected = false;
        this.loading = false;
        this.error = 'Cannot connect to backend. Make sure Python server is running on port 5000.';
      }
    });
  }

  // Search functionality
  onSearchChange() {
    this.applyFilters();
  }

  // Filter and sort functionality
  applyFilters() {
    let filtered = [...this.allIssues];

    // Apply search
    if (this.searchTerm) {
      filtered = filtered.filter(issue => 
        issue.title.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (this.statusFilter) {
      filtered = filtered.filter(issue => issue.status === this.statusFilter);
    }

    // Apply priority filter
    if (this.priorityFilter) {
      filtered = filtered.filter(issue => issue.priority === this.priorityFilter);
    }

    // Apply assignee filter
    if (this.assigneeFilter) {
      filtered = filtered.filter(issue => issue.assignee === this.assigneeFilter);
    }

    this.filteredIssues = filtered;
    this.applySorting();
  }

  applySorting() {
    this.filteredIssues.sort((a, b) => {
      let aVal = a[this.sortField as keyof Issue];
      let bVal = b[this.sortField as keyof Issue];

      if (this.sortField === 'updatedAt' || this.sortField === 'createdAt') {
        aVal = new Date(aVal as string).getTime();
        bVal = new Date(bVal as string).getTime();
      }

      if (aVal < bVal) return this.sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    this.currentPage = 1;
    this.updatePagination();
  }

  toggleSortDirection() {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.applySorting();
  }

  // Pagination
  updatePagination() {
    this.totalPages = Math.ceil(this.filteredIssues.length / this.pageSize);
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedIssues = this.filteredIssues.slice(start, end);
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  changePageSize() {
    this.currentPage = 1;
    this.updatePagination();
  }

  getPageNumbers(): number[] {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  // Modal functions
  openCreateModal() {
    this.editMode = false;
    this.issueForm.reset({
      status: 'Open',
      priority: 'Medium',
      assignee: ''
    });
    this.showModal = true;
  }

  editIssue(issue: Issue) {
    this.editMode = true;
    this.selectedIssue = issue;
    this.issueForm.patchValue(issue);
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.selectedIssue = null;
    this.issueForm.reset();
  }

  viewIssue(issue: Issue) {
    this.selectedIssue = issue;
    this.selectedIssueJson = JSON.stringify(issue, null, 2);
    this.showDetailModal = true;
  }

  closeDetailModal() {
    this.showDetailModal = false;
    this.selectedIssue = null;
  }

  // CRUD operations
  saveIssue() {
    if (this.issueForm.invalid) return;

    this.saving = true;
    const formData = this.issueForm.value;

    if (this.editMode && this.selectedIssue) {
      // Update existing issue
      this.http.put(`http://localhost:5000/issues/${this.selectedIssue.id}`, formData).subscribe({
        next: (response) => {
          this.saving = false;
          this.closeModal();
          this.loadIssues();
        },
        error: (error) => {
          this.saving = false;
          alert('Error updating issue: ' + (error.error?.message || error.message));
        }
      });
    } else {
      // Create new issue
      this.http.post('http://localhost:5000/issues', formData).subscribe({
        next: (response) => {
          this.saving = false;
          this.closeModal();
          this.loadIssues();
        },
        error: (error) => {
          this.saving = false;
          alert('Error creating issue: ' + (error.error?.message || error.message));
        }
      });
    }
  }

  // Helper functions
  updateUniqueAssignees() {
    const assignees = [...new Set(this.allIssues.map(issue => issue.assignee).filter(a => a))];
    this.uniqueAssignees = assignees.sort();
  }

  getStatusColor(status: string): string {
    switch (status?.toLowerCase()) {
      case 'open': return '#007bff';
      case 'in progress': return '#ffc107';
      case 'closed': return '#28a745';
      default: return '#6c757d';
    }
  }

  getPriorityColor(priority: string): string {
    switch (priority?.toLowerCase()) {
      case 'high': return '#dc3545';
      case 'medium': return '#fd7e14';
      case 'low': return '#28a745';
      default: return '#6c757d';
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }
}