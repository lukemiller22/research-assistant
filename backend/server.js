<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Research Assistant</title>
    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
    <meta http-equiv="Pragma" content="no-cache">
    <meta http-equiv="Expires" content="0">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f8fafc;
            height: 100vh;
            display: flex;
        }
        
        .sidebar {
            width: 80px;
            background: white;
            border-right: 1px solid #e2e8f0;
            padding: 20px 10px;
            transition: all 0.3s ease;
            position: relative;
        }
        
        .sidebar.collapsed {
            width: 0;
            padding: 0;
            border-right: none;
            overflow: hidden;
        }
        
        .logo {
            display: none;
        }
        
        .nav-item {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 12px;
            margin-bottom: 8px;
            color: #64748b;
            cursor: pointer;
            border-radius: 8px;
            transition: all 0.2s ease;
        }
        
        .nav-item:hover {
            background: #f1f5f9;
            color: #3b82f6;
        }
        
        .nav-item.active {
            background: #f0f9ff;
            color: #3b82f6;
        }
        
        .panel-container {
            width: 400px;
            background: white;
            border-right: 1px solid #e2e8f0;
            transition: all 0.3s ease;
            position: relative;
        }
        
        .panel-container.collapsed {
            width: 0;
            border-right: none;
            overflow: hidden;
        }
        
        .panel {
            display: none;
            height: 100vh;
            flex-direction: column;
        }
        
        .panel.active {
            display: flex;
        }
        
        .panel-header {
            padding: 20px;
            border-bottom: 1px solid #f1f5f9;
        }
        
        .panel-title {
            font-size: 18px;
            font-weight: 600;
            color: #1e293b;
        }
        
        .panel-content {
            flex: 1;
            padding: 20px;
            overflow-y: auto;
        }
        
        .writing-area {
            flex: 1;
            background: white;
            display: flex;
            flex-direction: column;
        }
        
        .writing-header {
            padding: 20px;
            border-bottom: 1px solid #f1f5f9;
            transition: padding-left 0.3s ease;
        }
        
        .writing-header.sidebar-collapsed {
            padding-left: 80px;
        }
        
        .writing-title {
            font-size: 24px;
            font-weight: 600;
            color: #1e293b;
            border: none;
            outline: none;
            width: 100%;
            margin-bottom: 8px;
        }
        
        .writing-meta {
            color: #64748b;
            font-size: 14px;
        }
        
        .writing-content {
            flex: 1;
            padding: 20px;
        }
        
        .editor {
            width: 100%;
            height: 100%;
            border: none;
            outline: none;
            font-size: 16px;
            line-height: 1.6;
            color: #334155;
            resize: none;
            font-family: Georgia, 'Times New Roman', serif;
        }
        
        .search-input {
            width: 100%;
            padding: 12px 16px;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            font-size: 14px;
            outline: none;
            margin-bottom: 20px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .search-input.notes-search {
            min-height: 90px;
            resize: vertical;
            line-height: 1.5;
        }
        
        .search-input:focus {
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        
        .btn {
            background: #3b82f6;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: background 0.2s ease;
        }
        
        .btn:hover:not(:disabled) {
            background: #2563eb;
        }
        
        .btn:disabled {
            background: #94a3b8;
            cursor: not-allowed;
        }
        
        .empty-state {
            text-align: center;
            padding: 40px 20px;
            color: #9ca3af;
        }
        
        .empty-icon {
            width: 32px;
            height: 32px;
            margin: 0 auto 12px;
            opacity: 0.4;
            color: #9ca3af;
        }
        
        .empty-title {
            font-size: 16px;
            font-weight: 600;
            color: #374151;
            margin-bottom: 6px;
        }
        
        .empty-description {
            font-size: 14px;
        }
        
        .file-drop-area {
            border: 2px dashed #d1d5db;
            border-radius: 8px;
            padding: 40px 20px;
            text-align: center;
            background: white;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        
        .file-drop-area:hover {
            border-color: #3b82f6;
            background: #f8fafc;
        }
        
        .file-drop-area.dragover {
            border-color: #3b82f6;
            background: #f0f9ff;
        }

        .source-card {
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 12px;
            transition: all 0.2s ease;
        }

        .source-card:hover {
            border-color: #3b82f6;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .source-header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 8px;
        }

        .source-icon {
            width: 32px;
            height: 32px;
            background: #f1f5f9;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
        }

        .source-info {
            flex: 1;
        }

        .source-title {
            font-size: 14px;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 2px;
        }

        .source-author {
            font-size: 12px;
            color: #64748b;
        }

        .status-badge {
            background: #10b981;
            color: white;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 600;
        }

        .status-badge.processing {
            background: #fbbf24;
        }

        .status-badge.error {
            background: #ef4444;
        }

        .source-actions {
            display: flex;
            gap: 8px;
            margin-top: 8px;
        }

        .source-action-btn {
            flex: 1;
            background: none;
            border: 1px solid #e2e8f0;
            padding: 6px 12px;
            border-radius: 4px;
            font-size: 12px;
            color: #64748b;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .source-action-btn:hover {
            background: #f1f5f9;
            border-color: #3b82f6;
            color: #3b82f6;
        }

        .source-action-btn.delete {
            color: #ef4444;
            border-color: #fecaca;
        }

        .source-action-btn.delete:hover {
            background: #fef2f2;
            border-color: #ef4444;
        }

        /* Auto-search toggle styles */
        .auto-search-toggle {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 16px;
            padding: 8px 0;
        }

        .auto-search-toggle label {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
            color: #64748b;
            cursor: pointer;
        }

        .auto-search-toggle input[type="checkbox"] {
            margin: 0;
        }

        .auto-search-status {
            font-size: 12px;
            color: #10b981;
            opacity: 0;
            transition: opacity 0.3s ease;
        }

        /* New styles for note cards and filters */
        .notes-filters {
            display: flex;
            gap: 8px;
            margin-bottom: 20px;
        }

        .filter-select {
            flex: 1;
            padding: 8px 12px;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            font-size: 14px;
            background: white;
            color: #374151;
        }

        .filter-select:focus {
            border-color: #3b82f6;
            outline: none;
        }

        .note-card {
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 12px;
            transition: all 0.2s ease;
        }

        .note-card:hover {
            border-color: #3b82f6;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .note-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            margin-bottom: 12px;
        }

        .note-meta {
            flex: 1;
        }

        .note-score {
            font-size: 12px;
            font-weight: 600;
            color: #059669;
            margin-bottom: 4px;
        }

        .note-source {
            font-size: 12px;
            color: #64748b;
        }

        .note-actions {
            display: flex;
            gap: 8px;
        }

        .note-action-btn {
            width: 28px;
            height: 28px;
            border: none;
            background: #f8fafc;
            border-radius: 4px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #64748b;
            transition: all 0.2s ease;
        }

        .note-action-btn:hover {
            background: #e2e8f0;
            color: #3b82f6;
        }

        .note-action-btn.saved {
            background: #dcfce7;
            color: #059669;
        }

        .note-content {
            font-size: 14px;
            line-height: 1.5;
            color: #374151;
        }

        .icon {
            width: 20px;
            height: 20px;
        }

        /* Load more button styles */
        .load-more-container {
            text-align: center;
            padding: 20px 0;
            border-top: 1px solid #f1f5f9;
            margin-top: 16px;
        }

        .load-more-btn {
            background: #f8fafc;
            color: #64748b;
            border: 1px solid #e2e8f0;
            padding: 10px 20px;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .load-more-btn:hover {
            background: #f1f5f9;
            border-color: #3b82f6;
            color: #3b82f6;
        }

        .load-more-btn:disabled {
            background: #f8fafc;
            color: #94a3b8;
            cursor: not-allowed;
            opacity: 0.6;
        }
        
        /* Toggle button styles */
        .toggle-btn {
            position: absolute;
            top: 20px;
            right: -12px;
            width: 24px;
            height: 24px;
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10;
            transition: all 0.2s ease;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .toggle-btn:hover {
            background: #f8fafc;
            border-color: #3b82f6;
        }
        
        .toggle-btn svg {
            width: 12px;
            height: 12px;
            color: #64748b;
        }
        
        .toggle-btn:hover svg {
            color: #3b82f6;
        }
        
        .sidebar .toggle-btn {
            right: -12px;
        }
        
        .panel-container .toggle-btn {
            right: -12px;
        }
        
        /* Hamburger menu for collapsed sidebar */
        .hamburger-menu {
            position: fixed;
            top: 20px;
            left: 20px;
            width: 40px;
            height: 40px;
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            cursor: pointer;
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            transition: all 0.2s ease;
        }
        
        .hamburger-menu:hover {
            background: #f8fafc;
            border-color: #3b82f6;
        }
        
        .hamburger-menu svg {
            width: 20px;
            height: 20px;
            color: #64748b;
        }
        
        .hamburger-menu:hover svg {
            color: #3b82f6;
        }
        
        .hamburger-menu.show {
            display: flex;
        }
        
        /* Source Viewer Styles */
        .source-viewer {
            width: 400px;
            background: white;
            border-right: 1px solid #e2e8f0;
            display: none;
            flex-direction: column;
            position: relative;
        }
        
        .source-viewer.active {
            display: flex;
        }
        
        .source-viewer-header {
            padding: 20px;
            border-bottom: 1px solid #f1f5f9;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .source-viewer-title {
            font-size: 16px;
            font-weight: 600;
            color: #1e293b;
        }
        
        .source-viewer-close {
            width: 24px;
            height: 24px;
            border: none;
            background: none;
            cursor: pointer;
            color: #64748b;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .source-viewer-close:hover {
            background: #f1f5f9;
            color: #374151;
        }
        
        .source-viewer-content {
            flex: 1;
            padding: 20px;
            overflow-y: auto;
        }
        
        .source-viewer-content h1,
        .source-viewer-content h2,
        .source-viewer-content h3 {
            color: #1e293b;
            margin-top: 24px;
            margin-bottom: 12px;
        }
        
        .source-viewer-content h1 {
            font-size: 24px;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 8px;
        }
        
        .source-viewer-content h2 {
            font-size: 20px;
        }
        
        .source-viewer-content h3 {
            font-size: 18px;
        }
        
        .source-viewer-content p {
            margin-bottom: 16px;
        }
        
        .chunk-marker {
            position: relative;
        }
        
        .chunk-marker::before {
            content: '';
            position: absolute;
            left: -20px;
            top: 0;
            width: 4px;
            height: 100%;
            background: #3b82f6;
            opacity: 0;
            transition: opacity 0.3s ease;
        }
        
        .chunk-marker.highlighted::before {
            opacity: 1;
        }
        
        .chunk-marker.highlighted {
            background: #f0f9ff;
            padding: 8px;
            border-radius: 4px;
            margin: 4px 0;
        }
        
        /* Project card styles */
        .project-card {
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 12px;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        
        .project-card:hover {
            border-color: #3b82f6;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        .project-card.active {
            background: #f0f9ff;
            border-color: #3b82f6;
        }
    </style>
</head>
<body>
    <div class="sidebar" id="sidebar">
        
        <div class="nav-item active" onclick="switchToPanel('projects', this)" title="Projects">
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
        </div>
        <div class="nav-item" onclick="switchToPanel('library', this)" title="Library">
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
        </div>
        <div class="nav-item" onclick="switchToPanel('notes', this)" title="Notes">
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
        </div>
    </div>
    
    <div class="panel-container" id="panel-container">
        <button class="toggle-btn" onclick="togglePanel()" title="Collapse panel">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
        </button>
        
        <!-- Projects Panel -->
        <div class="panel active" id="projects-panel">
            <div class="panel-header">
                <div class="panel-title">Projects</div>
            </div>
            <div class="panel-content">
                <input type="text" class="search-input" placeholder="Search projects..." id="project-search">
                <button class="btn" onclick="showCreateProjectModal()">+ New Project</button>
                
                <div style="margin-top: 20px;" id="projects-container">
                    <!-- Projects will be dynamically loaded here -->
                </div>
            </div>
        </div>
        
        <!-- Library Panel -->
        <div class="panel" id="library-panel">
            <div class="panel-header">
                <div class="panel-title">Library</div>
            </div>
            <div class="panel-content">
                <input type="text" class="search-input" placeholder="Search sources..." id="library-search">
                <button class="btn" onclick="showUploadInterface()">+ Upload Source</button>
                
                <!-- Upload Form -->
                <div id="upload-form" style="display: none; margin-top: 20px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc;">
                    <h3 style="margin-bottom: 16px; font-size: 16px; font-weight: 600; color: #1e293b;">Upload New Source</h3>
                    
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; margin-bottom: 4px; font-size: 12px; font-weight: 600; color: #374151;">Title</label>
                        <input type="text" id="upload-title" style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;">
                    </div>
                    
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; margin-bottom: 4px; font-size: 12px; font-weight: 600; color: #374151;">Author (optional)</label>
                        <input type="text" id="upload-author" style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;">
                    </div>
                    
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; margin-bottom: 4px; font-size: 12px; font-weight: 600; color: #374151;">Choose File</label>
                        <div class="file-drop-area" onclick="document.getElementById('file-input').click()">
                            <input type="file" id="file-input" accept=".txt,.json,.pdf,.epub" style="display: none;">
                            <svg width="48" height="48" style="margin: 0 auto 12px; color: #9ca3af;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <div style="font-size: 14px; color: #374151; margin-bottom: 4px;">
                                <strong>Click to upload</strong> or drag and drop
                            </div>
                            <div style="font-size: 12px; color: #6b7280;">
                                Supports: .txt, .json, .pdf, .epub files
                            </div>
                        </div>
                        <div id="selected-file" style="display: none; margin-top: 12px; padding: 8px; background: #f0f9ff; border-radius: 4px; font-size: 14px; color: #1e40af;"></div>
                    </div>
                    
                    <div style="display: flex; gap: 8px;">
                        <button class="btn" onclick="processUpload()" id="upload-btn" disabled>Upload & Process</button>
                        <button onclick="hideUploadInterface()" style="background: #f1f5f9; color: #64748b; border: 1px solid #e2e8f0; padding: 8px 16px; border-radius: 6px; font-size: 14px; cursor: pointer;">Cancel</button>
                    </div>
                    
                    <div id="upload-status" style="margin-top: 12px; font-size: 14px;"></div>
                </div>
                
                <div style="margin-top: 20px;" id="sources-list">
                    <div class="empty-state">
                        <div class="empty-icon">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                        </div>
                        <div class="empty-title">No sources yet</div>
                        <div class="empty-description">Upload your first source to get started</div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Notes Panel -->
        <div class="panel" id="notes-panel">
            <div class="panel-header">
                <div class="panel-title">Notes</div>
            </div>
            <div class="panel-content">
                <textarea class="search-input notes-search" placeholder="Search your sources with a detailed query or question" id="notes-search" oninput="performSearch()" onkeydown="handleSearchKeydown(event)"></textarea>
                
                <!-- Auto-search Toggle -->
                <div class="auto-search-toggle">
                    <label>
                        <input type="checkbox" id="auto-search-toggle" checked onchange="toggleAutoSearch()">
                        <span>Auto-search</span>
                    </label>
                    <div id="auto-search-status" class="auto-search-status">
                        ✓ Auto-searching...
                    </div>
                </div>
                
                <!-- Filter Options -->
                <div class="notes-filters">
                    <select class="filter-select" id="source-filter" onchange="applyFilters()">
                        <option value="">All Sources</option>
                    </select>
                </div>
                <div class="notes-filters" style="margin-top: 8px;">
                    <select class="filter-select" id="project-filter" onchange="applyFilters()">
                        <option value="">All Notes</option>
                    </select>
                </div>
                
                <div id="notes-results">
                    <div class="empty-state">
                        <div class="empty-icon">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                            </svg>
                        </div>
                        <div class="empty-title">No notes yet</div>
                        <div class="empty-description">Search or start writing to see relevant notes</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Hamburger Menu (shown when sidebar is collapsed) -->
    <div class="hamburger-menu" id="hamburger-menu" onclick="expandSidebar()" title="Open menu">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
    </div>
    
    <!-- Source Notes Viewer -->
    <div class="source-viewer" id="source-viewer">
        <div class="source-viewer-header">
            <div class="source-viewer-title" id="source-viewer-title">Source Notes</div>
            <button class="source-viewer-close" onclick="closeSourceViewer()" title="Close notes viewer">
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
        <div class="source-viewer-content" id="source-viewer-content">
            <div class="empty-state">
                <div class="empty-icon">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                </div>
                <div class="empty-title">No notes selected</div>
                <div class="empty-description">Click "Notes" on a source or "View note in context" on a note</div>
            </div>
        </div>
    </div>
    
    <!-- Writing Area -->
    <div class="writing-area">
        <div class="writing-header">
            <input type="text" class="writing-title" placeholder="Untitled Document" id="document-title">
            <div class="writing-meta">Draft • Last modified: Today</div>
        </div>
        <div class="writing-content">
            <textarea class="editor" placeholder="Start writing your research paper..." id="document-editor" oninput="handleEditorInput()"></textarea>
        </div>
    </div>

    <!-- Create Project Modal -->
    <div id="create-project-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; align-items: center; justify-content: center;">
        <div style="background: white; border-radius: 8px; padding: 24px; width: 400px; max-width: 90vw;">
            <h3 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #1e293b;">Create New Project</h3>
            <input type="text" id="new-project-title" placeholder="Project title..." style="width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; margin-bottom: 16px;">
            <div style="display: flex; gap: 8px; justify-content: flex-end;">
                <button onclick="hideCreateProjectModal()" style="background: #f1f5f9; color: #64748b; border: 1px solid #e2e8f0; padding: 8px 16px; border-radius: 6px; font-size: 14px; cursor: pointer;">Cancel</button>
                <button onclick="createNewProject()" class="btn">Create Project</button>
            </div>
        </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div id="delete-project-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; align-items: center; justify-content: center;">
        <div style="background: white; border-radius: 8px; padding: 24px; width: 400px; max-width: 90vw;">
            <h3 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #1e293b;">Delete Project</h3>
            <p style="margin: 0 0 16px 0; color: #64748b;">Are you sure you want to delete "<span id="delete-project-name"></span>"? This action cannot be undone.</p>
            <div style="display: flex; gap: 8px; justify-content: flex-end;">
                <button onclick="hideDeleteProjectModal()" style="background: #f1f5f9; color: #64748b; border: 1px solid #e2e8f0; padding: 8px 16px; border-radius: 6px; font-size: 14px; cursor: pointer;">Cancel</button>
                <button onclick="confirmDeleteProject()" style="background: #ef4444; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-size: 14px; cursor: pointer;">Delete</button>
            </div>
        </div>
    </div>

    <script>
        const API_BASE = 'http://localhost:3001';
        let selectedFile = null;
        let allNotes = [];
        let displayedNotes = [];
        let projects = new Map(); // Map of projectId -> project data
        let currentProjectId = null;
        let savedNotes = new Map(); // Map of projectId -> Set of noteIds
        let availableSources = new Set();
        let availableProjects = new Set();
        let autoSearchEnabled = true;
        let autoSearchTimeout = null;
        let currentSearchQuery = '';
        let searchLimit = 10;
        let searchOffset = 0;
        let hasMoreResults = false;
        let sidebarCollapsed = false;
        let panelCollapsed = false;
        
        // Toggle functions
        function toggleSidebar() {
            const sidebar = document.getElementById('sidebar');
            const toggleBtn = sidebar.querySelector('.toggle-btn');
            const icon = toggleBtn.querySelector('svg path');
            const hamburgerMenu = document.getElementById('hamburger-menu');
            const writingHeader = document.querySelector('.writing-header');
            
            sidebarCollapsed = !sidebarCollapsed;
            sidebar.classList.toggle('collapsed', sidebarCollapsed);
            
            // Show/hide hamburger menu and adjust writing header
            if (sidebarCollapsed) {
                hamburgerMenu.classList.add('show');
                writingHeader.classList.add('sidebar-collapsed');
                icon.setAttribute('d', 'M9 5l7 7-7 7');
                toggleBtn.title = 'Expand sidebar';
            } else {
                hamburgerMenu.classList.remove('show');
                writingHeader.classList.remove('sidebar-collapsed');
                icon.setAttribute('d', 'M15 19l-7-7 7-7');
                toggleBtn.title = 'Collapse sidebar';
            }
        }
        
        function expandSidebar() {
            if (sidebarCollapsed) {
                toggleSidebar();
            }
        }
        
        // Source Viewer Functions
        async function viewSource(sourceId, sourceTitle) {
            try {
                const response = await fetch(`${API_BASE}/sources/${sourceId}/full`);
                if (!response.ok) {
                    throw new Error(`Failed to load source: ${response.status}`);
                }
                
                const data = await response.json();
                showSourceViewer(data, sourceTitle);
                
            } catch (error) {
                console.error('Error loading source:', error);
                alert('Failed to load source document');
            }
        }
        
        async function viewSourceWithChunk(sourceId, sourceTitle, chunkIndex) {
            try {
                const response = await fetch(`${API_BASE}/sources/${sourceId}/full?chunk=${chunkIndex}`);
                if (!response.ok) {
                    throw new Error(`Failed to load source: ${response.status}`);
                }
                
                const data = await response.json();
                showSourceViewer(data, sourceTitle, chunkIndex);
                
            } catch (error) {
                console.error('Error loading source:', error);
                alert('Failed to load source document');
            }
        }
        
        function showSourceViewer(data, sourceTitle, scrollToChunk = null) {
            const sourceViewer = document.getElementById('source-viewer');
            const titleElement = document.getElementById('source-viewer-title');
            const contentElement = document.getElementById('source-viewer-content');
            
            // Update title
            titleElement.textContent = sourceTitle;
            
            // Process content with chunk markers
            let processedContent = data.content;
            
            // Replace chunk markers with HTML elements
            processedContent = processedContent.replace(
                /<!-- CHUNK_START:(\d+) -->([\s\S]*?)<!-- CHUNK_END:\1 -->/g,
                '<div class="chunk-marker" data-chunk="$1">$2</div>'
            );
            
            // Set content
            contentElement.innerHTML = processedContent;
            
            // Show the source viewer
            sourceViewer.classList.add('active');
            
            // Scroll to specific chunk if requested
            if (scrollToChunk !== null) {
                setTimeout(() => {
                    const chunkElement = contentElement.querySelector(`[data-chunk="${scrollToChunk}"]`);
                    if (chunkElement) {
                        chunkElement.classList.add('highlighted');
                        chunkElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }, 100);
            }
        }
        
        function closeSourceViewer() {
            const sourceViewer = document.getElementById('source-viewer');
            sourceViewer.classList.remove('active');
        }
        
        function togglePanel() {
            const panelContainer = document.getElementById('panel-container');
            const toggleBtn = panelContainer.querySelector('.toggle-btn');
            const icon = toggleBtn.querySelector('svg path');
            
            panelCollapsed = !panelCollapsed;
            panelContainer.classList.toggle('collapsed', panelCollapsed);
            
            // Update icon
            if (panelCollapsed) {
                icon.setAttribute('d', 'M9 5l7 7-7 7');
                toggleBtn.title = 'Expand panel';
            } else {
                icon.setAttribute('d', 'M15 19l-7-7 7-7');
                toggleBtn.title = 'Collapse panel';
            }
        }
        
        // Initialize projects
        function initializeProjects() {
            // Load from localStorage first
            loadProjectsFromStorage();
            
            // If no projects exist, create a default one
            if (projects.size === 0) {
                const defaultProjectId = 'project-1';
                projects.set(defaultProjectId, {
                    id: defaultProjectId,
                    title: 'Untitled Document',
                    content: '',
                    wordCount: 0,
                    lastModified: new Date().toISOString(),
                    createdAt: new Date().toISOString()
                });
                
                savedNotes.set(defaultProjectId, new Set());
                currentProjectId = defaultProjectId;
                saveProjectsToStorage();
            }
            
            // Load the current project content
            if (currentProjectId) {
                loadProject(currentProjectId);
            } else {
                // If no current project is set, use the first available project
                const firstProjectId = Array.from(projects.keys())[0];
                if (firstProjectId) {
                    currentProjectId = firstProjectId;
                    loadProject(currentProjectId);
                }
            }
            
            // Load all sources for the source filter
            loadAllSources();
            
            updateProjectDisplay();
        }
        
        function loadProjectsFromStorage() {
            try {
                const stored = localStorage.getItem('researchAssistantProjects');
                if (stored) {
                    const data = JSON.parse(stored);
                    projects = new Map(data.projects);
                    
                    // Convert savedNotes arrays back to Sets
                    savedNotes = new Map();
                    if (data.savedNotes) {
                        data.savedNotes.forEach(([projectId, noteArray]) => {
                            savedNotes.set(projectId, new Set(noteArray));
                        });
                    }
                    
                    currentProjectId = data.currentProjectId || null;
                }
            } catch (error) {
                console.error('Error loading projects from storage:', error);
            }
        }
        
        function saveProjectsToStorage() {
            try {
                const data = {
                    projects: Array.from(projects.entries()),
                    savedNotes: Array.from(savedNotes.entries()).map(([projectId, noteSet]) => [projectId, Array.from(noteSet)]),
                    currentProjectId: currentProjectId
                };
                localStorage.setItem('researchAssistantProjects', JSON.stringify(data));
            } catch (error) {
                console.error('Error saving projects to storage:', error);
            }
        }
        
        function createProject(title) {
            const projectId = 'project-' + Date.now();
            const project = {
                id: projectId,
                title: title,
                content: '',
                wordCount: 0,
                lastModified: new Date().toISOString(),
                createdAt: new Date().toISOString()
            };
            
            projects.set(projectId, project);
            savedNotes.set(projectId, new Set());
            saveProjectsToStorage();
            updateProjectDisplay();
            updateAvailableProjects();
            
            return projectId;
        }
        
        let projectToDelete = null;
        
        function showCreateProjectModal() {
            document.getElementById('create-project-modal').style.display = 'flex';
            document.getElementById('new-project-title').value = '';
            document.getElementById('new-project-title').focus();
        }
        
        function hideCreateProjectModal() {
            document.getElementById('create-project-modal').style.display = 'none';
        }
        
        function createNewProject() {
            const title = document.getElementById('new-project-title').value.trim();
            if (!title) {
                alert('Please enter a project title');
                return;
            }
            
            const projectId = createProject(title);
            loadProject(projectId);
            hideCreateProjectModal();
        }
        
        function deleteProject(projectId) {
            if (projects.size <= 1) {
                alert('Cannot delete the last project. You must have at least one project.');
                return;
            }
            
            const project = projects.get(projectId);
            if (!project) return;
            
            projectToDelete = projectId;
            document.getElementById('delete-project-name').textContent = project.title;
            document.getElementById('delete-project-modal').style.display = 'flex';
        }
        
        function hideDeleteProjectModal() {
            document.getElementById('delete-project-modal').style.display = 'none';
            projectToDelete = null;
        }
        
        function confirmDeleteProject() {
            if (!projectToDelete) return;
            
            const projectId = projectToDelete;
            projects.delete(projectId);
            savedNotes.delete(projectId);
            
            // If we deleted the current project, switch to another one
            if (currentProjectId === projectId) {
                const remainingProjects = Array.from(projects.keys());
                currentProjectId = remainingProjects[0];
                loadProject(currentProjectId);
            }
            
            saveProjectsToStorage();
            updateProjectDisplay();
            updateAvailableProjects();
            hideDeleteProjectModal();
        }
        
        function loadProject(projectId) {
            const project = projects.get(projectId);
            if (!project) return;
            
            currentProjectId = projectId;
            
            // Update the document title and content
            document.getElementById('document-title').value = project.title;
            document.getElementById('document-editor').value = project.content;
            
            // Update the writing meta
            const wordCount = project.content.trim().split(/\s+/).filter(word => word.length > 0).length;
            document.querySelector('.writing-meta').textContent = `${wordCount} words • Last modified: ${new Date(project.lastModified).toLocaleDateString()}`;
            
            // Update the project display to reflect the new selection
            updateProjectDisplay();
            saveProjectsToStorage();
        }
        
        function updateProjectContent() {
            if (!currentProjectId) return;
            
            const project = projects.get(currentProjectId);
            if (!project) return;
            
            const title = document.getElementById('document-title').value;
            const content = document.getElementById('document-editor').value;
            const wordCount = content.trim().split(/\s+/).filter(word => word.length > 0).length;
            
            project.title = title;
            project.content = content;
            project.wordCount = wordCount;
            project.lastModified = new Date().toISOString();
            
            projects.set(currentProjectId, project);
            saveProjectsToStorage();
            updateProjectDisplay();
        }
        
        function updateProjectDisplay() {
            const projectsContainer = document.getElementById('projects-container');
            if (!projectsContainer) return;
            
            projectsContainer.innerHTML = '';
            
            projects.forEach(project => {
                const savedCount = savedNotes.get(project.id)?.size || 0;
                const isCurrent = project.id === currentProjectId;
                
                const projectCard = document.createElement('div');
                projectCard.className = 'project-card';
                if (isCurrent) {
                    projectCard.classList.add('active');
                }
                
                projectCard.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                        <div style="flex: 1;">
                            <div style="font-size: 14px; font-weight: 600; color: #1e293b; margin-bottom: 4px;">${project.title}</div>
                            <div style="font-size: 12px; color: #64748b;">${project.wordCount} words • ${savedCount} saved notes</div>
                        </div>
                        <button onclick="event.stopPropagation(); deleteProject('${project.id}')" 
                                style="background: none; border: none; color: #ef4444; cursor: pointer; padding: 4px; border-radius: 4px; transition: background 0.2s ease;"
                                onmouseover="this.style.background='#fef2f2'" 
                                onmouseout="this.style.background='none'"
                                title="Delete project">
                            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                `;
                
                projectCard.onclick = () => loadProject(project.id);
                projectsContainer.appendChild(projectCard);
            });
        }
        
        // Panel switching function
        function switchToPanel(panelName, element) {
            console.log('Switching to panel:', panelName);
            
            // If the middle panel is collapsed, expand it first
            if (panelCollapsed) {
                togglePanel();
            }
            
            // Update navigation active state
            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.remove('active');
            });
            element.classList.add('active');
            
            // Update panel visibility
            document.querySelectorAll('.panel').forEach(panel => {
                panel.classList.remove('active');
            });
            
            const targetPanel = document.getElementById(panelName + '-panel');
            if (targetPanel) {
                targetPanel.classList.add('active');
                console.log('Successfully switched to:', panelName);
            } else {
                console.error('Panel not found:', panelName + '-panel');
            }
            
            // Load sources when switching to library
            if (panelName === 'library') {
                console.log('Loading library sources...');
                loadSourcesFromBackend();
            }
            
            // Update projects when switching to notes
            if (panelName === 'notes') {
                console.log('Updating available projects...');
                updateAvailableProjects();
                loadAllSources();
            }
        }
        
        // Auto-search toggle functionality
        function toggleAutoSearch() {
            autoSearchEnabled = document.getElementById('auto-search-toggle').checked;
            console.log('Auto-search', autoSearchEnabled ? 'enabled' : 'disabled');
            
            // Clear any pending auto-search
            if (autoSearchTimeout) {
                clearTimeout(autoSearchTimeout);
                autoSearchTimeout = null;
            }
            
            // Hide status indicator when disabled
            const statusDiv = document.getElementById('auto-search-status');
            if (!autoSearchEnabled) {
                statusDiv.style.opacity = '0';
            }
        }
        
        function showAutoSearchStatus() {
            if (!autoSearchEnabled) return;
            
            const statusDiv = document.getElementById('auto-search-status');
            statusDiv.style.opacity = '1';
            
            // Hide after 2 seconds
            setTimeout(() => {
                statusDiv.style.opacity = '0';
            }, 2000);
        }
        
        function extractMeaningfulText() {
            const editor = document.getElementById('document-editor');
            const text = editor.value;
            const cursorPosition = editor.selectionStart;
            
            console.log('ExtractMeaningfulText - Cursor position:', cursorPosition);
            console.log('ExtractMeaningfulText - Text length:', text.length);
            
            if (!text || cursorPosition === undefined) {
                console.log('ExtractMeaningfulText - No text or cursor position');
                return '';
            }
            
            // Extract a larger chunk of text around the cursor for better context
            const chunkSize = 500; // Increased from 200 to 500 characters
            const start = Math.max(0, cursorPosition - chunkSize);
            const end = Math.min(text.length, cursorPosition + chunkSize);
            
            let textChunk = text.substring(start, end);
            console.log('ExtractMeaningfulText - Text chunk:', textChunk);
            
            // Try to find paragraph boundaries first
            const beforeCursor = text.substring(0, cursorPosition);
            const afterCursor = text.substring(cursorPosition);
            
            // Look for paragraph breaks (double newlines) before and after cursor
            const lastParagraphBreak = beforeCursor.lastIndexOf('\n\n');
            const nextParagraphBreak = afterCursor.indexOf('\n\n');
            
            let paragraphStart = lastParagraphBreak > -1 ? lastParagraphBreak + 2 : Math.max(0, cursorPosition - 300);
            let paragraphEnd = nextParagraphBreak > -1 ? cursorPosition + nextParagraphBreak : Math.min(text.length, cursorPosition + 300);
            
            // If we found a good paragraph, use it; otherwise use the chunk
            if (paragraphEnd - paragraphStart > 100 && paragraphEnd - paragraphStart < 800) {
                textChunk = text.substring(paragraphStart, paragraphEnd);
                console.log('ExtractMeaningfulText - Using paragraph:', textChunk);
            } else {
                console.log('ExtractMeaningfulText - Using chunk around cursor');
            }
            
            // Clean up the text chunk
            textChunk = textChunk.trim();
            
            // If the chunk is too short, try to expand it
            if (textChunk.length < 100) {
                const expandedStart = Math.max(0, cursorPosition - 400);
                const expandedEnd = Math.min(text.length, cursorPosition + 400);
                textChunk = text.substring(expandedStart, expandedEnd).trim();
                console.log('ExtractMeaningfulText - Expanded chunk:', textChunk);
            }
            
            // Filter out very short chunks
            if (textChunk.length < 50) {
                console.log('ExtractMeaningfulText - Chunk too short');
                return '';
            }
            
            console.log('ExtractMeaningfulText - Returning:', textChunk);
            return textChunk;
        }
        
        function handleEditorInput() {
            // Auto-save project content
            updateProjectContent();
            
            console.log('HandleEditorInput - Auto-search enabled:', autoSearchEnabled);
            
            if (!autoSearchEnabled) return;
            
            // Clear any existing timeout
            if (autoSearchTimeout) {
                clearTimeout(autoSearchTimeout);
            }
            
            // Set a new timeout
            autoSearchTimeout = setTimeout(() => {
                const editor = document.getElementById('document-editor');
                const text = editor.value.trim();
                
                console.log('HandleEditorInput - Text length:', text.length);
                
                if (text.length < 100) {
                    console.log('HandleEditorInput - Text too short, returning');
                    return; // Need minimum content
                }
                
                const searchQuery = extractMeaningfulText();
                console.log('HandleEditorInput - Search query:', searchQuery);
                
                if (searchQuery && searchQuery.length > 50) {
                    console.log('Auto-searching for:', searchQuery);
                    
                    // Show status indicator
                    showAutoSearchStatus();
                    
                    // Perform the search
                    performAutoSearch(searchQuery);
                } else {
                    console.log('HandleEditorInput - Search query too short or empty');
                }
            }, 2500); // Wait 2.5 seconds after user stops typing
        }
        
        async function performAutoSearch(query) {
            if (!autoSearchEnabled) return;
            
            // Reset for new auto-search
            searchOffset = 0;
            currentSearchQuery = query;
            
            // Update the search input to show what we're searching for
            const searchInput = document.getElementById('notes-search');
            searchInput.value = query.substring(0, 80) + (query.length > 80 ? '...' : '');
            
            try {
                const response = await fetch(`${API_BASE}/search`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        query: query,
                        limit: 24 // Request more results for better pagination (show 8, keep 16 cached)
                    })
                });
                
                if (!response.ok) {
                    throw new Error(`Search failed: ${response.status}`);
                }
                
                const results = await response.json();
                
                // Store all results and show first 8
                allNotes = results;
                displayedNotes = results.slice(0, 8);
                searchOffset = 8;
                hasMoreResults = results.length > 8;
                
                updateAvailableSources(results);
                applyFilters();
                
            } catch (error) {
                console.error('Auto-search error:', error);
            }
        }
        
        // Handle keydown events in search input
        function handleSearchKeydown(event) {
            // If auto-search is disabled and user presses Enter, perform manual search
            if (!autoSearchEnabled && event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                performManualSearch();
            }
        }
        
        // Manual search function (when auto-search is disabled)
        async function performManualSearch() {
            const searchInput = document.getElementById('notes-search');
            let query = searchInput.value.trim();
            
            if (query.length < 3) {
                displayEmptyState();
                return;
            }
            
            // Reset for new search
            searchOffset = 0;
            currentSearchQuery = query;
            
            try {
                const response = await fetch(`${API_BASE}/search`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        query: query,
                        limit: 10
                    })
                });
                
                if (!response.ok) {
                    throw new Error(`Search failed: ${response.status}`);
                }
                
                const results = await response.json();
                
                if (results.length === 0) {
                    displayEmptyState();
                    return;
                }
                
                allNotes = results;
                displayedNotes = [...results];
                updateAvailableSources(results);
                applyFilters();
                
            } catch (error) {
                console.error('Manual search error:', error);
                displayErrorState();
            }
        }
        
        // Search functionality with debouncing for textarea
        async function performSearch() {
            // Check if auto-search is enabled
            if (!autoSearchEnabled) {
                return;
            }
            
            // Clear existing timeout
            if (performSearch.timeout) {
                clearTimeout(performSearch.timeout);
            }
            
            // Debounce the search for textarea input
            performSearch.timeout = setTimeout(async () => {
                const searchInput = document.getElementById('notes-search');
                let query = searchInput.value.trim();
                
                if (query.length < 3) {
                    displayEmptyState();
                    return;
                }
                
                // Reset for new search
                searchOffset = 0;
                currentSearchQuery = query;
                
                await executeSearch(query, searchLimit, searchOffset, true);
            }, 500); // 500ms debounce for manual typing
        }
        
        async function executeSearch(query, limit, offset = 0, isNewSearch = false) {
            try {
                const response = await fetch(`${API_BASE}/search`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        query: query,
                        limit: limit + 1 // Get one extra to check if there are more results
                    })
                });
                
                if (!response.ok) {
                    throw new Error(`Search failed: ${response.status}`);
                }
                
                const results = await response.json();
                
                // Check if there are more results
                hasMoreResults = results.length > limit;
                
                // Remove the extra result if present
                if (hasMoreResults) {
                    results.pop();
                }
                
                if (isNewSearch) {
                    allNotes = results;
                    displayedNotes = [...results];
                    updateAvailableSources(results);
                } else {
                    // This is a "load more" operation
                    const newResults = results.slice(offset);
                    allNotes = [...allNotes, ...newResults];
                    displayedNotes = [...displayedNotes, ...newResults];
                    updateAvailableSources(allNotes);
                }
                
                applyFilters();
                
            } catch (error) {
                console.error('Search error:', error);
                displayErrorState();
            }
        }
        
        async function loadMoreResults() {
            if (!hasMoreResults) return;
            
            const loadMoreBtn = document.getElementById('load-more-btn');
            if (loadMoreBtn) {
                loadMoreBtn.disabled = true;
                loadMoreBtn.textContent = 'Loading...';
            }
            
            searchOffset = displayedNotes.length;
            
            try {
                // Check if this is a source-specific view (using dropdown filter)
                const sourceFilter = document.getElementById('source-filter').value;
                const searchInput = document.getElementById('notes-search').value.trim();
                
                if (sourceFilter && !searchInput) {
                    // We're viewing a specific source without a search query
                    // All notes are already loaded, just show more from the existing array
                    const remainingNotes = allNotes.slice(searchOffset);
                    const notesToAdd = remainingNotes.slice(0, searchLimit);
                    
                    displayedNotes = [...displayedNotes, ...notesToAdd];
                    hasMoreResults = searchOffset + searchLimit < allNotes.length;
                    
                    applyFilters();
                } else if (currentSearchQuery.startsWith('source:')) {
                    // Legacy source-specific search (shouldn't happen with new implementation)
                    const remainingNotes = allNotes.slice(searchOffset);
                    const notesToAdd = remainingNotes.slice(0, searchLimit);
                    
                    displayedNotes = [...displayedNotes, ...notesToAdd];
                    hasMoreResults = searchOffset + searchLimit < allNotes.length;
                    
                    applyFilters();
                } else if (currentSearchQuery) {
                    // Regular search - fetch more from backend
                    const response = await fetch(`${API_BASE}/search`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            query: currentSearchQuery,
                            limit: searchLimit + 1 // Get one extra to check if there are more results
                        })
                    });
                    
                    if (!response.ok) {
                        throw new Error(`Load more failed: ${response.status}`);
                    }
                    
                    const results = await response.json();
                    const newResults = results.slice(searchOffset);
                    
                    // Check if there are more results after these
                    hasMoreResults = results.length > searchOffset + searchLimit;
                    
                    // Take only the new results we need
                    const resultsToAdd = newResults.slice(0, searchLimit);
                    
                    allNotes = [...allNotes, ...resultsToAdd];
                    displayedNotes = [...displayedNotes, ...resultsToAdd];
                    updateAvailableSources(allNotes);
                    applyFilters();
                }
                
            } catch (error) {
                console.error('Load more error:', error);
            } finally {
                if (loadMoreBtn) {
                    loadMoreBtn.disabled = false;
                    loadMoreBtn.textContent = 'Load More';
                }
            }
        }
        
        function updateAvailableSources(notes) {
            const sourceFilter = document.getElementById('source-filter');
            availableSources.clear();
            
            // Clear existing options except "All Sources"
            while (sourceFilter.children.length > 1) {
                sourceFilter.removeChild(sourceFilter.lastChild);
            }
            
            // Add unique sources from the provided notes
            notes.forEach(note => {
                if (!availableSources.has(note.source_title)) {
                    availableSources.add(note.source_title);
                    const option = document.createElement('option');
                    option.value = note.source_title;
                    option.textContent = note.source_title;
                    sourceFilter.appendChild(option);
                }
            });
        }
        
        async function loadAllSources() {
            try {
                // Get all sources from the backend
                const response = await fetch(`${API_BASE}/sources`);
                if (response.ok) {
                    const sources = await response.json();
                    
                    // Update source filter with all available sources
                    const sourceFilter = document.getElementById('source-filter');
                    availableSources.clear();
                    
                    // Clear existing options except "All Sources"
                    while (sourceFilter.children.length > 1) {
                        sourceFilter.removeChild(sourceFilter.lastChild);
                    }
                    
                    // Add all sources
                    sources.forEach(source => {
                        if (!availableSources.has(source.title)) {
                            availableSources.add(source.title);
                            const option = document.createElement('option');
                            option.value = source.title;
                            option.textContent = source.title;
                            sourceFilter.appendChild(option);
                        }
                    });
                }
            } catch (error) {
                console.error('Error loading sources:', error);
            }
        }
        
        function updateAvailableProjects() {
            const projectFilter = document.getElementById('project-filter');
            availableProjects.clear();
            
            // Clear existing options except "All Notes"
            while (projectFilter.children.length > 1) {
                projectFilter.removeChild(projectFilter.lastChild);
            }
            
            // Add all projects
            projects.forEach(project => {
                if (!availableProjects.has(project.title)) {
                    availableProjects.add(project.title);
                    const option = document.createElement('option');
                    option.value = project.id;
                    option.textContent = project.title;
                    projectFilter.appendChild(option);
                }
            });
        }
        
        function applyFilters() {
            const sourceFilter = document.getElementById('source-filter').value;
            const projectFilter = document.getElementById('project-filter').value;
            
            let filteredNotes = [...displayedNotes]; // Use displayedNotes instead of allNotes
            
            // Apply source filter
            if (sourceFilter) {
                filteredNotes = filteredNotes.filter(note => note.source_title === sourceFilter);
            }
            
            // Apply project filter
            if (projectFilter && projectFilter !== '') {
                // Show only notes saved to the specific project
                const projectNotes = savedNotes.get(projectFilter);
                if (projectNotes) {
                    filteredNotes = filteredNotes.filter(note => {
                        const noteId = note.source_id + '-' + note.chunk_index;
                        return projectNotes.has(noteId);
                    });
                } else {
                    // If no saved notes for this project, show empty
                    filteredNotes = [];
                }
            }
            
            displayNotes(filteredNotes);
        }
        
        function displayNotes(notes) {
            const resultsContainer = document.getElementById('notes-results');
            
            if (!notes || notes.length === 0) {
                displayEmptyState();
                return;
            }
            
            resultsContainer.innerHTML = '';
            
            notes.forEach(note => {
                const noteCard = createNoteCard(note);
                resultsContainer.appendChild(noteCard);
            });
            
            // Add load more button if there are more results available
            if (hasMoreResults) {
                const loadMoreContainer = document.createElement('div');
                loadMoreContainer.className = 'load-more-container';
                loadMoreContainer.innerHTML = `
                    <button class="load-more-btn" id="load-more-btn" onclick="loadMoreResults()">
                        Load More Results
                    </button>
                `;
                resultsContainer.appendChild(loadMoreContainer);
            }
        }
        
        function createNoteCard(note) {
            const card = document.createElement('div');
            card.className = 'note-card';
            
            const noteId = note.source_id + '-' + note.chunk_index;
            const projectNotes = savedNotes.get(currentProjectId);
            const isSaved = projectNotes && projectNotes.has ? projectNotes.has(noteId) : false;
            
            // Calculate percentage score
            const percentage = Math.round(note.score * 100);
            
            // Create author text if available
            const authorText = note.author && note.author !== 'Unknown Author' ? ` by ${note.author}` : '';
            
            card.innerHTML = `
                <div class="note-header">
                    <div class="note-meta">
                        <div class="note-score">${percentage}% match</div>
                        <div class="note-source">${note.source_title}${authorText}</div>
                    </div>
                    <div class="note-actions">
                        <button class="note-action-btn ${isSaved ? 'saved' : ''}" 
                                onclick="toggleSaveNote('${noteId}')" 
                                title="${isSaved ? 'Remove from project' : 'Save to project'}">
                            <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                      d="${isSaved ? 'M5 13l4 4L19 7' : 'M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z'}" />
                            </svg>
                        </button>
                        <button class="note-action-btn" 
                                onclick="showNoteInContext('${note.source_id}', '${note.source_title}', ${note.chunk_index})" 
                                title="View note in context">
                            <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                        </button>
                        <button class="note-action-btn" 
                                onclick="copyNoteContent('${note.content.replace(/'/g, "\\'")}', '${note.source_title}')" 
                                title="Copy note content">
                            <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="note-content">${note.content}</div>
            `;
            
            return card;
        }
        
        function toggleSaveNote(noteId) {
            if (!currentProjectId) {
                return;
            }
            
            // Ensure the current project has a savedNotes entry
            if (!savedNotes.has(currentProjectId)) {
                savedNotes.set(currentProjectId, new Set());
            }
            
            const projectNotes = savedNotes.get(currentProjectId);
            
            if (projectNotes.has(noteId)) {
                projectNotes.delete(noteId);
            } else {
                projectNotes.add(noteId);
            }
            
            // Update the button appearance
            const button = event.target.closest('.note-action-btn');
            const isSaved = projectNotes.has(noteId);
            
            button.classList.toggle('saved', isSaved);
            button.title = isSaved ? 'Remove from project' : 'Save to project';
            
            // Update the icon
            const svg = button.querySelector('svg path');
            svg.setAttribute('d', isSaved ? 'M5 13l4 4L19 7' : 'M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z');
            
            // Update project display and save
            updateProjectDisplay();
            saveProjectsToStorage();
            
            const project = projects.get(currentProjectId);
            console.log(`Note ${noteId} ${isSaved ? 'saved to' : 'removed from'} project: ${project?.title}`);
        }
        
        function showSourceNotes(sourceTitle) {
            // Set the source filter and apply filters
            document.getElementById('source-filter').value = sourceTitle;
            applyFilters();
            console.log(`Showing all notes from: ${sourceTitle}`);
        }
        
        async function copyNoteContent(content, sourceTitle) {
            const button = event.target.closest('.note-action-btn');
            const originalTitle = button.title;
            
            try {
                // Check if clipboard API is available
                if (navigator.clipboard && window.isSecureContext) {
                    // Modern clipboard API
                    await navigator.clipboard.writeText(content);
                } else {
                    // Fallback for older browsers or non-secure contexts
                    const textArea = document.createElement('textarea');
                    textArea.value = content;
                    textArea.style.position = 'fixed';
                    textArea.style.left = '-999999px';
                    textArea.style.top = '-999999px';
                    document.body.appendChild(textArea);
                    textArea.focus();
                    textArea.select();
                    
                    const successful = document.execCommand('copy');
                    document.body.removeChild(textArea);
                    
                    if (!successful) {
                        throw new Error('Copy command failed');
                    }
                }
                
                // Show success feedback
                button.title = 'Copied!';
                button.style.color = '#10b981';
                
                // Reset after 2 seconds
                setTimeout(() => {
                    button.title = originalTitle;
                    button.style.color = '';
                }, 2000);
                
                console.log(`Copied note from ${sourceTitle}`);
                
            } catch (error) {
                console.error('Failed to copy note:', error);
                
                // Show a more user-friendly fallback
                const copyText = `Note from ${sourceTitle}:\n\n${content}`;
                
                // Create a temporary modal for copying
                const modal = document.createElement('div');
                modal.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10000;
                `;
                
                modal.innerHTML = `
                    <div style="
                        background: white;
                        padding: 20px;
                        border-radius: 8px;
                        max-width: 500px;
                        max-height: 400px;
                        overflow-y: auto;
                        box-shadow: 0 10px 25px rgba(0,0,0,0.2);
                    ">
                        <h3 style="margin: 0 0 15px 0; color: #374151;">Copy Note Content</h3>
                        <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">Select and copy the text below:</p>
                        <textarea readonly style="
                            width: 100%;
                            height: 200px;
                            padding: 10px;
                            border: 1px solid #d1d5db;
                            border-radius: 4px;
                            font-family: inherit;
                            font-size: 14px;
                            resize: vertical;
                        ">${content}</textarea>
                        <div style="margin-top: 15px; text-align: right;">
                            <button onclick="this.closest('.modal').remove()" style="
                                background: #3b82f6;
                                color: white;
                                border: none;
                                padding: 8px 16px;
                                border-radius: 4px;
                                cursor: pointer;
                            ">Close</button>
                        </div>
                    </div>
                `;
                
                modal.className = 'modal';
                document.body.appendChild(modal);
                
                // Auto-select the text
                const textarea = modal.querySelector('textarea');
                textarea.focus();
                textarea.select();
            }
        }
        
        async function showNoteInContext(sourceId, sourceTitle, chunkIndex) {
            console.log(`Loading notes in context for: ${sourceTitle}, chunk: ${chunkIndex}`);
            
            // Show the source viewer
            const sourceViewer = document.getElementById('source-viewer');
            const titleElement = document.getElementById('source-viewer-title');
            const contentElement = document.getElementById('source-viewer-content');
            
            // Update title
            titleElement.textContent = `Notes from ${sourceTitle}`;
            
            // Show loading state
            contentElement.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </div>
                    <div class="empty-title">Loading notes...</div>
                    <div class="empty-description">Fetching notes from ${sourceTitle}</div>
                </div>
            `;
            
            sourceViewer.classList.add('active');
            
            try {
                // Get all notes from this specific source
                const response = await fetch(`${API_BASE}/sources/${sourceId}/notes`);
                
                if (!response.ok) {
                    throw new Error(`Failed to get source notes: ${response.status}`);
                }
                
                const sourceNotes = await response.json();
                
                if (sourceNotes.length === 0) {
                    contentElement.innerHTML = `
                        <div class="empty-state">
                            <div class="empty-icon">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                </svg>
                            </div>
                            <div class="empty-title">No notes found</div>
                            <div class="empty-description">No notes available for ${sourceTitle}</div>
                        </div>
                    `;
                    return;
                }
                
                // Sort by chunk_index to show in order
                sourceNotes.sort((a, b) => a.chunk_index - b.chunk_index);
                
                // Display notes with pagination
                contentElement.innerHTML = '';
                
                // Show first 20 notes initially
                const notesToShow = sourceNotes.slice(0, 20);
                const hasMore = sourceNotes.length > 20;
                
                notesToShow.forEach(note => {
                    const noteCard = createNoteCard(note);
                    // Add highlighting for the specific note
                    if (note.chunk_index === chunkIndex) {
                        noteCard.classList.add('highlighted-note');
                        noteCard.style.background = '#f0f9ff';
                        noteCard.style.border = '2px solid #3b82f6';
                    }
                    contentElement.appendChild(noteCard);
                });
                
                // Add "Load More" button if there are more notes
                if (hasMore) {
                    const loadMoreBtn = document.createElement('button');
                    loadMoreBtn.id = 'source-load-more-btn';
                    loadMoreBtn.className = 'load-more-btn';
                    loadMoreBtn.textContent = `Load More Notes (${sourceNotes.length - 20} remaining)`;
                    loadMoreBtn.onclick = () => loadMoreSourceNotes(sourceNotes, 20);
                    contentElement.appendChild(loadMoreBtn);
                }
                
                // Scroll to the specific note
                setTimeout(() => {
                    const targetNote = contentElement.querySelector('.highlighted-note');
                    if (targetNote) {
                        targetNote.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }, 100);
                
            } catch (error) {
                console.error('Error loading source notes:', error);
                contentElement.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                        <div class="empty-title">Error Loading Notes</div>
                        <div class="empty-description">Could not load notes from ${sourceTitle}</div>
                    </div>
                `;
            }
        }
        
        function loadMoreSourceNotes(allNotes, currentCount) {
            const contentElement = document.getElementById('source-viewer-content');
            const loadMoreBtn = document.getElementById('source-load-more-btn');
            
            // Load next 20 notes
            const nextBatch = allNotes.slice(currentCount, currentCount + 20);
            const remaining = allNotes.length - (currentCount + 20);
            
            nextBatch.forEach(note => {
                const noteCard = createNoteCard(note);
                contentElement.insertBefore(noteCard, loadMoreBtn);
            });
            
            // Update button or remove it
            if (remaining > 0) {
                loadMoreBtn.textContent = `Load More Notes (${remaining} remaining)`;
                loadMoreBtn.onclick = () => loadMoreSourceNotes(allNotes, currentCount + 20);
            } else {
                loadMoreBtn.remove();
            }
        }
        
        async function showSourceNotesFromLibrary(sourceId, sourceTitle) {
            console.log(`Loading notes for source: ${sourceTitle}`);
            
            // Show the source viewer
            const sourceViewer = document.getElementById('source-viewer');
            const titleElement = document.getElementById('source-viewer-title');
            const contentElement = document.getElementById('source-viewer-content');
            
            // Update title
            titleElement.textContent = `Notes from ${sourceTitle}`;
            
            // Show loading state
            contentElement.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </div>
                    <div class="empty-title">Loading notes...</div>
                    <div class="empty-description">Fetching notes from ${sourceTitle}</div>
                </div>
            `;
            
            sourceViewer.classList.add('active');
            
            try {
                // Get all notes from this specific source
                const response = await fetch(`${API_BASE}/sources/${sourceId}/notes`);
                
                if (!response.ok) {
                    throw new Error(`Failed to get source notes: ${response.status}`);
                }
                
                const sourceNotes = await response.json();
                
                if (sourceNotes.length === 0) {
                    contentElement.innerHTML = `
                        <div class="empty-state">
                            <div class="empty-icon">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                </svg>
                            </div>
                            <div class="empty-title">No notes found</div>
                            <div class="empty-description">No notes available for ${sourceTitle}</div>
                        </div>
                    `;
                    return;
                }
                
                // Sort by chunk_index to show in order
                sourceNotes.sort((a, b) => a.chunk_index - b.chunk_index);
                
                // Display notes with pagination
                contentElement.innerHTML = '';
                
                // Show first 20 notes initially
                const notesToShow = sourceNotes.slice(0, 20);
                const hasMore = sourceNotes.length > 20;
                
                notesToShow.forEach(note => {
                    const noteCard = createNoteCard(note);
                    contentElement.appendChild(noteCard);
                });
                
                // Add "Load More" button if there are more notes
                if (hasMore) {
                    const loadMoreBtn = document.createElement('button');
                    loadMoreBtn.id = 'source-load-more-btn';
                    loadMoreBtn.className = 'load-more-btn';
                    loadMoreBtn.textContent = `Load More Notes (${sourceNotes.length - 20} remaining)`;
                    loadMoreBtn.onclick = () => loadMoreSourceNotes(sourceNotes, 20);
                    contentElement.appendChild(loadMoreBtn);
                }
                
                console.log(`Loaded ${sourceNotes.length} notes from ${sourceTitle}`);
                
            } catch (error) {
                console.error('Error loading source notes:', error);
                contentElement.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                        <div class="empty-title">Error Loading Notes</div>
                        <div class="empty-description">Could not load notes from ${sourceTitle}</div>
                    </div>
                `;
            }
        }
        
        function displayEmptyState() {
            const resultsContainer = document.getElementById('notes-results');
            resultsContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                        </svg>
                    </div>
                    <div class="empty-title">No notes yet</div>
                    <div class="empty-description">Search or start writing to see relevant notes</div>
                </div>
            `;
        }
        
        function displayErrorState() {
            const resultsContainer = document.getElementById('notes-results');
            resultsContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    <div class="empty-title">Search Error</div>
                    <div class="empty-description">Could not perform search. Please try again.</div>
                </div>
            `;
        }
        
        function showUploadInterface() {
            console.log('Showing upload interface');
            document.getElementById('upload-form').style.display = 'block';
        }
        
        function hideUploadInterface() {
            document.getElementById('upload-form').style.display = 'none';
            document.getElementById('upload-title').value = '';
            document.getElementById('upload-author').value = '';
            document.getElementById('upload-status').innerHTML = '';
            document.getElementById('selected-file').style.display = 'none';
            document.getElementById('upload-btn').disabled = true;
            selectedFile = null;
        }
        
        function handleFileSelection(file) {
            if (!file) return;
            
            selectedFile = file;
            
            // Show selected file info
            const fileInfo = document.getElementById('selected-file');
            fileInfo.innerHTML = `
                <strong>Selected:</strong> ${file.name} 
                <span style="color: #6b7280;">(${(file.size / 1024).toFixed(1)} KB)</span>
            `;
            fileInfo.style.display = 'block';
            
            // Auto-fill title if empty
            const titleInput = document.getElementById('upload-title');
            if (!titleInput.value) {
                const fileName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
                titleInput.value = fileName;
            }
            
            // Enable upload button
            document.getElementById('upload-btn').disabled = false;
        }
        
        async function processUpload() {
            const title = document.getElementById('upload-title').value.trim();
            const author = document.getElementById('upload-author').value.trim();
            const statusDiv = document.getElementById('upload-status');
            const uploadBtn = document.getElementById('upload-btn');
            
            if (!title) {
                statusDiv.innerHTML = '<span style="color: #dc2626;">Please enter a title</span>';
                return;
            }
            
            if (!selectedFile) {
                statusDiv.innerHTML = '<span style="color: #dc2626;">Please select a file</span>';
                return;
            }
            
            console.log('Selected file:', selectedFile);
            console.log('File name:', selectedFile.name);
            console.log('File size:', selectedFile.size);
            console.log('File type:', selectedFile.type);
            
            const tempId = 'temp-' + Date.now();
            
            uploadBtn.disabled = true;
            uploadBtn.textContent = 'Uploading...';
            statusDiv.innerHTML = '<span style="color: #3b82f6;">Starting upload...</span>';
            
            // Show progress for large files
            if (selectedFile.size > 100000) { // > 100KB
                setTimeout(() => {
                    if (uploadBtn.disabled) {
                        statusDiv.innerHTML = '<span style="color: #3b82f6;">⏳ Processing large file... This may take several minutes</span>';
                    }
                }, 30000); // After 30 seconds
            }
            
            // Set up timeout for large files (15 minutes)
            const uploadTimeout = setTimeout(() => {
                statusDiv.innerHTML = '<span style="color: #dc2626;">⚠ Upload timeout - file may be too large or complex</span>';
                uploadBtn.disabled = false;
                uploadBtn.textContent = 'Upload & Process';
            }, 15 * 60 * 1000); // 15 minutes
            
            try {
                const fileName = selectedFile.name.toLowerCase();
                let sourceType = 'txt';
                if (fileName.endsWith('.json')) {
                    sourceType = 'json';
                } else if (fileName.endsWith('.pdf')) {
                    sourceType = 'pdf';
                } else if (fileName.endsWith('.epub')) {
                    sourceType = 'epub';
                }
                
                const tempId = 'temp-' + Date.now();
                
                addSourceToUI({
                    id: tempId,
                    title: title,
                    author: author || 'Unknown Author',
                    source_type: sourceType,
                    status: 'processing'
                });
                
                // Don't hide the interface yet - we need to keep selectedFile
                // hideUploadInterface();
                
                // Prepare upload data based on file type
                let uploadData = {
                    title: title,
                    author: author || 'Unknown Author',
                    source_type: sourceType
                };
                
                if (sourceType === 'pdf' || sourceType === 'epub') {
                    // For binary files, send as base64 buffer
                    console.log('Processing binary file:', selectedFile.name, 'Size:', selectedFile.size);
                    const arrayBuffer = await selectedFile.arrayBuffer();
                    console.log('ArrayBuffer created, size:', arrayBuffer.byteLength);
                    
                    // Convert to base64 in chunks to avoid stack overflow
                    const uint8Array = new Uint8Array(arrayBuffer);
                    let binaryString = '';
                    const chunkSize = 8192; // Process in 8KB chunks
                    
                    for (let i = 0; i < uint8Array.length; i += chunkSize) {
                        const chunk = uint8Array.slice(i, i + chunkSize);
                        binaryString += String.fromCharCode(...chunk);
                    }
                    
                    const base64 = btoa(binaryString);
                    console.log('Base64 conversion complete, length:', base64.length);
                    uploadData.file_buffer = base64;
                } else {
                    // For text files, send as content
                    const content = await readFileContent(selectedFile);
                    uploadData.content = content;
                }
                
                const response = await fetch(`${API_BASE}/upload-source`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(uploadData)
                });
                
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Upload failed: ${response.status} - ${errorText}`);
                }
                
                const result = await response.json();
                console.log('Upload successful:', result);
                
                updateSourceStatus(tempId, {
                    id: result.source_id,
                    chunks_created: result.chunks_created,
                    status: 'completed'
                });
                
                // Show success message
                statusDiv.innerHTML = '<span style="color: #059669;">✓ Upload completed successfully</span>';
                clearTimeout(uploadTimeout);
                
                // Hide upload interface after successful upload
                hideUploadInterface();
                
            } catch (error) {
                console.error('Upload error:', error);
                clearTimeout(uploadTimeout);
                
                // Show detailed error message
                let errorMessage = 'Upload failed';
                if (error.message.includes('timeout')) {
                    errorMessage = 'Upload timeout - file may be too large or complex';
                } else if (error.message.includes('413')) {
                    errorMessage = 'File too large - please try a smaller file';
                } else if (error.message.includes('500')) {
                    errorMessage = 'Server error - file may be corrupted or unsupported';
                } else {
                    errorMessage = `Upload failed: ${error.message}`;
                }
                
                statusDiv.innerHTML = `<span style="color: #dc2626;">⚠ ${errorMessage}</span>`;
                
                // Only try to update source status if tempId exists
                if (typeof tempId !== 'undefined') {
                    updateSourceStatus(tempId, {
                        status: 'error',
                        error: error.message
                    });
                }
            } finally {
                uploadBtn.disabled = false;
                uploadBtn.textContent = 'Upload & Process';
            }
        }
        
        async function deleteSource(sourceId, sourceTitle) {
            if (!confirm(`Are you sure you want to delete "${sourceTitle}"?`)) {
                return;
            }
            
            const sourceCard = document.getElementById(`source-${sourceId}`);
            if (sourceCard) {
                sourceCard.style.opacity = '0.5';
                sourceCard.style.pointerEvents = 'none';
            }
            
            try {
                const response = await fetch(`${API_BASE}/sources/${sourceId}`, {
                    method: 'DELETE'
                });
                
                if (!response.ok) {
                    throw new Error(`Delete failed: ${response.status}`);
                }
                
                if (sourceCard) {
                    sourceCard.remove();
                }
                
                const sourcesList = document.getElementById('sources-list');
                if (sourcesList.children.length === 0) {
                    sourcesList.innerHTML = `
                        <div class="empty-state">
                            <div class="empty-icon">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                            </div>
                            <div class="empty-title">No sources yet</div>
                            <div class="empty-description">Upload your first source to get started</div>
                        </div>
                    `;
                }
                
            } catch (error) {
                console.error('Delete error:', error);
                if (sourceCard) {
                    sourceCard.style.opacity = '1';
                    sourceCard.style.pointerEvents = 'auto';
                }
            }
        }
        
        async function loadSourcesFromBackend() {
            const sourcesList = document.getElementById('sources-list');
            
            try {
                const response = await fetch(`${API_BASE}/sources`);
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }
                
                const sources = await response.json();
                sourcesList.innerHTML = '';
                
                if (sources.length === 0) {
                    sourcesList.innerHTML = `
                        <div class="empty-state">
                            <div class="empty-icon">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                            </div>
                            <div class="empty-title">No sources yet</div>
                            <div class="empty-description">Upload your first source to get started</div>
                        </div>
                    `;
                } else {
                    sources.forEach(source => {
                        addSourceToUI({
                            id: source.id,
                            title: source.title,
                            author: source.author,
                            source_type: source.source_type,
                            status: 'completed',
                            chunks_created: source.chunk_count
                        });
                    });
                }
                
            } catch (error) {
                console.error('Error loading sources:', error);
                sourcesList.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                        <div class="empty-title">Connection Error</div>
                        <div class="empty-description">Could not load sources. Is your backend running?</div>
                    </div>
                `;
            }
        }
        
        function addSourceToUI(source) {
            const sourcesList = document.getElementById('sources-list');
            
            const emptyState = sourcesList.querySelector('.empty-state');
            if (emptyState) {
                emptyState.remove();
            }
            
            const sourceCard = document.createElement('div');
            sourceCard.className = 'source-card';
            sourceCard.id = `source-${source.id}`;
            
            const statusBadge = getStatusBadge(source.status, source);
            const icon = getSourceIcon(source.source_type);
            
            sourceCard.innerHTML = `
                <div class="source-header">
                    <div class="source-icon">${icon}</div>
                    <div class="source-info">
                        <div class="source-title">${source.title}</div>
                        <div class="source-author">${source.author}</div>
                    </div>
                    ${statusBadge}
                </div>
                <div class="source-actions" style="display: ${source.status === 'processing' ? 'none' : 'flex'};">
                    <button class="source-action-btn" onclick="showSourceNotesFromLibrary('${source.id}', '${source.title}')">Notes</button>
                    <button class="source-action-btn" onclick="alert('Details for: ${source.title}')">Details</button>
                    <button class="source-action-btn delete" onclick="deleteSource('${source.id}', '${source.title}')">Delete</button>
                </div>
            `;

            sourcesList.insertBefore(sourceCard, sourcesList.firstChild);
        }
        
        function updateSourceStatus(tempId, updateData) {
            const sourceCard = document.getElementById(`source-${tempId}`);
            if (!sourceCard) return;
            
            if (updateData.id && updateData.id !== tempId) {
                sourceCard.id = `source-${updateData.id}`;
            }
            
            if (updateData.status) {
                const statusBadge = getStatusBadge(updateData.status, updateData);
                const existingBadge = sourceCard.querySelector('.status-badge');
                if (existingBadge) {
                    existingBadge.outerHTML = statusBadge;
                }
            }
            
            const actionsDiv = sourceCard.querySelector('.source-actions');
            if (actionsDiv && updateData.status) {
                actionsDiv.style.display = updateData.status === 'completed' ? 'flex' : 'none';
            }
        }
        
        function getStatusBadge(status, data = {}) {
            let badgeClass = 'status-badge';
            let badgeText = '';
            
            switch (status) {
                case 'processing':
                    badgeClass += ' processing';
                    badgeText = 'Processing...';
                    break;
                case 'completed':
                    badgeText = `${data.chunks_created || 0} notes`;
                    break;
                case 'error':
                    badgeClass += ' error';
                    badgeText = 'Error';
                    break;
                default:
                    return '';
            }
            
            return `<div class="${badgeClass}">${badgeText}</div>`;
        }
        
        function getSourceIcon(sourceType) {
            switch (sourceType) {
                case 'txt': 
                    return '<svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>';
                case 'json': 
                    return '<svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>';
                case 'pdf': 
                    return '<svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>';
                case 'epub':
                    return '<svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>';
                case 'docx':
                case 'doc':
                    return '<svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>';
                case 'md':
                case 'markdown':
                    return '<svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>';
                default: 
                    return '<svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>';
            }
        }
        
        function readFileContent(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.onerror = (e) => reject(new Error('Failed to read file'));
                reader.readAsText(file);
            });
        }
        
        // File input handling
        document.addEventListener('DOMContentLoaded', function() {
            // Initialize projects
            initializeProjects();
            
            // Add auto-save for title
            const titleInput = document.getElementById('document-title');
            if (titleInput) {
                titleInput.addEventListener('input', updateProjectContent);
            }
            
            const fileInput = document.getElementById('file-input');
            const dropArea = document.querySelector('.file-drop-area');
            
            if (fileInput && dropArea) {
                fileInput.addEventListener('change', function(e) {
                    handleFileSelection(e.target.files[0]);
                });
                
                dropArea.addEventListener('dragover', function(e) {
                    e.preventDefault();
                    dropArea.classList.add('dragover');
                });
                
                dropArea.addEventListener('dragleave', function(e) {
                    e.preventDefault();
                    dropArea.classList.remove('dragover');
                });
                
                dropArea.addEventListener('drop', function(e) {
                    e.preventDefault();
                    dropArea.classList.remove('dragover');
                    handleFileSelection(e.dataTransfer.files[0]);
                });
            }
            
            console.log('Research Assistant loaded successfully');
        });
        
        // Make functions globally accessible
        window.switchToPanel = switchToPanel;
        window.showUploadInterface = showUploadInterface;
        window.hideUploadInterface = hideUploadInterface;
        window.processUpload = processUpload;
        window.deleteSource = deleteSource;
        window.performSearch = performSearch;
        window.performAutoSearch = performAutoSearch;
        window.loadMoreResults = loadMoreResults;
        window.applyFilters = applyFilters;
        window.toggleSaveNote = toggleSaveNote;
        window.showSourceNotes = showSourceNotes;
        window.showSourceNotesFromLibrary = showSourceNotesFromLibrary;
        window.handleEditorInput = handleEditorInput;
        window.toggleAutoSearch = toggleAutoSearch;
        window.showCreateProjectModal = showCreateProjectModal;
        window.hideCreateProjectModal = hideCreateProjectModal;
        window.createNewProject = createNewProject;
        window.deleteProject = deleteProject;
        window.hideDeleteProjectModal = hideDeleteProjectModal;
        window.confirmDeleteProject = confirmDeleteProject;
        window.loadProject = loadProject;
        window.toggleSidebar = toggleSidebar;
        window.togglePanel = togglePanel;
        window.expandSidebar = expandSidebar;
        window.showNoteInContext = showNoteInContext;
        window.copyNoteContent = copyNoteContent;
        window.loadMoreSourceNotes = loadMoreSourceNotes;
        window.handleSearchKeydown = handleSearchKeydown;
        window.performManualSearch = performManualSearch;
        window.closeSourceViewer = closeSourceViewer;
    </script>
</body>
</html>
