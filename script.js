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
    observer.observe(aboutContent);

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
            this.style.boxShadow = `0 10px 30px rgba(${getComputedStyle(this).borderColor.match(/\d+/g).join(', ')}, 0.2)`;
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
            header.style.backgroundPositionY = `-${translateY}px`;
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

    // Add enhanced particle background effect to header
    createParticles();
});

// Function to create particle effect - enhanced to fill the entire header
function createParticles() {
    const header = document.querySelector('header');
    // Increased number of particles for a more immersive effect
    const particleCount = 60;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        // Randomly position particles across the full width
        const size = Math.random() * 5 + 1;
        const posX = Math.random() * 100; // Full width percentage
        const posY = Math.random() * 100;
        const opacity = Math.random() * 0.5 + 0.1;
        const animationDuration = Math.random() * 20 + 10;
        const animationDelay = Math.random() * 5;
        
        // Apply styles with more varied movements
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

// Add keyframes for enhanced float animation
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

/// Complete working JavaScript for skills section
document.addEventListener('DOMContentLoaded', function() {
    // Initialize skills interaction
    initializeSkillsInteraction();
    
    // Rest of your existing code...
    // (animation observers, particle effects, etc.)
});

// Skills section interaction - WORKING VERSION
function initializeSkillsInteraction() {
    const skillTags = document.querySelectorAll('.skill-tag');
    const skillDetails = document.querySelectorAll('.skill-detail');
    
    console.log('Found skill tags:', skillTags.length);
    console.log('Found skill details:', skillDetails.length);
    
    if (skillTags.length === 0 || skillDetails.length === 0) {
        console.log('Skills elements not found');
        return;
    }
    
    // Set the first skill as active by default
    if (skillTags[0] && skillDetails[0]) {
        skillTags[0].classList.add('active');
        skillDetails[0].classList.add('active');
    }
    
    skillTags.forEach((tag, index) => {
        tag.addEventListener('click', function(e) {
            e.preventDefault();
            
            console.log(`Skill tag ${index} clicked`);
            
            // Remove active class from all tags
            skillTags.forEach(t => t.classList.remove('active'));
            
            // Remove active class from all details  
            skillDetails.forEach(detail => detail.classList.remove('active'));
            
            // Add active class to clicked tag
            this.classList.add('active');
            
            // Get the skill name from data-skill attribute
            const skillName = this.getAttribute('data-skill');
            console.log('Looking for skill:', skillName);
            
            // Find and activate the matching skill detail
            let found = false;
            skillDetails.forEach(detail => {
                const detailSkill = detail.getAttribute('data-skill');
                if (detailSkill === skillName) {
                    detail.classList.add('active');
                    found = true;
                    console.log('Activated skill detail:', skillName);
                }
            });
            
            if (!found) {
                console.log('No matching skill detail found for:', skillName);
            }
        });
    });
}