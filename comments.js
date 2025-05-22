// Enhanced Comments System JavaScript with Hidden Owner Mode

// Configuration
const OWNER_PASSWORD = 'admin123'; // Ganti dengan password yang aman
const OWNER_SESSION_KEY = 'comments_owner_session';

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeComments();
    setupHiddenOwnerMode();
});

// Initialize comments system
function initializeComments() {
    // Get current page for comment storage
    const currentPage = getCurrentPage();
    
    // Load existing comments
    loadComments(currentPage);
    
    // Setup form handlers
    setupCommentForm(currentPage);
    
    // Setup anonymous toggle
    setupAnonymousToggle();
    
    // Update comment count
    updateCommentCount(currentPage);
}

// Get current page identifier
function getCurrentPage() {
    const path = window.location.pathname;
    if (path.includes('artificial-intelligence')) {
        return 'ai';
    } else if (path.includes('cryptocurrency')) {
        return 'crypto';
    }
    return 'default';
}

// Toggle comments section visibility
function toggleComments() {
    const commentsSection = document.getElementById('comments-section');
    const toggleBtn = document.querySelector('.comment-toggle-btn');
    
    if (commentsSection.classList.contains('active')) {
        commentsSection.classList.remove('active');
        toggleBtn.innerHTML = `
            <i class="fas fa-comments"></i>
            <span>Comments</span>
            <span class="comment-count" id="total-comments">${getCommentCount(getCurrentPage())}</span>
        `;
    } else {
        commentsSection.classList.add('active');
        toggleBtn.innerHTML = `
            <i class="fas fa-times"></i>
            <span>Hide Comments</span>
            <span class="comment-count" id="total-comments">${getCommentCount(getCurrentPage())}</span>
        `;
        
        // Scroll to comments section smoothly
        setTimeout(() => {
            commentsSection.scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
            });
        }, 300);
    }
}

// Setup comment form
function setupCommentForm(page) {
    const commentForm = document.getElementById('comment-form');
    
    if (commentForm) {
        commentForm.addEventListener('submit', function(e) {
            e.preventDefault();
            submitComment(page);
        });
    }
}

// Setup anonymous toggle
function setupAnonymousToggle() {
    const anonymousToggle = document.getElementById('anonymous-toggle');
    const nameInput = document.getElementById('name-input');
    const commenterName = document.getElementById('commenter-name');
    
    if (anonymousToggle && nameInput) {
        anonymousToggle.addEventListener('change', function() {
            if (this.checked) {
                nameInput.classList.add('hidden');
                commenterName.required = false;
                commenterName.value = '';
            } else {
                nameInput.classList.remove('hidden');
                commenterName.required = false;
            }
        });
    }
}

// Submit comment
function submitComment(page) {
    const anonymousToggle = document.getElementById('anonymous-toggle');
    const commenterName = document.getElementById('commenter-name');
    const commentText = document.getElementById('comment-text');
    
    // Get form data
    const isAnonymous = anonymousToggle.checked;
    const name = isAnonymous ? 'Anonymous' : (commenterName.value.trim() || 'Anonymous');
    const text = commentText.value.trim();
    
    if (!text) {
        showNotification('Please enter a comment', 'error');
        return;
    }
    
    // Create comment object
    const comment = {
        id: generateCommentId(),
        author: name,
        content: text,
        timestamp: new Date().toISOString(),
        isAnonymous: isAnonymous,
        authorId: generateAuthorId(name, isAnonymous),
        replies: []
    };
    
    // Save comment
    saveComment(page, comment);
    
    // Add to display
    addCommentToDisplay(comment);
    
    // Reset form
    commentText.value = '';
    if (!isAnonymous) {
        commenterName.value = '';
    }
    
    // Update comment count
    updateCommentCount(page);
    
    // Show success notification
    showNotification('Comment posted successfully!', 'success');
}

// Submit reply
function submitReply(page, parentId, replyData) {
    const comment = {
        id: generateCommentId(),
        author: replyData.author,
        content: replyData.content,
        timestamp: new Date().toISOString(),
        isAnonymous: replyData.isAnonymous,
        authorId: generateAuthorId(replyData.author, replyData.isAnonymous),
        parentId: parentId
    };
    
    // Add reply to parent comment
    addReplyToComment(page, parentId, comment);
    
    // Refresh display
    loadComments(page);
    
    // Show success notification
    showNotification('Reply posted successfully!', 'success');
}

// Generate unique comment ID
function generateCommentId() {
    return 'comment_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Generate author ID for ownership tracking
function generateAuthorId(name, isAnonymous) {
    if (isAnonymous) {
        return 'anon_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    }
    return btoa(name + '_' + navigator.userAgent + '_' + (localStorage.getItem('user_session') || createUserSession()));
}

// Create user session for tracking
function createUserSession() {
    const session = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('user_session', session);
    return session;
}

// Check if user owns the comment
function isCommentOwner(comment) {
    if (isOwnerMode()) return true;
    
    const currentAuthorId = generateAuthorId(comment.author, comment.isAnonymous);
    return comment.authorId === currentAuthorId;
}

// Save comment to localStorage
function saveComment(page, comment) {
    const storageKey = `comments_${page}`;
    let comments = JSON.parse(localStorage.getItem(storageKey) || '[]');
    comments.unshift(comment);
    localStorage.setItem(storageKey, JSON.stringify(comments));
}

// Add reply to parent comment
function addReplyToComment(page, parentId, reply) {
    const storageKey = `comments_${page}`;
    let comments = JSON.parse(localStorage.getItem(storageKey) || '[]');
    
    function addReplyRecursive(commentList) {
        for (let comment of commentList) {
            if (comment.id === parentId) {
                if (!comment.replies) comment.replies = [];
                comment.replies.push(reply);
                return true;
            }
            if (comment.replies && addReplyRecursive(comment.replies)) {
                return true;
            }
        }
        return false;
    }
    
    addReplyRecursive(comments);
    localStorage.setItem(storageKey, JSON.stringify(comments));
}

// Delete comment
function deleteComment(page, commentId) {
    const storageKey = `comments_${page}`;
    let comments = JSON.parse(localStorage.getItem(storageKey) || '[]');
    
    function deleteRecursive(commentList) {
        for (let i = 0; i < commentList.length; i++) {
            if (commentList[i].id === commentId) {
                commentList.splice(i, 1);
                return true;
            }
            if (commentList[i].replies && deleteRecursive(commentList[i].replies)) {
                return true;
            }
        }
        return false;
    }
    
    if (deleteRecursive(comments)) {
        localStorage.setItem(storageKey, JSON.stringify(comments));
        loadComments(page);
        updateCommentCount(page);
        showNotification('Comment deleted successfully!', 'success');
    }
}

// Load comments from localStorage
function loadComments(page) {
    const storageKey = `comments_${page}`;
    const comments = JSON.parse(localStorage.getItem(storageKey) || '[]');
    
    const commentsList = document.getElementById('comments-list');
    if (!commentsList) return;
    
    if (comments.length === 0) {
        showEmptyState();
    } else {
        commentsList.innerHTML = '';
        comments.forEach(comment => {
            addCommentToDisplay(comment, false);
        });
    }
}

// Add comment to display
function addCommentToDisplay(comment, animate = true) {
    const commentsList = document.getElementById('comments-list');
    if (!commentsList) return;
    
    // Remove empty state if it exists
    const emptyState = commentsList.querySelector('.comments-empty');
    if (emptyState) {
        emptyState.remove();
    }
    
    // Create comment element
    const commentElement = createCommentElement(comment);
    
    if (animate) {
        commentsList.insertBefore(commentElement, commentsList.firstChild);
        setTimeout(() => {
            commentElement.style.opacity = '1';
            commentElement.style.transform = 'translateY(0)';
        }, 50);
    } else {
        commentsList.appendChild(commentElement);
    }
}

// Create comment HTML element
function createCommentElement(comment, isReply = false) {
    const commentDiv = document.createElement('div');
    commentDiv.className = `comment-item ${isReply ? 'comment-reply' : ''}`;
    commentDiv.style.opacity = '0';
    commentDiv.style.transform = 'translateY(20px)';
    commentDiv.style.transition = 'all 0.5s ease';
    commentDiv.setAttribute('data-comment-id', comment.id);
    
    // Get author initial for avatar
    const initial = comment.author.charAt(0).toUpperCase();
    
    // Format timestamp
    const timeAgo = formatTimeAgo(new Date(comment.timestamp));
    
    // Check if user can delete this comment
    const canDelete = isCommentOwner(comment) || isOwnerMode();
    
    // Build action buttons
    let actionButtons = '';
    if (!isReply) {
        actionButtons += `<button class="reply-btn" onclick="showReplyForm('${comment.id}')"><i class="fas fa-reply"></i> Reply</button>`;
    }
    if (canDelete) {
        actionButtons += `<button class="delete-btn" onclick="confirmDeleteComment('${comment.id}')"><i class="fas fa-trash"></i> Delete</button>`;
    }
    
    commentDiv.innerHTML = `
        <div class="comment-header">
            <div class="comment-author">
                <div class="author-avatar">${initial}</div>
                <span class="author-name">${escapeHtml(comment.author)}</span>
                ${isOwnerMode() ? `<span class="owner-badge">Owner</span>` : ''}
            </div>
            <span class="comment-time">${timeAgo}</span>
        </div>
        <div class="comment-content">
            ${escapeHtml(comment.content).replace(/\n/g, '<br>')}
        </div>
        <div class="comment-actions">
            ${actionButtons}
        </div>
        <div class="reply-form-container" id="reply-form-${comment.id}" style="display: none;">
            <form class="reply-form" onsubmit="handleReplySubmit(event, '${comment.id}')">
                <div class="form-group">
                    <div class="name-toggle">
                        <label class="toggle-switch">
                            <input type="checkbox" id="reply-anonymous-${comment.id}">
                            <span class="slider"></span>
                        </label>
                        <span class="toggle-label">Reply anonymously</span>
                    </div>
                    <div class="name-input" id="reply-name-input-${comment.id}">
                        <input type="text" id="reply-name-${comment.id}" placeholder="Your name (optional)">
                    </div>
                </div>
                <div class="form-group">
                    <textarea id="reply-text-${comment.id}" placeholder="Write your reply..." rows="3" required></textarea>
                </div>
                <div class="form-actions">
                    <button type="button" class="cancel-btn" onclick="hideReplyForm('${comment.id}')">Cancel</button>
                    <button type="submit" class="submit-btn">
                        <i class="fas fa-paper-plane"></i> Post Reply
                    </button>
                </div>
            </form>
        </div>
    `;
    
    // Add replies if they exist
    if (comment.replies && comment.replies.length > 0) {
        const repliesContainer = document.createElement('div');
        repliesContainer.className = 'replies-container';
        
        comment.replies.forEach(reply => {
            const replyElement = createCommentElement(reply, true);
            repliesContainer.appendChild(replyElement);
        });
        
        commentDiv.appendChild(repliesContainer);
    }
    
    // Setup reply form toggle for this comment
    setTimeout(() => {
        const replyToggle = commentDiv.querySelector(`#reply-anonymous-${comment.id}`);
        const replyNameInput = commentDiv.querySelector(`#reply-name-input-${comment.id}`);
        
        if (replyToggle && replyNameInput) {
            replyToggle.addEventListener('change', function() {
                if (this.checked) {
                    replyNameInput.classList.add('hidden');
                } else {
                    replyNameInput.classList.remove('hidden');
                }
            });
        }
    }, 100);
    
    return commentDiv;
}

// Show reply form
function showReplyForm(commentId) {
    const replyForm = document.getElementById(`reply-form-${commentId}`);
    if (replyForm) {
        replyForm.style.display = 'block';
        const textarea = replyForm.querySelector('textarea');
        if (textarea) {
            textarea.focus();
        }
    }
}

// Hide reply form
function hideReplyForm(commentId) {
    const replyForm = document.getElementById(`reply-form-${commentId}`);
    if (replyForm) {
        replyForm.style.display = 'none';
        // Reset form
        const form = replyForm.querySelector('form');
        if (form) {
            form.reset();
        }
    }
}

// Handle reply form submission
function handleReplySubmit(event, parentId) {
    event.preventDefault();
    
    const isAnonymous = document.getElementById(`reply-anonymous-${parentId}`).checked;
    const name = isAnonymous ? 'Anonymous' : (document.getElementById(`reply-name-${parentId}`).value.trim() || 'Anonymous');
    const content = document.getElementById(`reply-text-${parentId}`).value.trim();
    
    if (!content) {
        showNotification('Please enter a reply', 'error');
        return;
    }
    
    const replyData = {
        author: name,
        content: content,
        isAnonymous: isAnonymous
    };
    
    submitReply(getCurrentPage(), parentId, replyData);
    hideReplyForm(parentId);
}

// Confirm delete comment
function confirmDeleteComment(commentId) {
    if (confirm('Are you sure you want to delete this comment? This action cannot be undone.')) {
        deleteComment(getCurrentPage(), commentId);
    }
}

// Hidden Owner Mode Setup
function setupHiddenOwnerMode() {
    let keySequence = [];
    const targetSequence = ['KeyO', 'KeyW', 'KeyN', 'KeyE', 'KeyR']; // Type "OWNER"
    
    // Keyboard shortcut listener
    document.addEventListener('keydown', function(e) {
        // Reset if too much time passed
        if (keySequence.length > 0 && Date.now() - keySequence[keySequence.length - 1].time > 2000) {
            keySequence = [];
        }
        
        // Add current key to sequence
        keySequence.push({
            code: e.code,
            time: Date.now()
        });
        
        // Keep only the last 5 keys
        if (keySequence.length > 5) {
            keySequence = keySequence.slice(-5);
        }
        
        // Check if sequence matches
        if (keySequence.length === 5) {
            const matches = keySequence.every((key, index) => key.code === targetSequence[index]);
            if (matches) {
                toggleOwnerMode();
                keySequence = [];
            }
        }
    });
    
    // Alternative: Double-click on footer
    const footer = document.querySelector('footer');
    if (footer) {
        let clickCount = 0;
        footer.addEventListener('click', function(e) {
            clickCount++;
            setTimeout(() => { clickCount = 0; }, 500);
            
            if (clickCount === 3) { // Triple click
                toggleOwnerMode();
                clickCount = 0;
            }
        });
    }
    
    // Alternative: Konami code style (up, up, down, down, left, right, left, right)
    let konamiSequence = [];
    const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight'];
    
    document.addEventListener('keydown', function(e) {
        konamiSequence.push(e.code);
        if (konamiSequence.length > 8) {
            konamiSequence = konamiSequence.slice(-8);
        }
        
        if (konamiSequence.length === 8 && konamiSequence.every((key, index) => key === konamiCode[index])) {
            toggleOwnerMode();
            konamiSequence = [];
        }
    });
}

function toggleOwnerMode() {
    if (isOwnerMode()) {
        // Logout
        localStorage.removeItem(OWNER_SESSION_KEY);
        showNotification('Owner mode disabled', 'info');
        loadComments(getCurrentPage());
    } else {
        // Login
        const password = prompt('Enter owner password:');
        if (password === OWNER_PASSWORD) {
            localStorage.setItem(OWNER_SESSION_KEY, 'active');
            showNotification('Owner mode enabled - You can now delete any comment', 'success');
            loadComments(getCurrentPage());
        } else if (password !== null) { // User didn't cancel
            showNotification('Incorrect password', 'error');
        }
    }
}

function isOwnerMode() {
    return localStorage.getItem(OWNER_SESSION_KEY) === 'active';
}

// Show empty state
function showEmptyState() {
    const commentsList = document.getElementById('comments-list');
    if (!commentsList) return;
    
    commentsList.innerHTML = `
        <div class="comments-empty">
            <i class="fas fa-comments"></i>
            <h4>No comments yet</h4>
            <p>Be the first to share your thoughts on this topic!</p>
        </div>
    `;
}

// Get comment count
function getCommentCount(page) {
    const storageKey = `comments_${page}`;
    const comments = JSON.parse(localStorage.getItem(storageKey) || '[]');
    
    function countComments(commentList) {
        let count = commentList.length;
        commentList.forEach(comment => {
            if (comment.replies) {
                count += countComments(comment.replies);
            }
        });
        return count;
    }
    
    return countComments(comments);
}

// Update comment count in button
function updateCommentCount(page) {
    const countElement = document.getElementById('total-comments');
    if (countElement) {
        countElement.textContent = getCommentCount(page);
    }
}

// Format time ago
function formatTimeAgo(date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) {
        return 'Just now';
    } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 604800) {
        const days = Math.floor(diffInSeconds / 86400);
        return `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
        return date.toLocaleDateString();
    }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Show notification
function showNotification(message, type = 'info') {
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? 'linear-gradient(135deg, #4cc9f0, #7209b7)' : type === 'error' ? 'linear-gradient(135deg, #ff4757, #c44569)' : 'linear-gradient(135deg, #5f6368, #3c4043)'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        gap: 10px;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        z-index: 1000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        font-size: 0.95rem;
        font-weight: 500;
        max-width: 300px;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}