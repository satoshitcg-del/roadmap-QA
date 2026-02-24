// Mobile Navigation Toggle
document.addEventListener('DOMContentLoaded', function() {
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }
    
    // Progress Rings Animation
    animateProgressRings();
    
    // Smooth Scroll for Navigation Links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Track Topic Completion
    initializeProgressTracking();
});

// Animate Progress Rings
function animateProgressRings() {
    const rings = document.querySelectorAll('.progress-ring');
    
    rings.forEach(ring => {
        const progress = ring.dataset.progress || 0;
        const bar = ring.querySelector('.progress-bar');
        const text = ring.querySelector('.progress-text');
        
        if (bar && text) {
            const circumference = 2 * Math.PI * 45;
            const offset = circumference - (progress / 100) * circumference;
            
            setTimeout(() => {
                bar.style.strokeDashoffset = offset;
                animateNumber(text, 0, progress, 1000);
            }, 500);
        }
    });
}

// Animate Number Counter
function animateNumber(element, start, end, duration) {
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(start + (end - start) * easeOut);
        
        element.textContent = current + '%';
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
}

// Progress Tracking
function initializeProgressTracking() {
    // Load progress from localStorage
    const savedProgress = localStorage.getItem('qa-learning-progress');
    const progress = savedProgress ? JSON.parse(savedProgress) : {};
    
    // Mark completed topics
    document.querySelectorAll('.topic-card').forEach(card => {
        const topicId = card.getAttribute('href');
        if (topicId && progress[topicId]) {
            card.classList.add('completed');
            const checkmark = document.createElement('span');
            checkmark.className = 'completion-check';
            checkmark.innerHTML = '✓';
            card.appendChild(checkmark);
        }
    });
    
    // Update category progress
    updateCategoryProgress();
}

// Update Progress for a Topic
function markTopicComplete(topicId) {
    const savedProgress = localStorage.getItem('qa-learning-progress');
    const progress = savedProgress ? JSON.parse(savedProgress) : {};
    
    progress[topicId] = {
        completed: true,
        completedAt: new Date().toISOString()
    };
    
    localStorage.setItem('qa-learning-progress', JSON.stringify(progress));
    updateCategoryProgress();
}

// Update Category Progress Display
function updateCategoryProgress() {
    const categories = ['basics', 'manual', 'automation', 'advanced'];
    
    categories.forEach((category, index) => {
        const topics = document.querySelectorAll(`[href*="${category}"]`);
        const total = topics.length;
        
        if (total === 0) return;
        
        const savedProgress = localStorage.getItem('qa-learning-progress');
        const progress = savedProgress ? JSON.parse(savedProgress) : {};
        
        let completed = 0;
        topics.forEach(topic => {
            if (progress[topic.getAttribute('href')]) {
                completed++;
            }
        });
        
        const percentage = Math.round((completed / total) * 100);
        
        // Update progress ring
        const rings = document.querySelectorAll('.progress-ring');
        if (rings[index]) {
            const bar = rings[index].querySelector('.progress-bar');
            const text = rings[index].querySelector('.progress-text');
            
            if (bar && text) {
                const circumference = 2 * Math.PI * 45;
                const offset = circumference - (percentage / 100) * circumference;
                bar.style.strokeDashoffset = offset;
                text.textContent = percentage + '%';
            }
        }
    });
}

// Copy Code Functionality
document.querySelectorAll('.copy-code-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const codeBlock = this.closest('.code-block');
        const code = codeBlock.querySelector('code');
        
        if (code) {
            navigator.clipboard.writeText(code.textContent).then(() => {
                const originalText = this.textContent;
                this.textContent = '✓ คัดลอกแล้ว';
                this.classList.add('copied');
                
                setTimeout(() => {
                    this.textContent = originalText;
                    this.classList.remove('copied');
                }, 2000);
            });
        }
    });
});

// Intersection Observer for Animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

document.querySelectorAll('.topic-card, .roadmap-phase, .progress-card').forEach(el => {
    observer.observe(el);
});
