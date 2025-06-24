// firebase-comments.js
(function() {
  function loadScript(src, cb) {
    var s = document.createElement('script');
    s.src = src;
    s.onload = cb;
    document.head.appendChild(s);
  }

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

  loadScript("https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js", function() {
    loadScript("https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js", function() {
      if (!window.firebase?.apps?.length) firebase.initializeApp(firebaseConfig);
      var db = firebase.database();

      // --- BUAT pageID UNIK BERDASARKAN URL HALAMAN ---
      var pageID = window.location.pathname.replace(/[\/\.]/g, "_");

      document.addEventListener('DOMContentLoaded', function() {
        function loadComments() {
          var list = document.getElementById('comments-list');
          if (!list) return;
          db.ref('comments/' + pageID).on('value', (snapshot) => {
            list.innerHTML = '';
            snapshot.forEach((child) => {
              var c = child.val();
              var el = document.createElement('div');
              el.className = "comment-item";
              el.innerHTML = `<div><b>${c.author}</b>: ${c.content}<br><small>${new Date(c.timestamp).toLocaleString()}</small></div>`;
              list.appendChild(el);
            });
          });
        }

        var form = document.getElementById('comment-form');
        if (form) {
          form.addEventListener('submit', function(e) {
            e.preventDefault();
            var nameInput = document.getElementById('commenter-name');
            var textInput = document.getElementById('comment-text');
            var name = nameInput ? (nameInput.value.trim() || "Anonymous") : "Anonymous";
            var text = textInput ? textInput.value.trim() : "";
            if (!text) return;
            db.ref('comments/' + pageID).push({
              author: name,
              content: text,
              timestamp: new Date().toISOString()
            });
            if (textInput) textInput.value = "";
            if (nameInput) nameInput.value = "";
          });
        }

        loadComments();
      });
    });
  });
})();
