// Form validation, WhatsApp integration

// ==========================================
// 1. MOBILE NAVBAR TOGGLE (Hamburger Menu)
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    // Create a hamburger button if it doesn't exist
    const nav = document.querySelector('nav');
    const navLinks = nav ? nav.querySelector('div') : null; // The div containing links
    
    if (nav && navLinks && window.innerWidth <= 768) {
        // Create hamburger button
        const hamburger = document.createElement('button');
        hamburger.innerHTML = '☰';
        hamburger.style.cssText = `
            background: none; border: none; font-size: 2rem; 
            cursor: pointer; color: #0056D2; display: block;
            position: absolute; right: 1rem; top: 0.8rem;
        `;
        hamburger.setAttribute('aria-label', 'Toggle navigation');
        nav.style.position = 'relative';
        nav.prepend(hamburger);
        
        // Hide nav links on mobile initially
        navLinks.style.display = 'none';
        navLinks.style.flexDirection = 'column';
        navLinks.style.width = '100%';
        navLinks.style.marginTop = '1rem';
        
        // Toggle functionality
        hamburger.addEventListener('click', function() {
            if (navLinks.style.display === 'none') {
                navLinks.style.display = 'flex';
                hamburger.innerHTML = '✕';
            } else {
                navLinks.style.display = 'none';
                hamburger.innerHTML = '☰';
            }
        });
        
        // Reset on resize
        window.addEventListener('resize', function() {
            if (window.innerWidth > 768) {
                navLinks.style.display = 'flex';
                navLinks.style.flexDirection = 'row';
                hamburger.style.display = 'none';
            } else {
                navLinks.style.display = 'none';
                navLinks.style.flexDirection = 'column';
                hamburger.style.display = 'block';
            }
        });
    }
});


// ==========================================
// 2. FORM VALIDATION (Find a Tutor & Teacher Register)
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    // Find all forms on the page
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            let isValid = true;
            const requiredFields = form.querySelectorAll('[required]');
            const errorMessages = [];
            
            // Check all required fields
            requiredFields.forEach(field => {
                // Remove previous error styling
                field.style.borderColor = '#e0e0e0';
                const existingError = field.parentElement.querySelector('.error-text');
                if (existingError) existingError.remove();
                
                // Check if empty
                if (!field.value.trim()) {
                    isValid = false;
                    field.style.borderColor = '#dc3545';
                    
                    // Add error message
                    const error = document.createElement('div');
                    error.className = 'error-text';
                    error.style.cssText = 'color: #dc3545; font-size: 0.85rem; margin-top: 5px;';
                    error.textContent = 'This field is required';
                    field.parentElement.appendChild(error);
                }
                
                // Email validation
                if (field.type === 'email' && field.value.trim()) {
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(field.value.trim())) {
                        isValid = false;
                        field.style.borderColor = '#dc3545';
                        const error = document.createElement('div');
                        error.className = 'error-text';
                        error.style.cssText = 'color: #dc3545; font-size: 0.85rem; margin-top: 5px;';
                        error.textContent = 'Please enter a valid email address';
                        field.parentElement.appendChild(error);
                    }
                }
                
                // Phone validation (Nigerian format)
                if (field.type === 'tel' && field.value.trim()) {
                    const phoneRegex = /^(\+234|0)[7-9][0-9]{9}$/;
                    if (!phoneRegex.test(field.value.trim())) {
                        isValid = false;
                        field.style.borderColor = '#dc3545';
                        const error = document.createElement('div');
                        error.className = 'error-text';
                        error.style.cssText = 'color: #dc3545; font-size: 0.85rem; margin-top: 5px;';
                        error.textContent = 'Please enter a valid Nigerian phone number (e.g., 08012345678 or +2348012345678)';
                        field.parentElement.appendChild(error);
                    }
                }
            });
            
            // Prevent submission if invalid
            if (!isValid) {
                e.preventDefault();
                // Scroll to the first error
                const firstError = form.querySelector('[style*="border-color: #dc3545"]');
                if (firstError) {
                    firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        });
        
        // Clear error on input
        form.querySelectorAll('input, select, textarea').forEach(field => {
            field.addEventListener('input', function() {
                this.style.borderColor = '#e0e0e0';
                const error = this.parentElement.querySelector('.error-text');
                if (error) error.remove();
            });
        });
    });
});


// ==========================================
// 3. WHATSAPP INTEGRATION (Enquiry & Contact)
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    // Auto-generate WhatsApp links for all "Enquire" buttons
    const enquireButtons = document.querySelectorAll('.btn-whatsapp, a[href*="wa.me"]');
    
    enquireButtons.forEach(btn => {
        // If the button already has a href, we don't override it (user set it manually)
        if (btn.getAttribute('href') && btn.getAttribute('href').includes('wa.me')) {
            return;
        }
        
        // Add click handler to generate dynamic WhatsApp message
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Get job details from the parent card
            const jobCard = this.closest('.card, .job-card');
            let jobDetails = '';
            let jobId = '';
            let subject = '';
            
            if (jobCard) {
                // Extract Job ID (from the text or data attribute)
                const idElement = jobCard.querySelector('[data-job-id]');
                if (idElement) {
                    jobId = idElement.dataset.jobId;
                } else {
                    // Try to find it in the URL or text
                    const text = jobCard.textContent;
                    const idMatch = text.match(/Job ID[:\s]*(\d+)/i);
                    if (idMatch) jobId = idMatch[1];
                }
                
                // Extract Subject
                const h3 = jobCard.querySelector('h3');
                if (h3) subject = h3.textContent.trim();
            }
            
            // Build WhatsApp message
            const phoneNumber = '2347057927515'; // Replace with your actual company WhatsApp number
            let message = `I am interested in a teaching job on TeachVora.`;
            if (jobId) message += `\nJob ID: ${jobId}`;
            if (subject) message += `\nSubject: ${subject}`;
            message += `\n\nMy name is: `;
            
            // Encode message for URL
            const encodedMessage = encodeURIComponent(message);
            const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
            
            // Open WhatsApp
            window.open(whatsappUrl, '_blank');
        });
    });
});


// ==========================================
// 4. PASSWORD STRENGTH INDICATOR (For Registration)
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    const passwordFields = document.querySelectorAll('input[type="password"]');
    
    passwordFields.forEach(passwordField => {
        // Create strength indicator
        const indicator = document.createElement('div');
        indicator.style.cssText = `
            height: 4px; background: #e0e0e0; border-radius: 2px;
            margin-top: 5px; transition: all 0.3s;
        `;
        passwordField.parentElement.appendChild(indicator);
        
        passwordField.addEventListener('input', function() {
            const strength = calculatePasswordStrength(this.value);
            updateStrengthIndicator(indicator, strength);
        });
    });
    
    function calculatePasswordStrength(password) {
        let strength = 0;
        if (password.length >= 8) strength += 1;
        if (password.length >= 12) strength += 1;
        if (/[A-Z]/.test(password)) strength += 1;
        if (/[0-9]/.test(password)) strength += 1;
        if (/[^A-Za-z0-9]/.test(password)) strength += 1;
        return Math.min(strength, 4); // Max 4
    }
    
    function updateStrengthIndicator(indicator, strength) {
        const colors = ['#dc3545', '#ffc107', '#ffc107', '#28a745', '#28a745'];
        const labels = ['Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
        indicator.style.width = (strength / 4 * 100) + '%';
        indicator.style.backgroundColor = colors[strength];
        indicator.title = labels[strength];
    }
});


// ==========================================
// 5. CONFIRMATION DIALOGS (For Delete/Suspend actions)
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    const dangerousButtons = document.querySelectorAll('[data-confirm]');
    
    dangerousButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            const message = this.dataset.confirm || 'Are you sure you want to perform this action?';
            if (!confirm(message)) {
                e.preventDefault();
            }
        });
    });
});


// ==========================================
// 6. AUTO-DISMISS ALERTS (Flash messages)
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    const alerts = document.querySelectorAll('.alert, [class*="msg"], [class*="message"]');
    
    alerts.forEach(alert => {
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            alert.style.transition = 'opacity 0.5s ease';
            alert.style.opacity = '0';
            setTimeout(() => {
                alert.style.display = 'none';
            }, 500);
        }, 5000);
    });
});