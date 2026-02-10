console.log("Script loaded! v=23");

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM ready");

    if (typeof gsap === 'undefined') {
        console.error("GSAP not loaded!");
        alert("System Error: Animation libraries failed to load.");
        return;
    }

    const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwTawbucBUasv6s_AZ524da_ZADQWMCHOKO4hWqQNscybGTgrbMYYkRMhi4XnLrWtLkWQ/exec';

    const modal = document.getElementById('modalScrollArea');
    const openBtn = document.getElementById('openBtn');
    const closeBtn = document.getElementById('closeBtn');
    const form = document.getElementById('registrationForm');
    const submitBtn = document.getElementById('submitBtn');
    const successMsg = document.getElementById('successMsg');
    const formStatus = document.getElementById('form-status');

    /* ---------- HERO ANIMATION ---------- */
    gsap.from("#hero", {
        opacity: 0,
        y: 20,
        duration: 1.2,
        ease: "power3.out",
        delay: 0.2
    });

    /* ---------- MODAL OPEN ---------- */
    window.openRegistrationModal = function () {
        const modalInfo = document.getElementById('modalInfo');

        if (modalInfo) modalInfo.style.display = 'flex';
        if (form) {
            form.classList.remove('hidden');
            form.style.display = 'block';
        }
        if (successMsg) {
            successMsg.classList.add('hidden');
            successMsg.style.display = 'none';
        }

        modal.classList.remove('hidden', 'pointer-events-none', 'opacity-0');
        modal.style.display = 'flex';
        modal.style.pointerEvents = 'auto';
        modal.style.opacity = '1';

        gsap.set(modal, { autoAlpha: 1 });
        gsap.fromTo("#modalContent",
            { scale: 0.8, opacity: 0 },
            { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.7)" }
        );
    };

    openBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        window.openRegistrationModal();
    });

    /* ---------- MODAL CLOSE ---------- */
    closeBtn.addEventListener('click', () => {
        gsap.to("#modalContent", {
            scale: 0.8,
            opacity: 0,
            duration: 0.3,
            onComplete: () => {
                gsap.set(modal, { autoAlpha: 0 });
                modal.classList.add('hidden', 'pointer-events-none', 'opacity-0');
                modal.style.display = 'none';
            }
        });
    });

    /* ---------- TEAM MODE TOGGLE ---------- */
    const participationMode = document.getElementById('participationMode');
    const teammateSection = document.getElementById('teammateSection');

    participationMode?.addEventListener('change', (e) => {
        const isTeam = e.target.value === 'Team of Two';
        teammateSection.classList.toggle('hidden', !isTeam);

        teammateSection
            .querySelectorAll('input, select')
            .forEach(el => isTeam
                ? el.setAttribute('required', 'required')
                : el.removeAttribute('required')
            );
    });

    /* ---------- FORM SUBMIT ---------- */
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        formStatus.textContent = '';

        const mobileRegex = /^\d{10}$/;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        // Validate first participant
        if (!mobileRegex.test(form.mobile.value.trim())) {
            formStatus.textContent = "ERROR: Mobile number must be exactly 10 digits.";
            form.mobile.focus();
            return;
        }

        if (!emailRegex.test(form.email.value.trim())) {
            formStatus.textContent = "ERROR: Please enter a valid email address.";
            form.email.focus();
            return;
        }

        // Validate teammate if Team of Two is selected
        if (form.participation_mode.value === 'Team of Two') {
            const teammateMobile = form.teammate_mobile?.value?.trim() || '';
            const teammateEmail = form.teammate_email?.value?.trim() || '';

            if (teammateMobile && !mobileRegex.test(teammateMobile)) {
                formStatus.textContent = "ERROR: Teammate mobile number must be exactly 10 digits.";
                form.teammate_mobile.focus();
                return;
            }

            if (teammateEmail && !emailRegex.test(teammateEmail)) {
                formStatus.textContent = "ERROR: Please enter a valid teammate email address.";
                form.teammate_email.focus();
                return;
            }
        }

        const originalBtnText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'COMPILING...';

        try {
            const raw = new FormData(form);
            const payload = new FormData();

            // ---- EXACT GOOGLE SHEETS COLUMN ORDER ----
            payload.append("Timestamp", new Date().toISOString());
            payload.append("Name", raw.get("name") || "");
            payload.append("Roll Number", raw.get("roll_number") || "");
            payload.append("Year", raw.get("year") || "");
            payload.append("Branch", raw.get("branch") || "");
            payload.append("Section", raw.get("section") || "");
            payload.append("Email", raw.get("email") || "");
            payload.append("Mobile", raw.get("mobile") || "");
            payload.append("Participation Mode", raw.get("participation_mode") || "");

            payload.append("Teammate Name", raw.get("teammate_name") || "");
            payload.append("Teammate Roll Number", raw.get("teammate_roll_number") || "");
            payload.append("Teammate Year", raw.get("teammate_year") || "");
            payload.append("Teammate Branch", raw.get("teammate_branch") || "");
            payload.append("Teammate Section", raw.get("teammate_section") || "");
            payload.append("Teammate Email", raw.get("teammate_email") || "");
            payload.append("Teammate Mobile", raw.get("teammate_mobile") || "");

            payload.append("Expectations", raw.get("expectations") || "");

            const response = await fetch(APPS_SCRIPT_URL, {
                method: "POST",
                body: payload
            });

            // Try to read the response text
            const responseText = await response.text();

            // Check for duplicate or error responses
            if (responseText.includes("DUPLICATE:")) {
                formStatus.textContent = responseText.replace("DUPLICATE: ", "ERROR: ");
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
                return;
            }

            if (responseText.includes("ERROR:")) {
                formStatus.textContent = responseText;
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
                return;
            }

            handleSuccess();

        } catch (err) {
            console.error(err);
            // For network errors or CORS issues, assume success
            handleSuccess();
        }
    });


    /* ---------- SUCCESS HANDLER ---------- */
    function handleSuccess() {
        const modalInfo = document.getElementById('modalInfo');
        if (modalInfo) modalInfo.style.display = 'none';

        form.classList.add('hidden');
        form.reset(); // Clear the form

        successMsg.classList.remove('hidden');
        successMsg.style.display = 'flex';

        // Scroll to success message
        const scrollArea = document.getElementById('modalScrollArea');
        if (scrollArea) {
            scrollArea.scrollTo({
                top: successMsg.offsetTop - 40,
                behavior: 'smooth'
            });
        }

        // Show simple success text
        const matrixContainer = document.getElementById('matrix-success');
        const subtext = document.getElementById('success-subtext');

        if (matrixContainer) {
            matrixContainer.innerHTML = '<span class="font-press-start text-codepink text-4xl">SUCCESSFUL!</span>';
        }

        if (subtext) {
            subtext.style.opacity = '1';
        }

        // Restore button
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'REGISTER NOW';
    }


    /* ---------- BACKGROUND PARTICLES ---------- */
    const initParticles = () => {
        const canvas = document.getElementById('bgCanvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        let particles = [];

        class Particle {
            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.size = Math.random() * 2 + 0.5;
                this.dx = (Math.random() - 0.5) * 0.5;
                this.dy = (Math.random() - 0.5) * 0.5;
            }
            update() {
                this.x += this.dx;
                this.y += this.dy;
            }
            draw() {
                ctx.fillStyle = 'rgba(217,70,239,0.6)';
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        function init() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            particles = [];
            for (let i = 0; i < 80; i++) particles.push(new Particle());
        }

        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => { p.update(); p.draw(); });
            requestAnimationFrame(animate);
        }

        window.addEventListener('resize', init);
        init();
        animate();
    };

    setTimeout(initParticles, 100);
});
