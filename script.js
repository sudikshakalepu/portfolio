/* SUDIKSHA KALEPU : portfolio script
   Sections:
     1.  P5.JS    : Particle background (Perlin noise)
     2.  NAME     : Scramble & reveal on profile pic
     3.  TYPING   : Typewriter cycling 10 phrases
     4.  CAROUSEL : Project carousel prev/next with
                    proper animation reset on each advance
     5.  UI       : Hamburger menu
     6.  INIT     : Bootstrap on window load */


/* 1.  P5.JS : PARTICLE BACKGROUND */

let particles      = [];
let lastMouseX     = -1;
let lastMouseY     = -1;
let lastTextChange = 0;
let lastConnTime   = 0;
let isOnProfilePic = false;
let isPicLocked    = false;
let particleConns  = new Map();

const ORIGINAL_NAME = "Sudiksha";
const RANDOM_CHARS  = "AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz";

function setup() {
    const container = document.getElementById('p5-container');
    let canvas      = createCanvas(window.innerWidth, window.innerHeight);
    canvas.parent(container);
    for (let i = 0; i < 300; i++) {
        particles.push(new Particle(random(width), random(height)));
    }
}

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

function draw() {
    background(0, 25);

    if (!isPicLocked && millis() - lastConnTime >= 200) {
        updateConnections();
        lastConnTime = millis();
    }

    if (!isPicLocked && random() < 0.4) {
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

    if (!isPicLocked) {
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

    for (let p of particles) { p.update(); p.display(); }

    const nameEl = document.getElementById("name-text");
    if (nameEl && !isPicLocked && !isOnProfilePic &&
        dist(mouseX, mouseY, lastMouseX, lastMouseY) >= 50 &&
        millis() - lastTextChange >= 200) {
        nameEl.textContent = randomName();
        lastMouseX = mouseX;
        lastMouseY = mouseY;
        lastTextChange = millis();
    }
}

class Particle {
    constructor(x, y) {
        this.pos          = createVector(x, y);
        this.base         = this.pos.copy();
        this.nOX          = random(1000);
        this.nOY          = random(1000);
        this.tOff         = random(1000);
        this.radius       = random(3, 20);
        this.twinkleSpeed = random(0.02, 0.05);
        this.brightness   = random(90, 150);
        this.size         = random(0.8, 1.5);
    }

    update() {
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
        let s       = this.size * (0.8 + twinkle * 0.2) + mi * 1.5;

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

    picEl.addEventListener("mouseover", () => {
        if (!isPicLocked) { nameEl.textContent = ORIGINAL_NAME; isOnProfilePic = true; }
    });
    picEl.addEventListener("mouseout", () => {
        if (!isPicLocked) { isOnProfilePic = false; nameEl.textContent = randomName(); }
    });
    picEl.addEventListener("click", () => {
        isPicLocked = true;
        nameEl.textContent = ORIGINAL_NAME;
    });
    picEl.addEventListener("touchend", (e) => {
        e.preventDefault();
        isPicLocked = true;
        nameEl.textContent = ORIGINAL_NAME;
    });
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

            // Save the link href so it survives the clone
            const clone = content.cloneNode(true);

            // Force a reflow before re-inserting so animation starts clean
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


/* 6.  INIT */
window.addEventListener('load', () => {
    initNameInteraction();
    initCarousel();
    initHamburger();
    typingTimer = setTimeout(typeText, 1000);
});

window.addEventListener('unload', () => {
    if (typingTimer) clearTimeout(typingTimer);
});