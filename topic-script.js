// Optimized Topic Script for faster content loading
document.addEventListener('DOMContentLoaded', function() {
    // Content navigation
    const navLinks = document.querySelectorAll('.sidebar-nav a');
    const articles = document.querySelectorAll('.topic-article');
    
    // Add click event to each navigation link
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Get target article id from the href
            const targetId = this.getAttribute('href');
            
            // Hide all articles and remove active class from nav items
            articles.forEach(article => article.classList.remove('active'));
            navLinks.forEach(link => link.parentElement.classList.remove('active'));
            
            // Show target article and add active class to clicked nav item
            document.querySelector(targetId).classList.add('active');
            this.parentElement.classList.add('active');
            
            // Scroll to top of content area on mobile
            if (window.innerWidth <= 900) {
                const topicContent = document.querySelector('.topic-main-content');
                topicContent.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
    
    // Highlight active section on scroll
    const observeArticles = () => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
                    const id = entry.target.getAttribute('id');
                    
                    // Update active link in sidebar
                    navLinks.forEach(link => {
                        link.parentElement.classList.remove('active');
                        if (link.getAttribute('href') === `#${id}`) {
                            link.parentElement.classList.add('active');
                        }
                    });
                }
            });
        }, {
            threshold: 0.5,
            rootMargin: '0px 0px -50% 0px'
        });
        
        // Observe each article
        articles.forEach(article => {
            observer.observe(article);
        });
    };
    
    // Only use scroll observer on desktop
    if (window.innerWidth > 900) {
        observeArticles();
    }
    
    // Add animation effects to content - OPTIMIZED VERSION
    const fadeInElements = document.querySelectorAll('.topic-article p, .topic-article h2, .topic-image');
    
    const fadeObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                fadeObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.05, // Lebih sensitif - trigger lebih cepat
        rootMargin: '50px 0px' // Mulai animasi sebelum element benar-benar terlihat
    });
    
    fadeInElements.forEach((element, index) => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(10px)'; // Gerakan lebih kecil
        // Delay yang jauh lebih singkat dan durasi lebih cepat
        element.style.transition = `all 0.25s ease ${Math.min(index * 0.03, 0.15)}s`; // Max delay 0.15s
        fadeObserver.observe(element);
    });
    
    // Add parallax effect to header
    window.addEventListener('scroll', function() {
        const header = document.querySelector('.topic-header');
        const scrollPosition = window.scrollY;
        
        if (scrollPosition < 500) {
            header.style.backgroundPositionY = `${scrollPosition * 0.4}px`;
        }
    });
    
    // Add highlight effect to code examples if present
    const codeBlocks = document.querySelectorAll('pre code');
    if (codeBlocks.length > 0) {
        // If there are code blocks and a syntax highlighting library is available
        if (typeof hljs !== 'undefined') {
            codeBlocks.forEach(block => {
                hljs.highlightBlock(block);
            });
        }
    }
});