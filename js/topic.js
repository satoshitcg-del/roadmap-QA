// Topic Page Scripts

document.addEventListener('DOMContentLoaded', function() {
    // Copy Code Functionality
    initCopyCode();
    
    // Quiz Functionality
    initQuiz();
    
    // Checklist Persistence
    initChecklist();
    
    // TOC Active State
    initTOC();
});

// Copy Code
function initCopyCode() {
    document.querySelectorAll('.copy-code-btn').forEach(btn => {
        btn.addEventListener('click', async function() {
            const codeBlock = this.closest('.code-block');
            const code = codeBlock?.querySelector('code');
            
            if (code) {
                try {
                    await navigator.clipboard.writeText(code.textContent);
                    
                    const originalText = this.textContent;
                    this.textContent = '✓ คัดลอกแล้ว';
                    this.classList.add('copied');
                    
                    setTimeout(() => {
                        this.textContent = originalText;
                        this.classList.remove('copied');
                    }, 2000);
                } catch (err) {
                    console.error('Failed to copy:', err);
                }
            }
        });
    });
}

// Quiz
function initQuiz() {
    const checkBtn = document.getElementById('checkAnswers');
    const resultDiv = document.getElementById('quizResult');
    
    if (checkBtn) {
        checkBtn.addEventListener('click', function() {
            const questions = document.querySelectorAll('.quiz-question');
            let correct = 0;
            let answered = 0;
            
            questions.forEach(q => {
                const correctAnswer = q.dataset.correct;
                const selected = q.querySelector('input[type="radio"]:checked');
                const feedback = q.querySelector('.feedback');
                
                // Reset feedback
                feedback.className = 'feedback';
                feedback.style.display = 'none';
                
                if (selected) {
                    answered++;
                    if (selected.value === correctAnswer) {
                        correct++;
                        feedback.textContent = '✓ ถูกต้อง!';
                        feedback.classList.add('correct');
                    } else {
                        feedback.textContent = '✗ ไม่ถูกต้อง ลองใหม่อีกครั้ง';
                        feedback.classList.add('incorrect');
                    }
                } else {
                    feedback.textContent = '⚠ กรุณาเลือกคำตอบ';
                    feedback.style.display = 'block';
                    feedback.style.background = 'rgba(245, 158, 11, 0.2)';
                    feedback.style.color = 'var(--intermediate)';
                }
            });
            
            // Show result
            if (answered === questions.length) {
                const percentage = Math.round((correct / questions.length) * 100);
                let message = '';
                let emoji = '';
                
                if (percentage === 100) {
                    message = 'ยอดเยี่ยม! คุณเข้าใจเนื้อหาดีมาก';
                    emoji = '🎉';
                } else if (percentage >= 70) {
                    message = 'ดีมาก! แต่ยังมีอะไรให้ทบทวนอีกเล็กน้อย';
                    emoji = '👍';
                } else {
                    message = 'ลองทบทวนเนื้อหาอีกครั้ง แล้วทำใหม่นะ';
                    emoji = '💪';
                }
                
                resultDiv.innerHTML = `
                    <div style="font-size: 3rem; margin-bottom: 1rem;">${emoji}</div>
                    <h3>ผลลัพธ์: ${correct}/${questions.length} (${percentage}%)</h3>
                    <p>${message}</p>
                `;
                resultDiv.className = 'quiz-result show';
                resultDiv.style.background = percentage >= 70 ? 
                    'rgba(34, 197, 94, 0.2)' : 'rgba(245, 158, 11, 0.2)';
                
                // Save progress
                if (percentage >= 70) {
                    markTopicComplete(window.location.pathname);
                }
            }
        });
    }
}

// Checklist Persistence
function initChecklist() {
    const pageId = window.location.pathname;
    const saved = localStorage.getItem(`checklist-${pageId}`);
    const checked = saved ? JSON.parse(saved) : [];
    
    const checkboxes = document.querySelectorAll('.checklist-items input[type="checkbox"]');
    
    checkboxes.forEach((cb, index) => {
        // Restore state
        if (checked.includes(index)) {
            cb.checked = true;
        }
        
        // Save on change
        cb.addEventListener('change', function() {
            const currentChecked = Array.from(checkboxes)
                .map((box, i) => box.checked ? i : null)
                .filter(i => i !== null);
            
            localStorage.setItem(`checklist-${pageId}`, JSON.stringify(currentChecked));
            
            // Check if all checked
            if (currentChecked.length === checkboxes.length) {
                markTopicComplete(pageId);
            }
        });
    });
}

// TOC Active State
function initTOC() {
    const sections = document.querySelectorAll('section[id]');
    const tocLinks = document.querySelectorAll('.toc a');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                
                tocLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${id}`) {
                        link.classList.add('active');
                        link.style.background = 'rgba(99, 102, 241, 0.2)';
                        link.style.color = 'var(--primary-light)';
                    }
                });
            }
        });
    }, {
        rootMargin: '-20% 0px -80% 0px'
    });
    
    sections.forEach(section => observer.observe(section));
}

// Mark Topic Complete
function markTopicComplete(topicId) {
    const savedProgress = localStorage.getItem('qa-learning-progress');
    const progress = savedProgress ? JSON.parse(savedProgress) : {};
    
    progress[topicId] = {
        completed: true,
        completedAt: new Date().toISOString()
    };
    
    localStorage.setItem('qa-learning-progress', JSON.stringify(progress));
    
    // Show completion notification
    showNotification('🎉 ยินดีด้วย! คุณเรียนจบหัวข้อนี้แล้ว');
}

// Notification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        background: linear-gradient(135deg, var(--primary), var(--accent));
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(99, 102, 241, 0.4);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
