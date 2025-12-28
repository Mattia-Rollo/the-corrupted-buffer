// --- CONFIGURATION ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set resolution (Low res for retro feel)
// canvas.width = 320;
// canvas.height = 240;
canvas.width = 640;
canvas.height = 480;

// --- GAME STATE ---
const player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    size: 4, // A bit bigger than 1 pixel to be visible
    speed: 2,
    color: '#00ff00' // Hacker Green
};
let glitches = [];
let ammountOfGlitches = 10;

// Input State (Keys pressed)
const keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    Space: false
};
let lastDebugTime = 0; // Per gestire il cooldown

let pulseEffect = {
    active: false,
    x: 0,
    y: 0,
    radius: 0
};

// --- SCORE & GOAL ---
let score = 0; // Il punteggio parte da zero

const goal = {
    x: Math.random() * (canvas.width - 10),
    y: Math.random() * (canvas.height - 10),
    vx: (Math.random() - 0.5) * 2, // <--- Velocità X
    vy: (Math.random() - 0.5) * 2, // <--- Velocità Y
    size: 12, // Un po' più grande del player
    color: '#00ffff', // Ciano (Cyberpunk style)
    isCorrupted: true
};

// --- INPUT HANDLERS ---
// Listen for keydown (press)
window.addEventListener('keydown', (e) => {
    if (keys.hasOwnProperty(e.code) || e.code === 'Space') {
        keys[e.code] = true;
    }
});

// Listen for keyup (release)
window.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.code) || e.code === 'Space') {
        keys[e.code] = false;
    }
});

// --- CORE FUNCTIONS ---

function update() {
    // Move Player based on Input
    if (keys.ArrowUp) player.y -= player.speed;
    if (keys.ArrowDown) player.y += player.speed;
    if (keys.ArrowLeft) player.x -= player.speed;
    if (keys.ArrowRight) player.x += player.speed;

    // Boundary Checks (Keep player inside screen)
    // Simple logic: if < 0, set to 0. If > width, set to width.
    if (player.x < 0) player.x = 0;
    if (player.x > canvas.width - player.size) player.x = canvas.width - player.size;
    if (player.y < 0) player.y = 0;
    if (player.y > canvas.height - player.size) player.y = canvas.height - player.size;
    glitches.forEach(glitch => {
        // 1. Applica il movimento
        glitch.x += glitch.vx;
        glitch.y += glitch.vy;

        // 2. Rimbalzo sui bordi (Bounce logic)
        // Se tocca sinistra (0) o destra (width), inverti la velocità X
        if (glitch.x <= 0 || glitch.x + glitch.size >= canvas.width) {
            glitch.vx *= -1;
        }
        // Se tocca sopra (0) o sotto (height), inverti la velocità Y
        if (glitch.y <= 0 || glitch.y + glitch.size >= canvas.height) {
            glitch.vy *= -1;
        }
    });

    // --- UPDATE GOAL POSITION (Mimetismo) ---
    goal.x += goal.vx;
    goal.y += goal.vy;

    // Rimbalzo del Goal sui bordi
    if (goal.x <= 0 || goal.x + goal.size >= canvas.width) goal.vx *= -1;
    if (goal.y <= 0 || goal.y + goal.size >= canvas.height) goal.vy *= -1;

    checkCollisions();
    // Check Goal Collection (Did we get the data?)
    if (
        player.x < goal.x + goal.size &&
        player.x + player.size > goal.x &&
        player.y < goal.y + goal.size &&
        player.y + player.size > goal.y
    ) {
        if (goal.isCorrupted) {
            // HAI TOCCATO IL GOAL CORROTTO -> MORTE!
            console.log("CRASH! Tried to access corrupted memory!");
            score = 0;
            player.x = canvas.width / 2;
            player.y = canvas.height / 2;
            glitches = [];
            spawnGlitches(10);
            // Resettiamo il goal altrove
            goal.x = Math.random() * (canvas.width - 10);
            goal.y = Math.random() * (canvas.height - 10);
        } else {
            // HAI TOCCATO IL GOAL PURO -> VITTORIA!
            score += 64;
            console.log("Data recovered! Score:", score);

            // Sposta il goal
            let goalNextPosition = {
                x: Math.random() * (canvas.width - 10),
                y: Math.random() * (canvas.height - 10)
            };
            // ... (tieni il tuo codice che controlla che non nasca nei glitch) ...
            goal.x = goalNextPosition.x;
            goal.y = goalNextPosition.y;

            goal.vx = (Math.random() - 0.5) * 2;
            goal.vy = (Math.random() - 0.5) * 2;

            goal.isCorrupted = true;
            spawnGlitches(1);
        }
    }

    if (keys.Space) {
        triggerDebug();
        keys.Space = false; // Resetta subito per non spararne 100 al secondo
    }
}

function draw() {
    // 1. THE GHOSTING EFFECT (Magic Trick)
    // Instead of clearing the screen completely (clearRect),
    // we draw a semi-transparent black rectangle.
    // This creates the "trail" effect because old frames fade out slowly.
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Draw Player
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.size, player.size);

    // 3. Draw Glitches
    // drawBackground();
    glitches.forEach(glitch => {
        // Effetto tremolio: disegniamo il glitch leggermente spostato a caso
        // per farlo sembrare instabile, ma la sua "vera" posizione resta fissa
        const shakeX = (Math.random() - 0.5) * 4;
        const shakeY = (Math.random() - 0.5) * 4;

        ctx.fillStyle = glitch.colors[Math.floor(Math.random() * glitch.colors.length)];
        ctx.fillRect(glitch.x + shakeX, glitch.y + shakeY, glitch.size, glitch.size);
    });

    // 4. Draw Goal
    if (goal.isCorrupted) {
        // DISEGNO CORROTTO (Come un glitch nemico)
        const shakeX = (Math.random() - 0.5) * 4;
        const shakeY = (Math.random() - 0.5) * 4;
        // Usiamo colori da glitch per camuffarlo
        const glitchColors = ['#ff0000', '#00ff00', '#0000ff'];
        ctx.fillStyle = glitchColors[Math.floor(Math.random() * glitchColors.length)];
        ctx.fillRect(goal.x + shakeX, goal.y + shakeY, goal.size, goal.size);
    } else {
        // DISEGNO PURO (Stabile e Ciano)
        ctx.fillStyle = goal.color; // #00ffff
        // Magari aggiungiamo un bordo bianco per far capire che è pronto
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(goal.x, goal.y, goal.size, goal.size);
        ctx.fillRect(goal.x, goal.y, goal.size, goal.size);
    }

    // 5. Draw HUD (Heads-up Display) - Il Punteggio
    ctx.fillStyle = '#fff';
    ctx.font = '16px "Courier New", monospace'; // Font stile terminale
    ctx.fillText('RAM RECOVERED: ' + score + 'kb', 5, 15); // Scrive in alto a sinistra

    // 6. Draw Pulse Effect (L'onda d'urto)
    if (pulseEffect.active) {
        ctx.beginPath();
        ctx.arc(pulseEffect.x, pulseEffect.y, pulseEffect.radius, 0, Math.PI * 2);
        ctx.strokeStyle = '#ffffff'; // Colore bianco
        ctx.lineWidth = 3;
        ctx.stroke();

        // Espandi il cerchio
        pulseEffect.radius += 10; // Velocità espansione

        // Se diventa troppo grande, spegnilo
        if (pulseEffect.radius > 100) { // 100 deve essere uguale al range del filtro
            pulseEffect.active = false;
        }
    }
}

function spawnGlitches(amount) {
    for (let i = 0; i < amount; i++) {
        // Create a new object for every glitch with a fixed position
        const glitch = {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 2, // <--- NUOVO: Velocità X (tra -1 e 1)
            vy: (Math.random() - 0.5) * 2, // <--- NUOVO: Velocità Y (tra -1 e 1)
            size: 12, // bigger than player
            colors: ['#ff0000', '#00ff00', '#0000ff'] // red = danger
        };
        // Save it in the list
        glitches.push(glitch);
    }
}

function triggerDebug() {
    const now = Date.now();
    if (now - lastDebugTime < 1000) return;

    lastDebugTime = now;
    console.log("DEBUG PULSE ACTIVATED!");

    // Attiviamo l'animazione
    pulseEffect.active = true;
    pulseEffect.x = player.x + player.size / 2; // Centro del player
    pulseEffect.y = player.y + player.size / 2;
    pulseEffect.radius = 0; // Parte da zero

    // RAGGIO DI AZIONE: 100 pixel
    const range = 100;

    // FILTER MAGIC:
    // Questa è una riga da vero Javascript Developer da mostrare in stream.
    // "Sovrascrivi la lista glitch tenendo solo quelli lontani dal player"
    // Usiamo il Teorema di Pitagora per la distanza
    glitches = glitches.filter(glitch => {
        const dx = glitch.x - player.x;
        const dy = glitch.y - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Se la distanza è maggiore del range, TIENILO.
        // Se è minore (è vicino), verrà eliminato (ritorna false).
        return distance > range;
    });

    // Effetto visivo (Flash dello schermo)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const distToGoalX = goal.x - player.x;
    const distToGoalY = goal.y - player.y;
    const distToGoal = Math.sqrt(distToGoalX * distToGoalX + distToGoalY * distToGoalY);

    if (distToGoal < 100) { // 100 è il range dell'impulso
        goal.isCorrupted = false;
        console.log("Goal Purified!");
    }
}

spawnGlitches(20);

function drawBackground() {
    let glitchPositionX = Math.random() * canvas.width;
    let glitchPositionY = Math.random() * canvas.height;
    for (let i = 0; i < 10; i++) {
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(glitchPositionX, glitchPositionY, 2, 2);
    }
}

function checkCollisions() {
    // Controlliamo ogni glitch nella lista
    glitches.forEach(glitch => {
        // Logica AABB (Axis-Aligned Bounding Box)
        // È vero se si sovrappongono
        if (
            player.x < glitch.x + glitch.size &&
            player.x + player.size > glitch.x &&
            player.y < glitch.y + glitch.size &&
            player.y + player.size > glitch.y
        ) {
            console.log("SYSTEM FAILURE. REBOOTING...");
            score = 0; // Azzera punteggio (o togli punti)
            player.x = canvas.width / 2;
            player.y = canvas.height / 2;
            glitches = []; // Pulisci lo schermo per dare tregua al giocatore
            ammountOfGlitches += 10;
            spawnGlitches(ammountOfGlitches); // Ricrea un set base

            // Opzionale: Cambia colore per un attimo per feedback visivo
            // (Lo faremo meglio domani, per ora il reset basta)
            goal.color = '#ff0000';
            setTimeout(() => {
                goal.color = '#00ffff';
            }, 100);
        }
    });
}

// --- GAME LOOP ---
function loop() {
    update(); // 1. Calculate logic
    draw();   // 2. Render graphics
    requestAnimationFrame(loop); // 3. Repeat ASAP - render every frame based on the monitor refresh rate
}

// Start the engine
loop();