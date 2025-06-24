import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.11/firebase-app.js";
import { getDatabase, ref, push, onValue, remove } from "https://www.gstatic.com/firebasejs/9.6.11/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyDtGt8JxlkWUkJwY0mmFfS-09G-lRGX4_A",
    authDomain: "diskusi-5a10e.firebaseapp.com",
    databaseURL: "https://diskusi-5a10e-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "diskusi-5a10e",
    storageBucket: "diskusi-5a10e.appspot.com",
    messagingSenderId: "330276872342",
    appId: "1:330276872342:web:9241596c4df85e6ec3a2b7",
    measurementId: "G-YB30TE09QW"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const OWNER_PASSWORD = 'admin123';
const OWNER_SESSION_KEY = 'comments_owner_session';

function getCurrentPage() {
    const path = window.location.pathname;
    if (path.includes('artificial-intelligence')) return 'ai';
    if (path.includes('cryptocurrency')) return 'crypto';
    return 'default';
}

function generateCommentId() {
    return 'comment_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function createUserSession() {
    const session = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('user_session', session);
    return session;
}

function generateAuthorId(name, isAnonymous) {
    if (isAnonymous) return 'anon_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    return btoa(name + '_' + navigator.userAgent + '_' + (localStorage.getItem('user_session') || createUserSession()));
}

function isOwnerMode() {
    return localStorage.getItem(OWNER_SESSION_KEY) === 'active';
}

function isCommentOwner(comment) {
    if (isOwnerMode()) return true;
    const currentAuthorId = generateAuthorId(comment.author, comment.isAnonymous);
    return comment.authorId === currentAuthorId;
}

function formatTimeAgo(date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    if (diffInSeconds < 60) return 'Just now';
    const minutes = Math.floor(diffInSeconds / 60);
    if (diffInSeconds < 3600) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    const hours = Math.floor(diffInSeconds / 3600);
    if (diffInSeconds < 86400) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    const days = Math.floor(diffInSeconds / 86400);
    if (diffInSeconds < 604800) return `${days} day${days > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showNotification(message, type = 'info') {
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i> <span>${message}</span>`;
    notification.style.cssText = `position: fixed; top: 20px; right: 20px; background: ${type === 'success' ? 'linear-gradient(135deg, #4cc9f0, #7209b7)' : type === 'error' ? 'linear-gradient(135deg, #ff4757, #c44569)' : 'linear-gradient(135deg, #5f6368, #3c4043)'}; color: white; padding: 12px 20px; border-radius: 8px; display: flex; align-items: center; gap: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.2); z-index: 1000; transform: translateX(120%); transition: transform 0.3s ease; font-size: 0.95rem; font-weight: 500; max-width: 300px;`;
    document.body.appendChild(notification);
    setTimeout(() => { notification.style.transform = 'translateX(0)'; }, 100);
    setTimeout(() => {
        notification.style.transform = 'translateX(120%)';
        setTimeout(() => { if (notification.parentNode) notification.parentNode.removeChild(notification); }, 300);
    }, 3000);
}

function showEmptyState() {
    const commentsList = document.getElementById('comments-list');
    if (commentsList) commentsList.innerHTML = `<div class="comments-empty"><i class="fas fa-comments"></i><h4>No comments yet</h4><p>Be the first to share your thoughts!</p></div>`;
}

function updateCommentCountUI(count) {
    document.querySelectorAll('.comment-count').forEach(el => el.textContent = count);
}

function showReplyForm(commentId) {
    const replyForm = document.getElementById(`reply-form-${commentId}`);
    if (replyForm) {
        replyForm.style.display = 'block';
        replyForm.querySelector('textarea')?.focus();
    }
}

function hideReplyForm(commentId) {
    const replyForm = document.getElementById(`reply-form-${commentId}`);
    if (replyForm) {
        replyForm.style.display = 'none';
        const form = replyForm.querySelector('form');
        if (form) {
            form.reset();
            form.querySelector('.name-input')?.classList.add('hidden');
        }
    }
}

function createCommentElement(comment, isReply = false) {
    const commentDiv = document.createElement('div');
    commentDiv.className = `comment-item ${isReply ? 'comment-reply' : ''}`;
    commentDiv.setAttribute('data-comment-id', comment.id);

    const initial = comment.author.charAt(0).toUpperCase();
    const timeAgo = formatTimeAgo(new Date(comment.timestamp));
    const canDelete = isCommentOwner(comment);

    let actionButtons = '';
    if (!isReply) {
        actionButtons += `<button class="reply-btn" data-action="reply" data-comment-id="${comment.id}"><i class="fas fa-reply"></i> Reply</button>`;
    }
    if (canDelete) {
        actionButtons += `<button class="delete-btn" data-action="delete" data-comment-id="${comment.id}"><i class="fas fa-trash"></i> Delete</button>`;
    }

    commentDiv.innerHTML = `
        <div class="comment-header">
            <div class="comment-author">
                <div class="author-avatar">${initial}</div>
                <span class="author-name">${escapeHtml(comment.author)}</span>
                ${isOwnerMode() && canDelete ? `<span class="owner-badge">Owner</span>` : ''}
            </div>
            <span class="comment-time">${timeAgo}</span>
        </div>
        <div class="comment-content">${escapeHtml(comment.content).replace(/\n/g, '<br>')}</div>
        <div class="comment-actions">${actionButtons}</div>
        <div class="reply-form-container" id="reply-form-${comment.id}" style="display: none;">
            <form class="reply-form" data-action="submit-reply" data-parent-id="${comment.id}">
                <div class="form-group">
                    <div class="name-toggle"><label class="toggle-switch"><input type="checkbox" class="reply-anonymous-toggle"><span class="slider"></span></label><span class="toggle-label">Reply anonymously</span></div>
                    <div class="name-input hidden"><input type="text" class="reply-name" placeholder="Your name (optional)"></div>
                </div>
                <div class="form-group"><textarea class="reply-text" placeholder="Write your reply..." rows="3" required></textarea></div>
                <div class="form-actions">
                    <button type="button" class="cancel-btn" data-action="cancel-reply" data-comment-id="${comment.id}">Cancel</button>
                    <button type="submit" class="submit-btn"><i class="fas fa-paper-plane"></i> Post Reply</button>
                </div>
            </form>
        </div>
    `;

    if (comment.replies && Object.keys(comment.replies).length > 0) {
        const repliesContainer = document.createElement('div');
        repliesContainer.className = 'replies-container';
        const replies = Object.values(comment.replies).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        replies.forEach(reply => repliesContainer.appendChild(createCommentElement(reply, true)));
        commentDiv.appendChild(repliesContainer);
    }
    return commentDiv;
}

function submitComment(page) {
    const commenterName = document.getElementById('commenter-name').value.trim();
    const commentText = document.getElementById('comment-text').value.trim();
    const isAnonymous = document.getElementById('anonymous-toggle').checked;

    if (!commentText) return showNotification('Please enter a comment', 'error');

    const name = isAnonymous ? 'Anonymous' : (commenterName || 'Anonymous');
    const comment = {
        author: name,
        content: commentText,
        timestamp: new Date().toISOString(),
        isAnonymous: isAnonymous,
        authorId: generateAuthorId(name, isAnonymous),
        replies: {}
    };

    push(ref(db, `comments/${page}`), comment)
        .then(() => {
            showNotification('Comment posted successfully!', 'success');
            document.getElementById('comment-form').reset();
            document.getElementById('name-input').classList.remove('hidden');
        })
        .catch(error => showNotification('Failed to post comment.', 'error'));
}

function submitReply(page, parentId, replyData) {
    const reply = {
        id: generateCommentId(),
        ...replyData,
        timestamp: new Date().toISOString(),
        authorId: generateAuthorId(replyData.author, replyData.isAnonymous),
        parentId: parentId
    };

    push(ref(db, `comments/${page}/${parentId}/replies`), reply)
        .then(() => showNotification('Reply posted successfully!', 'success'))
        .catch(error => showNotification('Failed to post reply.', 'error'));
}

function deleteComment(page, commentId) {
    remove(ref(db, `comments/${page}/${commentId}`))
        .then(() => showNotification('Comment deleted successfully!', 'success'))
        .catch(error => showNotification('Failed to delete comment.', 'error'));
}

function listenToComments(page) {
    const commentsRef = ref(db, `comments/${page}`);
    onValue(commentsRef, (snapshot) => {
        const commentsList = document.getElementById('comments-list');
        if (!commentsList) return;

        commentsList.innerHTML = '';
        const commentsData = snapshot.val();

        if (!commentsData) {
            showEmptyState();
            updateCommentCountUI(0);
            return;
        }

        const comments = Object.entries(commentsData).map(([id, data]) => ({ id, ...data }));
        comments.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        let totalComments = 0;
        comments.forEach(comment => {
            totalComments++;
            if (comment.replies) totalComments += Object.keys(comment.replies).length;
            const commentElement = createCommentElement(comment);
            commentsList.appendChild(commentElement);
        });
        
        updateCommentCountUI(totalComments);
    }, { onlyOnce: false });
}

function toggleOwnerMode() {
    if (isOwnerMode()) {
        localStorage.removeItem(OWNER_SESSION_KEY);
        showNotification('Owner mode disabled', 'info');
    } else {
        const password = prompt('Enter owner password:');
        if (password === OWNER_PASSWORD) {
            localStorage.setItem(OWNER_SESSION_KEY, 'active');
            showNotification('Owner mode enabled', 'success');
        } else if (password !== null) {
            showNotification('Incorrect password', 'error');
        }
    }
    listenToComments(getCurrentPage());
}

function initializeAppAndListeners() {
    const page = getCurrentPage();
    
    listenToComments(page);

    document.getElementById('comment-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        submitComment(page);
    });

    document.getElementById('anonymous-toggle')?.addEventListener('change', function() {
        document.getElementById('name-input')?.classList.toggle('hidden', this.checked);
    });

    document.getElementById('comment-toggle-button')?.addEventListener('click', () => {
        const commentsSection = document.getElementById('comments-section');
        const toggleBtn = document.getElementById('comment-toggle-button');
        commentsSection.classList.toggle('active');
        if(commentsSection.classList.contains('active')) {
            toggleBtn.innerHTML = `<i class="fas fa-times"></i> <span>Hide Comments</span> <span class="comment-count">0</span>`;
            setTimeout(() => commentsSection.scrollIntoView({ behavior: 'smooth' }), 300);
        } else {
            toggleBtn.innerHTML = `<i class="fas fa-comments"></i> <span>Comments</span> <span class="comment-count">0</span>`;
        }
        listenToComments(page);
    });

    document.getElementById('comments-list')?.addEventListener('click', (e) => {
        const button = e.target.closest('button');
        if (!button) return;

        const action = button.dataset.action;
        const commentId = button.dataset.commentId;

        if (action === 'reply') showReplyForm(commentId);
        if (action === 'cancel-reply') hideReplyForm(commentId);
        if (action === 'delete') {
            if (confirm('Are you sure you want to delete this comment?')) {
                deleteComment(page, commentId);
            }
        }
    });

    document.getElementById('comments-list')?.addEventListener('submit', (e) => {
        if (e.target.dataset.action === 'submit-reply') {
            e.preventDefault();
            const form = e.target;
            const parentId = form.dataset.parentId;
            const content = form.querySelector('.reply-text').value.trim();
            if (!content) return showNotification('Please enter a reply', 'error');
            const isAnonymous = form.querySelector('.reply-anonymous-toggle').checked;
            const author = isAnonymous ? 'Anonymous' : (form.querySelector('.reply-name').value.trim() || 'Anonymous');
            submitReply(page, parentId, { author, content, isAnonymous });
            hideReplyForm(parentId);
        }
    });

    document.getElementById('comments-list')?.addEventListener('change', (e) => {
        if(e.target.classList.contains('reply-anonymous-toggle')) {
            const form = e.target.closest('form');
            form.querySelector('.name-input').classList.toggle('hidden', e.target.checked);
        }
    });

    let keySequence = [];
    const targetSequence = ['KeyO', 'KeyW', 'KeyN', 'KeyE', 'KeyR'];
    document.addEventListener('keydown', (e) => {
        keySequence.push(e.code);
        keySequence = keySequence.slice(-5);
        if(keySequence.join('') === targetSequence.join('')) {
            toggleOwnerMode();
        }
    });
}

document.addEventListener('DOMContentLoaded', initializeAppAndListeners);