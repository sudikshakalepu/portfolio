/* SUDIKSHA KALEPU : portfolio script
   Sections:
     1.  P5.JS    : Particle background (Perlin noise)
     2.  NAME     : Scramble & reveal on profile pic
     3.  TYPING   : Typewriter cycling 10 phrases
     4.  CAROUSEL : Project carousel prev/next with
                    proper animation reset on each advance
     5.  UI       : Hamburger menu
     6.  NAV      : Anchor links scroll inside #snap-wrap
     7.  INDICATOR: Right-side dot nav updates on scroll
     8.  INIT     : Bootstrap on window load */


/* 1.  P5.JS : PARTICLE BACKGROUND

   Two distinct modes controlled by isPicLocked:

   PRE-CLICK (isPicLocked = false) — referenced code style:
     - Linear vx/vy motion, wall-bounce on edges
     - First particle tracks mouse
     - Connections drawn between nearby particles that are also
       near the mouse, fading toward the edge of CONNECT_RADIUS

   POST-CLICK (isPicLocked = true) — original Perlin noise style:
     - Each particle drifts via Perlin noise from a base position
     - Ambient random lines between any two particles within 80px
     - Mouse-proximity connections via particleConns Map

   Each Particle stores properties for both modes.
   On click, base is snapped to current pos so Perlin noise
   begins drifting from exactly where the particle is at that
   moment — no visual jump. */

let particles      = [];
let lastMouseX     = -1;
let lastMouseY     = -1;
let lastTextChange = 0;
let isOnProfilePic = false;
let isPicLocked    = false;
let wasPicLocked   = false;   /* tracks transition to trigger base snap */

/* Post-click connection state — restored from original */
let particleConns = new Map();
let lastConnTime  = 0;

const ORIGINAL_NAME = "Sudiksha";
const RANDOM_CHARS  = "AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz";

/* Pre-click connection thresholds — referenced code style */
const CONNECT_DIST   = 80;
const CONNECT_RADIUS = 260;

function setup() {
    const container = document.getElementById('p5-container');
    let canvas      = createCanvas(window.innerWidth, window.innerHeight);
    canvas.parent(container);
    for (let i = 0; i < 200; i++) {
        particles.push(new Particle(random(width), random(height)));
    }
}

/* PRE-CLICK : draw connections between nearby particles near mouse */
function drawConnectionsNew() {
    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            const a = particles[i];
            const b = particles[j];

            /* 1. Are the two particles close to each other? */
            const dx = a.pos.x - b.pos.x;
            const dy = a.pos.y - b.pos.y;
            if (abs(dx) >= CONNECT_DIST || abs(dy) >= CONNECT_DIST) continue;

            /* 2. Is particle a near the mouse? */
            const dMx = a.pos.x - mouseX;
            const dMy = a.pos.y - mouseY;
            if (abs(dMx) >= CONNECT_RADIUS || abs(dMy) >= CONNECT_RADIUS) continue;

            /* Fade line out as it approaches the edge of CONNECT_RADIUS */
            const dotDist = sqrt(dMx * dMx + dMy * dMy);
            let ratio = dotDist / CONNECT_RADIUS - 0.3;
            if (ratio < 0) ratio = 0;

            stroke(140, 180, 255, (1 - ratio) * 255);
            strokeWeight(0.3);
            line(a.pos.x, a.pos.y, b.pos.x, b.pos.y);
        }
    }
}

/* POST-CLICK : original ambient + mouse-map connections */
function updateConnections() {
    particleConns.clear();
    for (let p1 of particles) {
        if (dist(mouseX, mouseY, p1.pos.x, p1.pos.y) < 120) {
            let nearby = particles
                .filter(p2 => p2 !== p1 && dist(p1.pos.x, p1.pos.y, p2.pos.x, p2.pos.y) < 200)
                .sort(() => Math.random() - 0.3)
                .slice(0, 16);
            particleConns.set(p1, nearby);
        }
    }
}

function drawConnectionsOld() {
    /* Ambient random low-alpha lines between any two particles within 80px */
    if (random() < 0.4) {
        let p1 = random(particles);
        for (let p2 of particles) {
            if (p1 !== p2) {
                let d = dist(p1.pos.x, p1.pos.y, p2.pos.x, p2.pos.y);
                if (d < 80) {
                    stroke(140, 180, 255, map(d, 0, 80, 30, 0));
                    strokeWeight(0.4);
                    line(p1.pos.x, p1.pos.y, p2.pos.x, p2.pos.y);
                }
            }
        }
    }

    /* Mouse-triggered bright connections from pre-computed Map */
    particleConns.forEach((conns, p1) => {
        let md = dist(mouseX, mouseY, p1.pos.x, p1.pos.y);
        for (let p2 of conns) {
            let d     = dist(p1.pos.x, p1.pos.y, p2.pos.x, p2.pos.y);
            let alpha = map(d, 0, 100, 80, 0) * map(md, 0, 120, 1, 0);
            stroke(140, 180, 255, alpha);
            strokeWeight(0.5);
            line(p1.pos.x, p1.pos.y, p2.pos.x, p2.pos.y);
        }
    });
}

function draw() {
    background(0, 25);

    if (isPicLocked) {
        /* ── POST-CLICK : Perlin noise mode ── */

        /* On the frame isPicLocked first becomes true, snap each
           particle's Perlin base to its current position so the
           noise drift begins from exactly where the particle is. */
        if (!wasPicLocked) {
            for (let p of particles) {
                p.base = p.pos.copy();
            }
            wasPicLocked = true;
        }

        /* No connections post-click — particles drift silently */
        for (let p of particles) { p.updatePerlin(); p.display(); }

    } else {
        /* ── PRE-CLICK : wall-bounce mode ── */

        /* First particle tracks mouse */
        particles[0].pos.x = mouseX;
        particles[0].pos.y = mouseY;
        for (let i = 1; i < particles.length; i++) {
            particles[i].updateBounce();
        }

        drawConnectionsNew();

        for (let p of particles) { p.display(); }
    }

    /* Name scramble on mouse movement */
    const nameEl = document.getElementById("name-text");
    if (nameEl && !isPicLocked && !isOnProfilePic &&
        dist(mouseX, mouseY, lastMouseX, lastMouseY) >= 50 &&
        millis() - lastTextChange >= 200) {
        nameEl.textContent = randomName();
        lastMouseX     = mouseX;
        lastMouseY     = mouseY;
        lastTextChange = millis();
    }
}

class Particle {
    constructor(x, y) {
        this.pos = createVector(x, y);

        /* PRE-CLICK : wall-bounce properties */
        this.vx = random(-0.5, 0.5);
        this.vy = random(-0.5, 0.5);

        /* POST-CLICK : Perlin noise properties.
           base is snapped to current pos on click so there's no jump. */
        this.base   = this.pos.copy();
        this.nOX    = random(1000);
        this.nOY    = random(1000);
        this.radius = random(3, 20);   /* max drift distance */

        /* Shared display properties */
        this.r            = random(0.8, 1.5);
        this.tOff         = random(1000);
        this.twinkleSpeed = random(0.02, 0.05);
        this.brightness   = random(90, 150);
    }

    /* PRE-CLICK : linear motion, wall bounce */
    updateBounce() {
        if (this.pos.y < 0 || this.pos.y > height) this.vy *= -1;
        if (this.pos.x < 0 || this.pos.x > width)  this.vx *= -1;
        this.pos.x += this.vx;
        this.pos.y += this.vy;
        this.tOff += this.twinkleSpeed;
    }

    /* POST-CLICK : Perlin noise drift from base position */
    updatePerlin() {
        this.pos.x = this.base.x + map(noise(this.nOX), 0, 1, -this.radius, this.radius);
        this.pos.y = this.base.y + map(noise(this.nOY), 0, 1, -this.radius, this.radius);
        this.nOX  += 0.01;
        this.nOY  += 0.01;
        this.tOff += this.twinkleSpeed;
    }

    display() {
        let md      = dist(mouseX, mouseY, this.pos.x, this.pos.y);
        let mi      = pow(map(md, 0, 200, 1, 0, true), 1.5);
        let twinkle = (sin(this.tOff) * 0.5 + 0.5) * (noise(this.tOff * 0.5) * 0.5 + 0.5);
        let b       = this.brightness * (0.5 + twinkle * 0.5) + mi * 195;
        let s       = this.r * (0.8 + twinkle * 0.2) + mi * 1.5;

        stroke(140, 180, 255, b);
        strokeWeight(s);
        point(this.pos.x, this.pos.y);

        if (mi > 0.3) {
            stroke(140, 180, 255, b * 0.3);
            strokeWeight(s * 2);
            point(this.pos.x, this.pos.y);
        }
    }
}

function windowResized() {
    resizeCanvas(window.innerWidth, window.innerHeight);
}

function randomName() {
    return Array.from({ length: 8 }, () =>
        RANDOM_CHARS[Math.floor(Math.random() * RANDOM_CHARS.length)]
    ).join("");
}


/* 2.  NAME : Profile pic hover/click states */
function initNameInteraction() {
    const nameEl = document.getElementById("name-text");
    const picEl  = document.getElementById("profile-pic");
    if (!nameEl || !picEl) return;

    const lockName = () => {
        isPicLocked        = true;
        nameEl.textContent = ORIGINAL_NAME;
    };

    picEl.addEventListener("mouseover", () => {
        if (!isPicLocked) { nameEl.textContent = ORIGINAL_NAME; isOnProfilePic = true; }
    });
    picEl.addEventListener("mouseout", () => {
        if (!isPicLocked) { isOnProfilePic = false; nameEl.textContent = randomName(); }
    });
    picEl.addEventListener("click", lockName);
    picEl.addEventListener("touchend", (e) => { e.preventDefault(); lockName(); });
}


/* 3.  TYPING : Typewriter cycling 10 phrases */
const PHRASES = [
    "data science.",
    "product management.",
    "software development.",
    "cloud solutions.",
    "machine learning.",
    "computer vision.",
    "natural language processing.",
    "human-computer interaction.",
    "physical computing.",
    "computational media."
];

let currentPhrase = "";
let phraseIndex   = 0;
let charIdx       = 0;
let isDeleting    = false;
let typingTimer   = null;

function typeText() {
    const el = document.getElementById("changing-text");
    if (!el) return;
    if (typingTimer) clearTimeout(typingTimer);

    if (isDeleting) {
        currentPhrase = currentPhrase.slice(0, -1);
        typingTimer   = setTimeout(typeText, 60);
    } else {
        currentPhrase = PHRASES[phraseIndex].slice(0, charIdx + 1);
        charIdx++;
        typingTimer = setTimeout(typeText, 60 + Math.random() * 50);
    }

    el.textContent = currentPhrase;

    if (!isDeleting && charIdx === PHRASES[phraseIndex].length) {
        isDeleting  = true;
        typingTimer = setTimeout(typeText, 1500);
        return;
    }
    if (isDeleting && currentPhrase === "") {
        isDeleting  = false;
        phraseIndex = (phraseIndex + 1) % PHRASES.length;
        charIdx     = 0;
        typingTimer = setTimeout(typeText, 500);
    }
}


/* 4.  CAROUSEL
   
   DOM order determines which card is featured.
   CSS makes .item:nth-child(2) the full-size featured card.
   
   next → move items[0] to end  (advance forward)
   prev → move last item to front (go back)
   
   After each DOM move, triggerContentAnimation() removes and
   re-adds the content block on the new nth-child(2) so CSS
   animation keyframes replay from 0. */
function initCarousel() {
    const nextBtn = document.querySelector('.next');
    const prevBtn = document.querySelector('.prev');
    const slide   = document.querySelector('.slide');
    if (!nextBtn || !prevBtn || !slide) return;

    /**
     * Forces the CSS entry animation to replay on the
     * newly-featured card by removing the .content node
     * and re-inserting a fresh clone of it.
     */
    function triggerContentAnimation() {
        // Use setTimeout(0) so the DOM reorder completes first
        setTimeout(() => {
            const featured = slide.querySelector('.item:nth-child(2)');
            if (!featured) return;
            const content = featured.querySelector('.content');
            if (!content) return;
            // Force a reflow before re-inserting so animation starts clean
            const clone = content.cloneNode(true);
            content.remove();
            void featured.offsetWidth;
            featured.appendChild(clone);
        }, 0);
    }

    nextBtn.addEventListener('click', () => {
        const items = document.querySelectorAll('.item');
        slide.appendChild(items[0]);
        triggerContentAnimation();
    });

    prevBtn.addEventListener('click', () => {
        const items = document.querySelectorAll('.item');
        slide.prepend(items[items.length - 1]);
        triggerContentAnimation();
    });

    // Touch swipe: left = next, right = prev
    let touchStartX = 0;

    slide.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
    }, { passive: true });

    slide.addEventListener('touchend', (e) => {
        const dx = e.changedTouches[0].clientX - touchStartX;
        if (Math.abs(dx) < 40) return;
        if (dx < 0) nextBtn.click();
        else        prevBtn.click();
    }, { passive: true });
}


/* 5.  UI : Hamburger menu */
function initHamburger() {
    const btn  = document.getElementById('hamburger');
    const menu = document.getElementById('mobile-menu');
    if (!btn || !menu) return;

    btn.addEventListener('click', () => {
        btn.classList.toggle('open');
        menu.classList.toggle('open');
    });

    menu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            btn.classList.remove('open');
            menu.classList.remove('open');
        });
    });
}


/* 6.  NAV : Anchor links scroll inside #snap-wrap.
   Because scroll-snap lives on the wrap div rather than
   html/body, native href="#id" scrolls the wrong context.
   This intercepts all hash links and scrolls the wrap
   directly, offsetting 64px for the fixed nav bar. */
function initNavLinks() {
    const wrap = document.getElementById('snap-wrap');
    if (!wrap) return;

    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', (e) => {
            const target = document.querySelector(link.getAttribute('href'));
            if (!target) return;
            e.preventDefault();
            wrap.scrollTo({ top: target.offsetTop - 64, behavior: 'smooth' });
        });
    });
}


/* 7.  INDICATOR : Update right-side dot nav on scroll.
   Uses IntersectionObserver on each section — when a section
   is more than 50% visible inside #snap-wrap, its dot becomes
   active. Threshold 0.5 means the dot switches exactly when
   the section is the dominant one on screen. */
function initPageIndicator() {
    const dots     = document.querySelectorAll('.indicator-dot');
    const sections = document.querySelectorAll('section');
    const wrap     = document.getElementById('snap-wrap');
    if (!dots.length || !sections.length || !wrap) return;

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    /* Remove active from all dots, add to matching one */
                    dots.forEach(d => d.classList.remove('active'));
                    const dot = document.querySelector(`.indicator-dot[data-section="${entry.target.id}"]`);
                    if (dot) dot.classList.add('active');
                }
            });
        },
        {
            root:      wrap,   /* observe relative to the snap container */
            threshold: 0.5     /* trigger when section is 50%+ visible */
        }
    );

    sections.forEach(s => observer.observe(s));
}


/* 8.  INIT */
window.addEventListener('load', () => {
    initNameInteraction();
    initCarousel();
    initHamburger();
    initNavLinks();
    initPageIndicator();
    typingTimer = setTimeout(typeText, 1000);
});

window.addEventListener('unload', () => {
    if (typingTimer) clearTimeout(typingTimer);
});
