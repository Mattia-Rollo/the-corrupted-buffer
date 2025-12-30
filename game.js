// --- CONFIGURATION ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;

canvas.width = GAME_WIDTH;
canvas.height = GAME_HEIGHT;


canvas.style.width = '100%';
canvas.style.height = '100%';
canvas.style.imageRendering = 'pixelated';
canvas.style.objectFit = 'contain';

// --- GAME STATE ---
// Possibili valori: 'START', 'PLAYING', 'GAMEOVER'
let gameState = 'START';
let speed = 2; // speed of goal and glitches
let shakeAmount = 0;

// --- PLAYER ---   
const player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    size: 10, // A bit bigger than 1 pixel to be visible
    speed: 2,
    color: '#00ff00', // Hacker Green
    isDashing: false,
    dashCooldown: 0
};
let dashTrails = [];

// --- GLITCHES ---
let particles = [];
let glitches = [];
let ammountOfGlitches = 10;

// --- INPUT ---
// Input State (Keys pressed)
const keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    KeyW: false,
    KeyA: false,
    KeyS: false,
    KeyD: false,
    Space: false,
    ShiftLeft: false,
};

// --- PULSE EFFECT ---
let lastDebugTime = 0; // Per gestire il cooldown
let debugCooldown = 800; // Tempo di cooldown in ms

let pulseEffect = {
    active: false,
    x: 0,
    y: 0,
    radius: 0
};

// --- SCORE & GOAL ---
let score = 0; // Il punteggio parte da zero
let highScore = parseInt(localStorage.getItem('corruptedHighScore')) || 0;


const goal = {
    x: Math.random() * (canvas.width - 10),
    y: Math.random() * (canvas.height - 10),
    vx: (Math.random() - 0.5) * speed, // <--- Velocità X
    vy: (Math.random() - 0.5) * speed, // <--- Velocità Y
    size: 12, // Un po' più grande del player
    color: '#00ffff', // Ciano (Cyberpunk style)
    borderColor: '#90bbcaff',
    borderWidth: 1,
    isCorrupted: true
};

// --- INPUT HANDLERS ---
// Listen for keydown (press)
window.addEventListener('keydown', (e) => {
    // Gestione tasti di movimento (solo se stiamo giocando)
    if (gameState === 'PLAYING') {
        if (keys.hasOwnProperty(e.code)) {
            keys[e.code] = true;
        }
    }

    // GESTIONE STATI (Nuova parte)
    if (e.code === 'Enter') {
        // console.log("gameState: ", gameState);
        if (gameState === 'START') {
            // Dal menu -> Inizia gioco
            gameState = 'PLAYING';
            playSound('collect'); // Suono di conferma
            initGame();
        }
        else if (gameState === 'GAMEOVER') {
            // Dal Game Over -> Ricomincia
            resetGame();
            playSound('collect');
            initGame();
        }
    }
});

// Listen for keyup (release)
window.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.code) || e.code === 'Space') {
        keys[e.code] = false;
    }
});

canvas.addEventListener('touchstart', handleTouch, { passive: false });
canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    // Resetta tutto quando alzi il dito
    keys.ArrowUp = false;
    keys.ArrowDown = false;
    keys.ArrowLeft = false;
    keys.ArrowRight = false;
    keys.Space = false;
}, { passive: false });

function handleTouch(e) {
    e.preventDefault(); // Evita lo scroll della pagina
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();

    // Calcoliamo dove hai toccato rispetto alla grandezza visiva del canvas
    const touchX = touch.clientX - rect.left;
    const touchY = touch.clientY - rect.top;

    // Normalizziamo le coordinate (0-1)
    const relX = touchX / rect.width;
    const relY = touchY / rect.height;

    // Resetta tasti
    keys.ArrowUp = false;
    keys.ArrowDown = false;
    keys.ArrowLeft = false;
    keys.ArrowRight = false;
    keys.Space = false;

    // Logica "D-Pad Invisibile"
    // Immagina una X sullo schermo.

    if (relX < 0.33) { // Terzo Sinistro
        keys.ArrowLeft = true;
    } else if (relX > 0.66) { // Terzo Destro
        keys.ArrowRight = true;
    }

    if (relY < 0.33) { // Terzo Alto
        keys.ArrowUp = true;
    } else if (relY > 0.66) { // Terzo Basso
        keys.ArrowDown = true;
    }

    // Tocco al centro = SPAZIO (Debug Pulse)
    if (relX >= 0.33 && relX <= 0.66 && relY >= 0.33 && relY <= 0.66) {
        keys.Space = true;
        // Nota: Space deve resettarsi subito nel loop, come hai già fatto
    }
}

// --- AUDIO SYSTEM (The Synthesizer) ---
// Creiamo il contesto audio (il nostro "mixer" virtuale)
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
    if (!audioCtx) return; // Sicurezza

    // 1. Creiamo un oscillatore (il generatore di onde)
    const osc = audioCtx.createOscillator();
    // 2. Creiamo un controllo volume (Gain)
    const gainNode = audioCtx.createGain();

    // Colleghiamo: Oscillatore -> Volume -> Casse
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    const now = audioCtx.currentTime;

    // Configurazione suoni in base al tipo
    if (type === 'shoot') {
        // Suono acuto e breve (Laser)
        osc.type = 'square'; // Suono "retro" a 8-bit
        osc.frequency.setValueAtTime(550, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.1); // Pitch down
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
    }
    else if (type === 'hit') {
        // Suono basso e "sporco" (Esplosione/Errore)
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(0.10, now + 0.1);
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
    }
    else if (type === 'collect') {
        // Suono squillante e felice (Moneta/Powerup)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.linearRampToValueAtTime(1200, now + 0.1); // Pitch up
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.linearRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
    } else if (type == 'dash') {
        // Dash sound - Pitch up
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.1); // Pitch up
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);

    }
}

// --- CORE FUNCTIONS ---

function getSafePosition(minDistance) {
    let x, y, distance;
    let safe = false;
    let attempts = 0;

    // Continua a provare finché non trovi un posto sicuro
    while (!safe && attempts < 100) { // Limitiamo a 100 tentativi per evitare crash se lo schermo è pieno
        x = Math.random() * (canvas.width - 20); // -20 per non uscire dai bordi
        y = Math.random() * (canvas.height - 20);

        // Calcola la distanza dal giocatore (Pitagora)
        const dx = x - player.x;
        const dy = y - player.y;
        distance = Math.sqrt(dx * dx + dy * dy);

        // Se siamo abbastanza lontani, APPROVATO!
        if (distance > minDistance) {
            safe = true;
        }
        attempts++;
    }

    // Se dopo 100 tentativi non trova posto (improbabile), te lo dà comunque
    return { x: x, y: y };
}

function update() {

    // console.log("gameState: ", gameState);
    // console.log("glitches: ", glitches.length);
    if (gameState !== 'PLAYING') return;
    // Move Player based on Input
    if (keys.ArrowUp) player.y -= player.speed;
    if (keys.ArrowDown) player.y += player.speed;
    if (keys.ArrowLeft) player.x -= player.speed;
    if (keys.ArrowRight) player.x += player.speed;
    if (keys.KeyW) player.y -= player.speed;
    if (keys.KeyA) player.x -= player.speed;
    if (keys.KeyS) player.y += player.speed;
    if (keys.KeyD) player.x += player.speed;

    // --- DASH LOGIC ---
    // 1. Cooldown Management
    if (player.dashCooldown > 0) player.dashCooldown--;

    // 2. Attivazione Dash (Input)
    if (keys.ShiftLeft && !player.isDashing && player.dashCooldown <= 0) {
        console.log("DASH!");
        player.isDashing = true;
        player.dashTimer = 20; // Il dash dura 20 frame (circa 0.16 secondi)
        player.dashCooldown = 60; // 1 secondo di ricarica
        player.speed = 10; // VELOCITÀ ESPLOSIVA
        shakeAmount = 5; // Piccolo tremolio per dare impatto
        playSound('dash'); // Usiamo il suono dello sparo come feedback
    }

    // 3. Gestione dello Stato Dash (Mentre scatto)
    if (player.isDashing) {
        // Aggiungi un "fantasma" alla posizione attuale
        dashTrails.push({
            x: player.x,
            y: player.y,
            alpha: 0.8 // Opacità iniziale
        });

        // Conto alla rovescia durata
        player.dashTimer--;
        if (player.dashTimer <= 0) {
            player.isDashing = false;
            player.speed = 2; // Return to normal speed
        }
    }

    // 4. Gestione delle Scie (Update visuale)
    // Riduciamo l'alpha di ogni fantasma finché non sparisce
    for (let i = dashTrails.length - 1; i >= 0; i--) {
        dashTrails[i].alpha -= 0.1; // Svanisce velocemente
        if (dashTrails[i].alpha <= 0) {
            dashTrails.splice(i, 1); // Rimuovi fantasma morto
        }
    }

    // Boundary Checks (Keep player inside screen)
    // Simple logic: if < 0, set to 0. If > width, set to width.
    if (player.x < 0) player.x = 0;
    if (player.x > canvas.width - player.size) player.x = canvas.width - player.size;
    if (player.y < 0) player.y = 0;
    if (player.y > canvas.height - player.size) player.y = canvas.height - player.size;

    // Update particles (esplosioni)
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.02; // Muore lentamente (sbiadisce o rimpicciolisce)

        // Se la vita è finita, rimuovilo dall'array
        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }

    // Update glitches (nemici)
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
            gameOver();
            // score = 0;
            // player.x = canvas.width / 2;
            // player.y = canvas.height / 2;
            // glitches = [];
            // playSound('hit');
            // gameState = 'GAMEOVER';
            // spawnGlitches(50);
            // // Resettiamo il goal altrove
            // goal.x = Math.random() * (canvas.width - 10);
            // goal.y = Math.random() * (canvas.height - 10);
        } else {
            // HAI TOCCATO IL GOAL PURO -> VITTORIA!
            playSound('collect');
            shakeAmount = 10;
            score += 64;
            debugCooldown -= 10;
            if (score % 64 === 0) {
                spawnGlitches(50);
                playSound('hit');
            } else if (score % 128 === 0) {
                spawnGlitches(100);
                playSound('hit');
            } else if (score % 256 === 0) {
                spawnGlitches(200);
                playSound('hit');
            } else if (score % 512 === 0) {
                spawnGlitches(400);
                playSound('hit');
            } else if (score % 1024 === 0) {
                spawnGlitches(1100);
                playSound('hit');
            }
            console.log("Data recovered! Score:", score);

            // Sposta il goal
            // let goalNextPosition = {
            //     x: Math.random() * (canvas.width - 10),
            //     y: Math.random() * (canvas.height - 10)
            // };
            // ... (tieni il tuo codice che controlla che non nasca nei glitch) ...
            const safePos = getSafePosition(100);
            goal.x = safePos.x;
            goal.y = safePos.y;

            goal.vx = (Math.random() - 0.5) * speed;
            goal.vy = (Math.random() - 0.5) * speed;

            goal.isCorrupted = true;
            spawnGlitches(5);
        }
    }

    if (keys.Space) {
        triggerDebugPower();
        keys.Space = false; // Resetta subito per non spararne 100 al secondo
    }

    // console.log("GLITCHES: ", glitches.length);
    if (glitches.length > 10000) gameOver();
}

function gameOver() {
    console.log("SYSTEM FAILURE.");
    playSound('hit');
    shakeAmount = 20;
    gameState = 'GAMEOVER';

    // CONTROLLO RECORD
    if (score > highScore) {
        highScore = score;
        // Salviamo nel browser
        localStorage.setItem('corruptedHighScore', highScore);
        console.log("NEW RECORD SAVED!");
    }
}

function resetGame() {
    score = 0;
    player.x = canvas.width / 2;
    player.y = canvas.height / 2;
    glitches = [];
    ammountOfGlitches = 50;
    spawnGlitches(ammountOfGlitches);
    goal.x = Math.random() * (canvas.width - 10);
    goal.y = Math.random() * (canvas.height - 10);
    goal.isCorrupted = true;
    gameState = 'START';
}

function draw() {
    // 1. PULIZIA SCHERMO (Lasciamo la scia)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // --- SCREEN SHAKE MAGIC ---
    ctx.save();
    if (shakeAmount > 0) {
        const dx = (Math.random() - 0.5) * shakeAmount;
        const dy = (Math.random() - 0.5) * shakeAmount;
        ctx.translate(dx, dy);
        shakeAmount *= 0.9;
        if (shakeAmount < 0.5) shakeAmount = 0;
    }

    // --- DRAW DASH TRAILS (Ghosts) ---
    dashTrails.forEach(trail => {
        ctx.globalAlpha = trail.alpha; // Usa l'opacità del fantasma
        ctx.fillStyle = player.color;  // Colore verde hacker
        ctx.fillRect(trail.x, trail.y, player.size, player.size);
    });
    ctx.globalAlpha = 1.0; // Reset opacità!

    // --- DRAW PLAYER ---
    // Se sta scattando, disegnalo BIANCO (Invulnerabile), altrimenti VERDE
    let currentPlayerColor = player.isDashing ? '#ffffff' : player.color;
    drawGlitchRect(player.x, player.y, player.size, player.size, currentPlayerColor);

    // --- DRAW PARTICLES ---
    particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);
    });
    ctx.globalAlpha = 1.0;

    // --- DRAW GLITCHES WITH RGB SPLIT ---
    glitches.forEach(glitch => {
        const shakeX = (Math.random() - 0.5) * speed;
        const shakeY = (Math.random() - 0.5) * speed;
        // Usiamo la nuova funzione anche qui!
        // Nota: prendiamo il primo colore dell'array o quello corrente
        let color = glitch.colors[Math.floor(Math.random() * glitch.colors.length)];
        drawGlitchRect(glitch.x + shakeX, glitch.y + shakeY, glitch.size, glitch.size, color);
    });
    // 2. STATES LOGIC
    if (gameState === 'START') {
        drawStartScreen();
    }
    else if (gameState === 'PLAYING') {
        // --- DRAW PLAYER CON RGB SPLIT ---
        // Usiamo la nuova funzione invece di ctx.fillRect

        // --- DRAW GOAL ---
        if (goal.isCorrupted) {
            const shakeX = (Math.random() - 0.5) * speed;
            const shakeY = (Math.random() - 0.5) * speed;
            // Il goal corrotto è instabile, quindi RGB split pesante!
            drawGlitchRect(goal.x + shakeX, goal.y + shakeY, goal.size, goal.size, '#ff00ff');
        } else {
            // Il goal puro è stabile, lo disegniamo normale (senza RGB split)
            ctx.fillStyle = goal.color;
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.strokeRect(goal.x, goal.y, goal.size, goal.size);
            ctx.fillRect(goal.x, goal.y, goal.size, goal.size);
        }

        // Pulse Effect
        if (pulseEffect.active) {
            ctx.beginPath();
            ctx.arc(pulseEffect.x, pulseEffect.y, pulseEffect.radius, 0, Math.PI * 2);
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3;
            ctx.stroke();
            pulseEffect.radius += 5;
            if (pulseEffect.radius > 100) pulseEffect.active = false;
        }
    }
    else if (gameState === 'GAMEOVER') {
        drawGameOverScreen();
    }

    ctx.restore(); // Fine tremolio oggetti

    // --- HUD (Sempre sopra tutto) ---
    ctx.fillStyle = '#fff';
    ctx.font = '16px "Courier New", monospace';
    ctx.fillText('RAM: ' + score + 'kb', 5, 15);
    ctx.fillStyle = '#aaa';
    ctx.fillText('BEST: ' + highScore + 'kb', 5, 30);

    // --- CRT SCANLINES VISIBILI ---
    // TRUCCO: Usiamo BIANCO molto trasparente invece di nero
    // Questo crea una "texture" visibile anche sul nero
    ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
    for (let i = 0; i < canvas.height; i += 2) {
        ctx.fillRect(0, i, canvas.width, 1);
    }

    // --- VIGNETTE (Angoli scuri) ---
    const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, canvas.height / 3,
        canvas.width / 2, canvas.height / 2, canvas.height
    );
    gradient.addColorStop(0, "rgba(0,0,0,0)");
    gradient.addColorStop(1, "rgba(0,0,0,0.6)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawGlitchRect(x, y, w, h, color) {
    // 1. Canale Rosso (Spostato a sinistra)
    ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
    // Più il giocatore è veloce o più shake c'è, più i colori si separano
    let offset = 2 + shakeAmount;
    ctx.fillRect(x - offset, y, w, h);

    // 2. Canale Blu (Spostato a destra)
    ctx.fillStyle = 'rgba(0, 0, 255, 0.5)';
    ctx.fillRect(x + offset, y, w, h);

    // 3. Canale Principale (Il colore vero, al centro)
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
}

function spawnGlitches(amount) {
    for (let i = 0; i < amount; i++) {
        // Chiediamo una posizione sicura ad almeno 150 pixel dal giocatore
        const pos = getSafePosition(150);

        const glitch = {
            x: pos.x,
            y: pos.y,
            vx: (Math.random() - 0.5) * speed,
            vy: (Math.random() - 0.5) * speed,
            size: 12,
            colors: ['#ff0000', '#00ff00', '#0000ff']
        };
        glitches.push(glitch);
    }
}

function createExplosion(x, y, color) {
    const particleCount = 15; // Quanti pezzetti creare
    for (let i = 0; i < particleCount; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 5, // Velocità esplosiva X
            vy: (Math.random() - 0.5) * 5, // Velocità esplosiva Y
            size: Math.random() * 3 + 1,   // Dimensione casuale
            color: color,
            life: 1.0 // Vita del pixel (1.0 = 100%)
        });
    }
}

function triggerDebugPower() {
    const now = Date.now();
    if (now - lastDebugTime < debugCooldown) return;

    lastDebugTime = now;
    console.log("DEBUG PULSE ACTIVATED!");

    playSound('shoot');
    shakeAmount = 30;

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
    // FILTER MAGIC & EXPLOSIONS:
    glitches = glitches.filter(glitch => {
        const dx = glitch.x - player.x;
        const dy = glitch.y - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance <= range) {
            // Se è nel raggio, ESPLODE prima di essere rimosso!
            createExplosion(glitch.x, glitch.y, glitch.colors[0]); // Usa il colore del glitch
            return false; // Rimuovi dal gioco
        }
        return true; // Tieni nel gioco
    });

    // Effetto visivo (Flash dello schermo)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const distToGoalX = goal.x - player.x;
    const distToGoalY = goal.y - player.y;
    const distToGoal = Math.sqrt(distToGoalX * distToGoalX + distToGoalY * distToGoalY);

    if (distToGoal < 100 && goal.isCorrupted) { // Aggiungi check isCorrupted per non farlo esplodere sempre
        createExplosion(goal.x, goal.y, '#ffffff'); // Esplosione bianca di purificazione
        goal.isCorrupted = false;
        console.log("Goal Purified!");
        playSound('collect'); // Magari un suono extra qui?
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
            player.y + player.size > glitch.y &&
            player.speed == 2
        ) {
            if (player.isDashing) {
                return; // Ignora la collisione
            }
            gameOver();
            // // score = 0; // Azzera punteggio (o togli punti)
            // player.x = canvas.width / 2;
            // player.y = canvas.height / 2;
            // glitches = []; // Pulisci lo schermo per dare tregua al giocatore
            // ammountOfGlitches += 10;
            // spawnGlitches(ammountOfGlitches); // Ricrea un set base

            // // Opzionale: Cambia colore per un attimo per feedback visivo
            goal.color = '#ff0000';
            setTimeout(() => {
                goal.color = '#00ffff';
            }, 100);
        }
    });
}

function drawStartScreen() {
    // Sfondo semi-trasparente per vedere i glitch dietro (figata!)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Titolo
    ctx.fillStyle = '#00ff00'; // Hacker Green
    ctx.font = '30px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('THE CORRUPTED BUFFER', canvas.width / 2, canvas.height / 2 - 40);

    // Istruzioni
    ctx.fillStyle = '#fff';
    ctx.font = '16px "Courier New", monospace';
    ctx.fillText('PRESS [ENTER] TO INITIALIZE', canvas.width / 2, canvas.height / 2 + 20);

    ctx.fillStyle = '#aaa';
    ctx.font = '12px "Courier New", monospace';
    ctx.fillText('Use ARROWS to move / SPACE to debug', canvas.width / 2, canvas.height / 2 + 50);
}

function drawGameOverScreen() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ff0000';
    ctx.font = '30px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('SYSTEM FAILURE', canvas.width / 2, canvas.height / 2 - 40);

    ctx.fillStyle = '#fff';
    ctx.font = '20px "Courier New", monospace';
    ctx.fillText('RECOVERED: ' + score + 'kb', canvas.width / 2, canvas.height / 2);

    // Mostra il record
    ctx.fillStyle = '#ffff00'; // Giallo
    ctx.font = '16px "Courier New", monospace';
    ctx.fillText('BEST RECORD: ' + highScore + 'kb', canvas.width / 2, canvas.height / 2 + 30);

    // Messaggio speciale se hai battuto il record
    if (score >= highScore && score > 0) {
        ctx.fillStyle = '#00ff00';
        ctx.fillText('!!! NEW HIGH SCORE !!!', canvas.width / 2, canvas.height / 2 + 90);
    }

    ctx.fillStyle = '#aaa';
    ctx.font = '16px "Courier New", monospace';
    ctx.fillText('PRESS [ENTER] TO REBOOT', canvas.width / 2, canvas.height / 2 + 60);
}

function initGame() {
    score = 0;
    player.x = canvas.width / 2;
    player.y = canvas.height / 2;
    glitches = []; // Via i vecchi nemici
    spawnGlitches(10); // Ne creiamo di nuovi

    // Resetta anche il goal
    goal.x = Math.random() * (canvas.width - 10);
    goal.y = Math.random() * (canvas.height - 10);
    goal.isCorrupted = true;

    // IMPORTANTE: Resetta l'allineamento testo per il gioco normale
    ctx.textAlign = 'start';
}

// --- GAME LOOP ---
function loop() {
    update(); // 1. Calculate logic
    draw();   // 2. Render graphics
    requestAnimationFrame(loop); // 3. Repeat ASAP - render every frame based on the monitor refresh rate
}

// Start the engine
loop();