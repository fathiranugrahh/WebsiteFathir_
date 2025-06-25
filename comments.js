// comments.js (Versi Perbaikan)

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.11/firebase-app.js";
import { getDatabase, ref, push, onValue, remove, query, orderByChild } from "https://www.gstatic.com/firebasejs/9.6.11/firebase-database.js";

// Konfigurasi Firebase Anda (tetap sama)
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

// --- Fungsi Helper (Tidak ada perubahan signifikan di sini, tetap sama) ---
function getCurrentPage() {
    const path = window.location.pathname;
    if (path.includes('artificial-intelligence')) return 'ai';
    if (path.includes('cryptocurrency')) return 'crypto';
    if (path.includes('futures-tech-trends')) return 'futures-tech-trends';
    if (path.includes('macroeconomy')) return 'macroeconomy';
    if (path.includes('digitaleconomy')) return 'digitaleconomy';
    if (path.includes('logical')) return 'logical';
    // fallback: gunakan nama folder terakhir sebagai key unik
    const match = path.match(/\/([^\/]+)\/?$/);
    if (match) return match[1];
    return 'default';
}

function generateCommentId() {
    return 'comment_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function createUserSession() {
    let session = localStorage.getItem('user_session');
    if (!session) {
        session = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('user_session', session);
    }
    return session;
}

function generateAuthorId(name, isAnonymous) {
    if (isAnonymous) return 'anon_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    // Menggunakan btoa untuk obfuscation sederhana, bukan keamanan
    return btoa(name.trim().toLowerCase() + '_' + (localStorage.getItem('user_session') || createUserSession()));
}

function isOwnerMode() {
    return localStorage.getItem(OWNER_SESSION_KEY) === 'active';
}

function isCommentOwner(comment) {
    if (isOwnerMode()) return true;
    const commenterNameInput = document.getElementById('commenter-name');
    const name = commenterNameInput ? commenterNameInput.value : '';
    const currentAuthorId = generateAuthorId(name, comment.isAnonymous);
    return comment.authorId === currentAuthorId;
}

function formatTimeAgo(date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    const lang = document.documentElement.lang || 'en';
    const rtf = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' });

    if (diffInSeconds < 60) return rtf.format(-diffInSeconds, 'second');
    if (diffInSeconds < 3600) return rtf.format(-Math.floor(diffInSeconds / 60), 'minute');
    if (diffInSeconds < 86400) return rtf.format(-Math.floor(diffInSeconds / 3600), 'hour');
    if (diffInSeconds < 2592000) return rtf.format(-Math.floor(diffInSeconds / 86400), 'day');
    if (diffInSeconds < 31536000) return rtf.format(-Math.floor(diffInSeconds / 2592000), 'month');
    return rtf.format(-Math.floor(diffInSeconds / 31536000), 'year');
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
    notification.style.cssText = `position: fixed; top: 20px; right: 20px; background: ${type === 'success' ? 'linear-gradient(135deg, #4cc9f0, #7209b7)' : type === 'error' ? 'linear-gradient(135deg, #ff4757, #c44569)' : 'linear-gradient(135deg, #5f6368, #3c4043)'}; color: white; padding: 12px 20px; border-radius: 8px; display: flex; align-items: center; gap: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.2); z-index: 1001; transform: translateX(120%); transition: transform 0.3s ease; font-size: 0.95rem; font-weight: 500; max-width: 300px;`;
    document.body.appendChild(notification);
    setTimeout(() => { notification.style.transform = 'translateX(0)'; }, 100);
    setTimeout(() => {
        notification.style.transform = 'translateX(120%)';
        setTimeout(() => { if (notification.parentNode) notification.parentNode.removeChild(notification); }, 300);
    }, 3000);
}

// --- Fungsi UI (Beberapa perubahan di sini) ---
function showEmptyState() {
    const commentsList = document.getElementById('comments-list');
    const lang = document.documentElement.lang || 'en';
    const emptyText = {
        en: { title: 'No comments yet', subtitle: 'Be the first to share your thoughts!' },
        id: { title: 'Belum ada komentar', subtitle: 'Jadilah yang pertama membagikan pemikiran Anda!' }
    };
    if (commentsList) commentsList.innerHTML = `<div class="comments-empty"><i class="fas fa-comments"></i><h4>${emptyText[lang].title}</h4><p>${emptyText[lang].subtitle}</p></div>`;
}

function updateCommentCountUI(count) {
    document.querySelectorAll('.comment-count').forEach(el => el.textContent = count);
}

function createCommentElement(comment, isReply = false) {
    const commentDiv = document.createElement('div');
    commentDiv.className = `comment-item ${isReply ? 'comment-reply' : ''}`;
    commentDiv.setAttribute('data-comment-id', comment.id);

    const initial = comment.author.charAt(0).toUpperCase();
    const timeAgo = formatTimeAgo(new Date(comment.timestamp));
    const canDelete = isCommentOwner(comment);
    
    const lang = document.documentElement.lang || 'en';
    const translations = {
        reply: { en: 'Reply', id: 'Balas' },
        delete: { en: 'Delete', id: 'Hapus' },
        owner: { en: 'Owner', id: 'Pemilik' },
        replyAnon: { en: 'Reply anonymously', id: 'Balas secara anonim' },
        yourName: { en: 'Your name (optional)', id: 'Nama Anda (opsional)' },
        writeReply: { en: 'Write your reply...', id: 'Tulis balasan Anda...' },
        cancel: { en: 'Cancel', id: 'Batal' },
        postReply: { en: 'Post Reply', id: 'Kirim Balasan' }
    };

    let actionButtons = '';
    if (!isReply) {
        actionButtons += `<button class="reply-btn" data-action="reply" data-comment-id="${comment.id}"><i class="fas fa-reply"></i> ${translations.reply[lang]}</button>`;
    }
    if (canDelete) {
        actionButtons += `<button class="delete-btn" data-action="delete" data-comment-id="${comment.id}"><i class="fas fa-trash"></i> ${translations.delete[lang]}</button>`;
    }
    
    // Create Reply Form dynamically with correct language
    const replyFormHTML = `
        <div class="reply-form-container" id="reply-form-${comment.id}" style="display: none;">
            <form class="reply-form" data-action="submit-reply" data-parent-id="${comment.id}">
                <div class="form-group">
                    <div class="name-toggle">
                        <label class="toggle-switch"><input type="checkbox" class="reply-anonymous-toggle"><span class="slider"></span></label>
                        <span class="toggle-label">${translations.replyAnon[lang]}</span>
                    </div>
                    <div class="name-input hidden">
                        <input type="text" class="reply-name" placeholder="${translations.yourName[lang]}">
                    </div>
                </div>
                <div class="form-group">
                    <textarea class="reply-text" placeholder="${translations.writeReply[lang]}" rows="3" required></textarea>
                </div>
                <div class="form-actions">
                    <button type="button" class="cancel-btn" data-action="cancel-reply" data-comment-id="${comment.id}">${translations.cancel[lang]}</button>
                    <button type="submit" class="submit-btn"><i class="fas fa-paper-plane"></i> ${translations.postReply[lang]}</button>
                </div>
            </form>
        </div>
    `;

    commentDiv.innerHTML = `
        <div class="comment-header">
            <div class="comment-author">
                <div class="author-avatar">${initial}</div>
                <span class="author-name">${escapeHtml(comment.author)}</span>
                ${isOwnerMode() && canDelete ? `<span class="owner-badge">${translations.owner[lang]}</span>` : ''}
            </div>
            <span class="comment-time">${timeAgo}</span>
        </div>
        <div class="comment-content">${escapeHtml(comment.content).replace(/\n/g, '<br>')}</div>
        <div class="comment-actions">${actionButtons}</div>
        ${!isReply ? replyFormHTML : ''}
    `;

    if (comment.replies && Object.keys(comment.replies).length > 0) {
        const repliesContainer = document.createElement('div');
        repliesContainer.className = 'replies-container';
        // Menggunakan key sebagai id reply
        const replies = Object.entries(comment.replies)
            .map(([id, data]) => ({ id, ...data }))
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        replies.forEach(reply => repliesContainer.appendChild(createCommentElement(reply, true)));
        commentDiv.appendChild(repliesContainer);
    }
    return commentDiv;
}

function showReplyForm(commentId) {
    // Sembunyikan semua form balasan lain terlebih dahulu
    document.querySelectorAll('.reply-form-container').forEach(form => form.style.display = 'none');
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
            const nameInput = form.querySelector('.name-input');
            if (nameInput) {
                nameInput.classList.add('hidden');
            }
        }
    }
}

// --- Fungsi Database (Firebase) ---
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
        .catch(error => showNotification(`Failed to post comment: ${error.message}`, 'error'));
}

function submitReply(page, parentId, replyData) {
    const replyRef = ref(db, `comments/${page}/${parentId}/replies`);
    
    // Gunakan push untuk mendapatkan ID unik dari Firebase
    push(replyRef, {
        ...replyData,
        timestamp: new Date().toISOString(),
        authorId: generateAuthorId(replyData.author, replyData.isAnonymous),
        parentId: parentId
    })
    .then(() => {
        showNotification('Reply posted successfully!', 'success');
        hideReplyForm(parentId);
    })
    .catch(error => showNotification(`Failed to post reply: ${error.message}`, 'error'));
}

function deleteComment(page, commentId, isReply = false, parentId = null) {
    let commentRef;
    if (isReply && parentId) {
        commentRef = ref(db, `comments/${page}/${parentId}/replies/${commentId}`);
    } else {
        commentRef = ref(db, `comments/${page}/${commentId}`);
    }

    remove(commentRef)
        .then(() => showNotification('Comment deleted successfully!', 'success'))
        .catch(error => showNotification(`Failed to delete comment: ${error.message}`, 'error'));
}


function listenToComments(page) {
    const commentsQuery = query(ref(db, `comments/${page}`), orderByChild('timestamp'));
    
    onValue(commentsQuery, (snapshot) => {
        const commentsList = document.getElementById('comments-list');
        if (!commentsList) return;

        commentsList.innerHTML = '';
        const commentsData = snapshot.val();

        if (!commentsData) {
            showEmptyState();
            updateCommentCountUI(0);
            return;
        }

        // Ubah objek menjadi array dan tambahkan ID dari key
        const comments = Object.entries(commentsData).map(([id, data]) => ({ id, ...data }));
        // Urutkan dari yang terbaru ke terlama
        comments.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        let totalComments = 0;
        comments.forEach(comment => {
            totalComments++;
            if (comment.replies) {
                totalComments += Object.keys(comment.replies).length;
            }
            const commentElement = createCommentElement(comment);
            commentsList.appendChild(commentElement);
        });
        
        updateCommentCountUI(totalComments);
    }, { onlyOnce: false });
}

// --- Inisialisasi Aplikasi ---
function initializeAppAndListeners() {
    createUserSession(); // Pastikan session user ada
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
        commentsSection.classList.toggle('active');
        if (commentsSection.classList.contains('active')) {
            setTimeout(() => commentsSection.scrollIntoView({ behavior: 'smooth' }), 300);
        }
    });

    document.getElementById('comments-list')?.addEventListener('click', (e) => {
        const button = e.target.closest('button');
        if (!button) return;

        const action = button.dataset.action;
        const commentId = button.dataset.commentId;

        if (action === 'reply') showReplyForm(commentId);
        if (action === 'cancel-reply') hideReplyForm(commentId);
        if (action === 'delete') {
            const commentItem = button.closest('.comment-item');
            const isReply = commentItem.classList.contains('comment-reply');
            const parentItem = commentItem.closest('.replies-container')?.closest('.comment-item');
            const parentId = parentItem ? parentItem.dataset.commentId : null;

            if (confirm('Are you sure you want to delete this comment? This action cannot be undone.')) {
                deleteComment(page, commentId, isReply, parentId);
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
        }
    });

    document.getElementById('comments-list')?.addEventListener('change', (e) => {
        if(e.target.classList.contains('reply-anonymous-toggle')) {
            const form = e.target.closest('form');
            form.querySelector('.name-input').classList.toggle('hidden', e.target.checked);
        }
    });
}

// **PERBAIKAN UTAMA**: Fungsi untuk menangani perubahan bahasa
function updateCommentsLanguage() {
    const lang = document.documentElement.lang || 'en';
    
    // Perbarui elemen statis di dalam comments-section
    const staticElements = document.querySelectorAll('#comments-section [data-en], #comments-section [data-id]');
    staticElements.forEach(element => {
        const text = element.getAttribute(`data-${lang}`);
        if (text) {
            element.textContent = text;
        }
    });

    // Perbarui placeholder
    const placeholderElements = document.querySelectorAll('#comments-section [data-en-placeholder], #comments-section [data-id-placeholder]');
    placeholderElements.forEach(element => {
        const text = element.getAttribute(`data-${lang}-placeholder`);
        if (text) {
            element.placeholder = text;
        }
    });
    
    // Muat ulang daftar komentar untuk memperbarui teks dinamis (seperti 'Reply', 'Delete', 'time ago')
    listenToComments(getCurrentPage());
}

// Menjadikan fungsi ini global agar bisa diakses dari script di HTML
window.updateCommentsLanguage = updateCommentsLanguage;

// **PERBAIKAN UTAMA**: Menghapus blok `innerHTML` yang merusak
document.addEventListener('DOMContentLoaded', () => {
    // Blok kode yang merusak struktur HTML telah dihapus dari sini.
    // Sekarang kita hanya memanggil inisialisasi.
    initializeAppAndListeners();
});