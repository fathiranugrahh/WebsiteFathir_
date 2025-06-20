// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Animation for elements in viewport
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                if (entry.target.classList.contains('about-content')) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';

               // Animate skill bars after the about content appears
                    setTimeout(() => {
                        const skillLevels = document.querySelectorAll('.skill-level');
                        skillLevels.forEach(skill => {
                            const width = skill.style.width;
                            skill.style.width = '0';
                            setTimeout(() => {
                                skill.style.width = width;
                            }, 100);
                        });
                    }, 500);
                }

                if (entry.target.classList.contains('topic')) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }

                // Once observed, no need to observe again
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.15
    });

    // Elements to observe
    const aboutContent = document.querySelector('.about-content');
    if (aboutContent) {
        observer.observe(aboutContent);
    }

    const topics = document.querySelectorAll('.topic');
    topics.forEach((topic, index) => {
        // Add staggered animation delay
        topic.style.transitionDelay = `${index * 0.15}s`;
        observer.observe(topic);
    });

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();

            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Add hover effect for topics
    topics.forEach(topic => {
        topic.addEventListener('mouseenter', function() {
            // Add subtle glow effect
            this.style.boxShadow = `0 10px 30px rgba(157, 78, 221, 0.2)`;
        });

        topic.addEventListener('mouseleave', function() {
            // Remove hover effect
            this.style.boxShadow = '';
        });
    });

    // Add typewriter effect to the header title
    const title = document.querySelector('.profile-text h1');
    if (title) {
        const text = title.textContent;
        title.textContent = '';

        // Wait for fadeUp animation to complete
        setTimeout(() => {
            let i = 0;
            const typeWriter = () => {
                if (i < text.length) {
                    title.textContent += text.charAt(i);
                    i++;
                    setTimeout(typeWriter, 100);
                }
            };
            typeWriter();
        }, 1500);
    }

    // Enhanced parallax effect for header section
    window.addEventListener('scroll', function() {
        const header = document.querySelector('header');
        const scrollPosition = window.scrollY;

        if (scrollPosition < window.innerHeight) {
            const translateY = scrollPosition * 0.3;
            if (header) {
                header.style.backgroundPositionY = `-${translateY}px`;
            }
        }
    });

    // Initialize AOS (Animate on Scroll) like functionality
    window.addEventListener('scroll', function() {
        const scrollPosition = window.scrollY + window.innerHeight * 0.8;

        // Check for sections in view and add animation classes
        document.querySelectorAll('.section').forEach(section => {
            if (section.offsetTop < scrollPosition) {
                section.classList.add('in-view');
            }
        });
    });

    // FIXED: Only add particles if we're on the homepage
    // Check if this is the homepage by looking for specific homepage elements
    const isHomepage = document.querySelector('.profile-container') &&
                      document.querySelector('#home') &&
                      document.querySelector('#about') &&
                      document.querySelector('#my-mind');

    if (isHomepage) {
        createParticles();
    }

    // Initialize skills interaction
    initializeSkillsInteraction();

    // ====== HAMBURGER MENU & MODAL FUNCTIONALITY ======
    // Get all the elements
    const hamburgerMenu = document.getElementById('hamburgerMenu');
    const navMenu = document.getElementById('navMenu');
    const navOverlay = document.getElementById('navOverlay');
    const modalOverlay = document.getElementById('modalOverlay');
    const wildThoughtsLink = document.getElementById('wildThoughtsLink');
    const modalCancel = document.getElementById('modalCancel');
    const modalContinue = document.getElementById('modalContinue');
    
    // ===============================================
    const wildThoughtsDesktop = document.getElementById('wildThoughtsDesktop');
    if (wildThoughtsDesktop) {
        wildThoughtsDesktop.addEventListener('click', function(e) {
            e.preventDefault();
            modalOverlay.classList.add('active');
        });
    }
    // ===============================================

    // Hamburger menu toggle
    if (hamburgerMenu) {
        hamburgerMenu.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();

            hamburgerMenu.classList.toggle('active');
            navMenu.classList.toggle('active');
            navOverlay.classList.toggle('active');
        });
    }

    // Close menu when overlay clicked
    if (navOverlay) {
        navOverlay.addEventListener('click', function() {
            closeMenu();
        });
    }

    // Close menu when navigation link clicked (except Wild Thoughts)
    document.querySelectorAll('.nav-link:not(.special)').forEach(link => {
        link.addEventListener('click', function() {
            closeMenu();
        });
    });

    // Wild Thoughts link (Mobile)
    if (wildThoughtsLink) {
        wildThoughtsLink.addEventListener('click', function(e) {
            e.preventDefault();
            closeMenu();
            setTimeout(() => {
                modalOverlay.classList.add('active');
            }, 300);
        });
    }

    // Modal cancel button
    if (modalCancel) {
        modalCancel.addEventListener('click', function() {
            modalOverlay.classList.remove('active');
        });
    }

    // Modal continue button - redirect to new page
    if (modalContinue) {
        modalContinue.addEventListener('click', function() {
            modalOverlay.classList.remove('active');
            window.location.href = 'wild-thoughts/';
        });
    }

    // Close modal when overlay clicked
    if (modalOverlay) {
        modalOverlay.addEventListener('click', function(e) {
            if (e.target === modalOverlay) {
                modalOverlay.classList.remove('active');
            }
        });
    }

    // Function to close menu
    function closeMenu() {
        if (hamburgerMenu && navMenu && navOverlay) {
            hamburgerMenu.classList.remove('active');
            navMenu.classList.remove('active');
            navOverlay.classList.remove('active');
        }
    }

    // Close menu on scroll
    window.addEventListener('scroll', function() {
        if (navMenu && navMenu.classList.contains('active')) {
            closeMenu();
        }
    });
});

// FIXED: Function to create particle effect - ONLY for homepage
function createParticles() {
    const header = document.querySelector('header#home');
    if (!header) {
        return;
    }
    const particleCount = 60;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';

        const size = Math.random() * 5 + 1;
        const posX = Math.random() * 100;
        const posY = Math.random() * 100;
        const opacity = Math.random() * 0.5 + 0.1;
        const animationDuration = Math.random() * 20 + 10;
        const animationDelay = Math.random() * 5;

        particle.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            background-color: rgba(157, 78, 221, ${opacity});
            left: ${posX}%;
            top: ${posY}%;
            border-radius: 50%;
            pointer-events: none;
            opacity: ${opacity};
            animation: float ${animationDuration}s infinite ease-in-out ${animationDelay}s;
        `;

        header.appendChild(particle);
    }
}

// Skills section interaction - WORKING VERSION
function initializeSkillsInteraction() {
    const skillTags = document.querySelectorAll('.skill-tag');
    const skillDetails = document.querySelectorAll('.skill-detail');

    if (skillTags.length === 0 || skillDetails.length === 0) {
        return;
    }

    if (skillTags[0] && skillDetails[0]) {
        skillTags[0].classList.add('active');
        skillDetails[0].classList.add('active');
    }

    skillTags.forEach((tag, index) => {
        tag.addEventListener('click', function(e) {
            e.preventDefault();

            skillTags.forEach(t => t.classList.remove('active'));
            skillDetails.forEach(detail => detail.classList.remove('active'));
            this.classList.add('active');
            const skillName = this.getAttribute('data-skill');

            let found = false;
            skillDetails.forEach(detail => {
                const detailSkill = detail.getAttribute('data-skill');
                if (detailSkill === skillName) {
                    detail.classList.add('active');
                    found = true;
                }
            });
        });
    });
}

// Add keyframes for enhanced float animation and scroll effect for desktop navbar
const style = document.createElement('style');
style.textContent = `
    @keyframes float {
        0%, 100% {
            transform: translateY(0) translateX(0);
        }
        25% {
            transform: translateY(-15px) translateX(15px);
        }
        50% {
            transform: translateY(-25px) translateX(0);
        }
        75% {
            transform: translateY(-15px) translateX(-15px);
        }
    }
`;
document.head.appendChild(style);

window.addEventListener('scroll', function() {
    const navbar = document.getElementById('desktopNavbar');
    if (navbar) {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }
});