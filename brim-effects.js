<script>
// BrimstoneTech - Intense Originkit-inspired Effects
(function() {
    'use strict';

    // Intense Ember + Particle Sphere System
    function createIntenseParticles() {
        const canvas = document.createElement('canvas');
        canvas.id = 'brim-intense-particles';
        canvas.style.position = 'fixed';
        canvas.style.inset = '0';
        canvas.style.zIndex = '1';
        canvas.style.pointerEvents = 'none';
        canvas.style.opacity = '0.9';
        canvas.style.mixBlendMode = 'screen';
        document.body.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        let particles = [];

        function resize() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        resize();
        window.addEventListener('resize', resize);

        class IntenseEmber {
            constructor() { this.reset(); }
            reset() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height * 0.8;
                this.size = Math.random() * 9 + 4;
                this.vx = (Math.random() - 0.5) * 4;
                this.vy = (Math.random() - 0.5) * 4;
                this.opacity = 1;
                this.life = 80 + Math.random() * 60;
            }
            update() {
                this.x += this.vx;
                this.y += this.vy;
                this.vx *= 0.98;
                this.vy *= 0.98;
                this.opacity = this.life / 100;
                this.size *= 0.975;
                this.life--;
                if (this.life <= 0) this.reset();
            }
            draw() {
                ctx.save();
                ctx.globalAlpha = this.opacity;
                const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 3);
                grad.addColorStop(0, '#FFEE88');
                grad.addColorStop(0.4, '#FF5500');
                grad.addColorStop(1, 'transparent');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        }

        // Spawn many particles
        for (let i = 0; i < 80; i++) particles.push(new IntenseEmber());

        setInterval(() => {
            if (particles.length < 160) particles.push(new IntenseEmber());
        }, 18);

        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => { p.update(); p.draw(); });
            requestAnimationFrame(animate);
        }
        animate();
    }

    // Intense Hover Dissolve + Gravity Pull
    function initIntenseHovers() {
        document.querySelectorAll('div, section > *, .card, article').forEach(el => {
            if (el.textContent.length < 10) return;

            el.style.transition = 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.4s';
            
            el.addEventListener('mouseenter', () => {
                el.style.transform = 'scale(1.12) translateY(-20px) rotate(1deg)';
                el.style.boxShadow = '0 0 80px rgba(248, 113, 10, 0.9)';
                el.style.zIndex = '10';
            });
            
            el.addEventListener('mouseleave', () => {
                el.style.transform = 'scale(1) translateY(0) rotate(0deg)';
                el.style.boxShadow = '';
                el.style.zIndex = '';
            });
        });
    }

    // Magnetic + Flame Pulse CTAs
    function initPunchyCTAs() {
        document.querySelectorAll('a, button').forEach(el => {
            el.addEventListener('mousemove', e => {
                const rect = el.getBoundingClientRect();
                const x = (e.clientX - rect.left - rect.width / 2) * 0.45;
                const y = (e.clientY - rect.top - rect.height / 2) * 0.45;
                el.style.transform = `translate(${x}px, ${y}px) scale(1.15)`;
            });
            el.addEventListener('mouseleave', () => {
                el.style.transform = '';
            });
        });
    }

    // Scroll-triggered Intense Burst
    function initScrollBurst() {
        let fired = false;
        window.addEventListener('scroll', () => {
            if (window.scrollY > window.innerHeight * 0.55 && !fired) {
                fired = true;
                for (let i = 0; i < 70; i++) {
                    setTimeout(() => {
                        const p = document.createElement('div');
                        p.style.position = 'fixed';
                        p.style.left = Math.random() * 100 + 'vw';
                        p.style.top = Math.random() * 70 + 'vh';
                        p.style.width = '10px';
                        p.style.height = '10px';
                        p.style.background = '#FFAA00';
                        p.style.borderRadius = '50%';
                        p.style.boxShadow = '0 0 30px #FF3300';
                        p.style.zIndex = '9999';
                        document.body.appendChild(p);
                        setTimeout(() => p.remove(), 2000);
                    }, i * 8);
                }
            }
        });
    }

    // Initialize everything
    window.addEventListener('load', () => {
        createIntenseParticles();
        initIntenseHovers();
        initPunchyCTAs();
        initScrollBurst();
        
        console.log('%cIntense Brimstone Effects Loaded 🔥', 'color:#FF4400; font-size:15px; font-weight:bold');
    });
})();
</script>
