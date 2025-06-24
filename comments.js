// comments.js with Firebase Realtime Database
(function() {
  // Load Firebase CDN secara otomatis jika belum ada
  function loadScript(src, cb) {
    var s = document.createElement('script');
    s.src = src;
    s.onload = cb;
    document.head.appendChild(s);
  }

  // Masukkan config Firebase project lu di sini:
  var firebaseConfig = {
    apiKey: "AIzaSyDtGt8JxlkWUkJwY0mmFfS-09G-lRGX4_A",
    authDomain: "diskusi-5a10e.firebaseapp.com",
    databaseURL: "https://diskusi-5a10e-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "diskusi-5a10e",
    storageBucket: "diskusi-5a10e.firebasestorage.app",
    messagingSenderId: "330276872342",
    appId: "1:330276872342:web:9e4d7e76cf6960edc3a2b7",
    measurementId: "G-8608F7R3NE"
  };

  loadScript("https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js", function() {
    loadScript("https://www.gstatic.com/firebasejs/9.6.1/firebase-database-compat.js", function() {
      if (!window.firebase?.apps?.length) firebase.initializeApp(firebaseConfig);
      var db = firebase.database();

      // Owner mode config
      const OWNER_PASSWORD = 'admin123';
      const OWNER_SESSION_KEY = 'comments_owner_session';
      var pageID = window.location.pathname.replace(/[\/\.]/g, "_");

      // Utility functions
      function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
      }
      function formatTimeAgo(date) {
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
        if (diffInSeconds < 60) return 'Just now';
        else if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
        else if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hour ago`;
        else return date.toLocaleDateString();
      }
      function isOwnerMode() {
        return localStorage.getItem(OWNER_SESSION_KEY) === 'active';
      }
      function showNotification(message, type = 'info') {
        const existing = document.querySelector('.notification');
        if (existing) existing.remove();
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
          <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
          <span>${message}</span>
        `;
        notification.style.cssText = `
          position: fixed; top: 20px; right: 20px;
          background: ${type === 'success' ? 'linear-gradient(135deg, #4cc9f0, #7209b7)' : type === 'error' ? 'linear-gradient(135deg, #ff4757, #c44569)' : 'linear-gradient(135deg, #5f6368, #3c4043)'};
          color: white; padding: 12px 20px; border-radius: 8px;
          display: flex; align-items: center; gap: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.2); z-index: 1000;
          transform: translateX(100%); transition: transform 0.3s ease; font-size: 0.95rem; font-weight: 500; max-width: 300px;
        `;
        document.body.appendChild(notification);
        setTimeout(() => { notification.style.transform = 'translateX(0)'; }, 100);
        setTimeout(() => { notification.style.transform = 'translateX(100%)'; setTimeout(() => { if (notification.parentNode) notification.parentNode.removeChild(notification); }, 300); }, 3000);
      }

      // Owner mode & hidden shortcut
      function setupHiddenOwnerMode() {
        let keySequence = [];
        const targetSequence = ['KeyO', 'KeyW', 'KeyN', 'KeyE', 'KeyR'];
        document.addEventListener('keydown', function(e) {
          if (keySequence.length > 0 && Date.now() - keySequence[keySequence.length - 1].time > 2000) keySequence = [];
          keySequence.push({ code: e.code, time: Date.now() });
          if (keySequence.length > 5) keySequence = keySequence.slice(-5);
          if (keySequence.length === 5 && keySequence.every((key, idx) => key.code === targetSequence[idx])) { toggleOwnerMode(); keySequence = []; }
        });
        const footer = document.querySelector('footer');
        if (footer) {
          let clickCount = 0;
          footer.addEventListener('click', function() {
            clickCount++;
            setTimeout(() => { clickCount = 0; }, 500);
            if (clickCount === 3) { toggleOwnerMode(); clickCount = 0; }
          });
        }
        // Konami code
        let konamiSequence = [];
        const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight'];
        document.addEventListener('keydown', function(e) {
          konamiSequence.push(e.code);
          if (konamiSequence.length > 8) konamiSequence = konamiSequence.slice(-8);
          if (konamiSequence.length === 8 && konamiSequence.every((k, i) => k === konamiCode[i])) { toggleOwnerMode(); konamiSequence = []; }
        });
      }

      function toggleOwnerMode() {
        if (isOwnerMode()) {
          localStorage.removeItem(OWNER_SESSION_KEY);
          showNotification('Owner mode disabled', 'info');
          loadComments();
        } else {
          const password = prompt('Enter owner password:');
          if (password === OWNER_PASSWORD) {
            localStorage.setItem(OWNER_SESSION_KEY, 'active');
            showNotification('Owner mode enabled - You can now delete any comment', 'success');
            loadComments();
          } else if (password !== null) {
            showNotification('Incorrect password', 'error');
          }
        }
      }

      // Main comment system
      document.addEventListener('DOMContentLoaded', function() {
        setupHiddenOwnerMode();
        loadComments();
        setupCommentForm();
        setupAnonymousToggle();
      });

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

      function setupCommentForm() {
        const commentForm = document.getElementById('comment-form');
        if (commentForm) {
          commentForm.addEventListener('submit', function(e) {
            e.preventDefault();
            submitComment();
          });
        }
      }

      // ----- FIREBASE COMMENT -----
      function submitComment() {
        const anonymousToggle = document.getElementById('anonymous-toggle');
        const commenterName = document.getElementById('commenter-name');
        const commentText = document.getElementById('comment-text');
        const isAnonymous = anonymousToggle && anonymousToggle.checked;
        const name = isAnonymous ? 'Anonymous' : (commenterName && commenterName.value.trim() || "Anonymous");
        const text = commentText && commentText.value.trim();
        if (!text) { showNotification('Please enter a comment', 'error'); return; }
        const commentObj = {
          author: name,
          content: text,
          timestamp: new Date().toISOString(),
          isAnonymous: isAnonymous,
          replies: []
        };
        db.ref('comments/' + pageID).push(commentObj, function(err){
          if (!err) {
            if(commentText) commentText.value = '';
            if(commenterName && !isAnonymous) commenterName.value = '';
            showNotification('Comment posted successfully!', 'success');
          } else showNotification('Failed to post comment', 'error');
        });
      }

      // REPLY SUBMIT
      window.handleReplySubmit = function(event, parentId) {
        event.preventDefault();
        const isAnonymous = document.getElementById(`reply-anonymous-${parentId}`).checked;
        const name = isAnonymous ? 'Anonymous' : (document.getElementById(`reply-name-${parentId}`).value.trim() || 'Anonymous');
        const content = document.getElementById(`reply-text-${parentId}`).value.trim();
        if (!content) { showNotification('Please enter a reply', 'error'); return; }
        const replyData = {
          author: name,
          content: content,
          isAnonymous: isAnonymous,
          timestamp: new Date().toISOString()
        };
        // Get parent, add reply
        db.ref(`comments/${pageID}/${parentId}/replies`).once('value', function(snapshot){
          let replies = snapshot.val() || [];
          replies.push(replyData);
          db.ref(`comments/${pageID}/${parentId}/replies`).set(replies, function(err){
            if(!err) showNotification('Reply posted successfully!', 'success');
          });
        });
        hideReplyForm(parentId);
      };

      // DELETE COMMENT
      window.confirmDeleteComment = function(commentId) {
        if (confirm('Are you sure you want to delete this comment? This action cannot be undone.')) {
          db.ref(`comments/${pageID}/${commentId}`).remove(function(err){
            if(!err) showNotification('Comment deleted successfully!', 'success');
            else showNotification('Failed to delete comment', 'error');
          });
        }
      };

      // LOAD COMMENTS
      function loadComments() {
        const commentsList = document.getElementById('comments-list');
        if (!commentsList) return;
        db.ref('comments/' + pageID).on('value', function(snapshot){
          const val = snapshot.val();
          if (!val) {
            showEmptyState();
            updateCommentCount(0);
            return;
          }
          let comments = [];
          Object.entries(val).forEach(([id, comment]) => {
            comments.push({...comment, id: id});
          });
          // Sort newest first
          comments = comments.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
          commentsList.innerHTML = '';
          comments.forEach(comment => {
            addCommentToDisplay(comment, false);
          });
          updateCommentCount(comments.length + comments.reduce((a,c) => a + (c.replies ? c.replies.length : 0), 0));
        });
      }

      // Display comments + replies
      function addCommentToDisplay(comment, animate = true, isReply = false) {
        const commentsList = document.getElementById('comments-list');
        if (!commentsList) return;
        // Remove empty state if exists
        const emptyState = commentsList.querySelector('.comments-empty');
        if (emptyState) emptyState.remove();

        // Create comment element
        const commentDiv = document.createElement('div');
        commentDiv.className = `comment-item ${isReply ? 'comment-reply' : ''}`;
        commentDiv.style.opacity = '0';
        commentDiv.style.transform = 'translateY(20px)';
        commentDiv.style.transition = 'all 0.5s ease';
        commentDiv.setAttribute('data-comment-id', comment.id);

        // Get author initial for avatar
        const initial = comment.author ? comment.author.charAt(0).toUpperCase() : "?";
        const timeAgo = formatTimeAgo(new Date(comment.timestamp));
        // Owner mode
        const canDelete = isOwnerMode();
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
        // Render replies
        if (comment.replies && comment.replies.length > 0) {
          const repliesContainer = document.createElement('div');
          repliesContainer.className = 'replies-container';
          comment.replies.forEach((reply, i) => {
            // Biar unique, tambahin ID gabungan
            reply.id = comment.id + '_reply_' + i;
            const replyElement = createReplyElement(reply);
            repliesContainer.appendChild(replyElement);
          });
          commentDiv.appendChild(repliesContainer);
        }
        setTimeout(() => {
          commentDiv.style.opacity = '1';
          commentDiv.style.transform = 'translateY(0)';
        }, 50);
        commentsList.appendChild(commentDiv);
        // Setup reply form toggle
        setTimeout(() => {
          const replyToggle = commentDiv.querySelector(`#reply-anonymous-${comment.id}`);
          const replyNameInput = commentDiv.querySelector(`#reply-name-input-${comment.id}`);
          if (replyToggle && replyNameInput) {
            replyToggle.addEventListener('change', function() {
              if (this.checked) replyNameInput.classList.add('hidden');
              else replyNameInput.classList.remove('hidden');
            });
          }
        }, 100);
      }

      function createReplyElement(reply) {
        const replyDiv = document.createElement('div');
        replyDiv.className = 'comment-item comment-reply';
        replyDiv.style.opacity = '1';
        replyDiv.style.transform = 'translateY(0)';
        // Format
        const initial = reply.author ? reply.author.charAt(0).toUpperCase() : "?";
        const timeAgo = formatTimeAgo(new Date(reply.timestamp));
        replyDiv.innerHTML = `
          <div class="comment-header">
              <div class="comment-author">
                  <div class="author-avatar">${initial}</div>
                  <span class="author-name">${escapeHtml(reply.author)}</span>
              </div>
              <span class="comment-time">${timeAgo}</span>
          </div>
          <div class="comment-content">
              ${escapeHtml(reply.content).replace(/\n/g, '<br>')}
          </div>
        `;
        return replyDiv;
      }

      // Show/hide reply form
      window.showReplyForm = function(commentId) {
        const replyForm = document.getElementById(`reply-form-${commentId}`);
        if (replyForm) {
          replyForm.style.display = 'block';
          const textarea = replyForm.querySelector('textarea');
          if (textarea) textarea.focus();
        }
      };
      window.hideReplyForm = function(commentId) {
        const replyForm = document.getElementById(`reply-form-${commentId}`);
        if (replyForm) {
          replyForm.style.display = 'none';
          const form = replyForm.querySelector('form');
          if (form) form.reset();
        }
      };

      // Empty state
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

      // Update comment count
      function updateCommentCount(count) {
        const countElement = document.getElementById('total-comments');
        if (countElement) countElement.textContent = count;
      }

      // Toggle comments section (optional, dari HTML logic kamu)
      window.toggleComments = function() {
        const commentsSection = document.getElementById('comments-section');
        const toggleBtn = document.querySelector('.comment-toggle-btn');
        if (commentsSection.classList.contains('active')) {
          commentsSection.classList.remove('active');
          toggleBtn.innerHTML = `
            <i class="fas fa-comments"></i>
            <span>Comments</span>
            <span class="comment-count" id="total-comments"></span>
          `;
        } else {
          commentsSection.classList.add('active');
          toggleBtn.innerHTML = `
            <i class="fas fa-times"></i>
            <span>Hide Comments</span>
            <span class="comment-count" id="total-comments"></span>
          `;
          setTimeout(() => { commentsSection.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 300);
        }
      };

    });
  });
})();
