// --- CONFIGURATION ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set resolution (Low res for retro feel)
// canvas.width = 320;
// canvas.height = 240;
canvas.width = 640;
canvas.height = 480;

// --- GAME STATE ---
// Possibili valori: 'START', 'PLAYING', 'GAMEOVER'
let gameState = 'START';

// --- PLAYER ---   
const player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    size: 4, // A bit bigger than 1 pixel to be visible
    speed: 2,
    color: '#00ff00' // Hacker Green
};

// --- GLITCHES ---
let glitches = [];
let ammountOfGlitches = 10;

// --- INPUT ---
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
    // Gestione tasti di movimento (solo se stiamo giocando)
    if (gameState === 'PLAYING') {
        if (keys.hasOwnProperty(e.code) || e.code === 'Space') {
            keys[e.code] = true;
        }
    }

    // GESTIONE STATI (Nuova parte)
    if (e.code === 'Enter') {
        console.log("gameState: ", gameState);
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
    }
}

// --- CORE FUNCTIONS ---

function update() {

    // console.log("gameState: ", gameState);
    // console.log("glitches: ", glitches.length);
    if (gameState !== 'PLAYING') return;
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
            playSound('hit');
            gameState = 'GAMEOVER';
            spawnGlitches(50);
            // Resettiamo il goal altrove
            goal.x = Math.random() * (canvas.width - 10);
            goal.y = Math.random() * (canvas.height - 10);
        } else {
            // HAI TOCCATO IL GOAL PURO -> VITTORIA!
            playSound('collect');
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
        triggerDebugPower();
        keys.Space = false; // Resetta subito per non spararne 100 al secondo
    }

    // console.log("GLITCHES: ", glitches.length);
    if (glitches.length > 50) gameOver();
}

function gameOver() {
    console.log("GAMEOVER");
    gameState = 'GAMEOVER';
}

function resetGame() {
    score = 0;
    player.x = canvas.width / 2;
    player.y = canvas.height / 2;
    glitches = [];
    ammountOfGlitches = 10;
    spawnGlitches(ammountOfGlitches);
    goal.x = Math.random() * (canvas.width - 10);
    goal.y = Math.random() * (canvas.height - 10);
    goal.isCorrupted = true;
    gameState = 'START';
}

function draw() {
    // 1. THE GHOSTING EFFECT (Magic Trick)
    // Instead of clearing the screen completely (clearRect),
    // we draw a semi-transparent black rectangle.
    // This creates the "trail" effect because old frames fade out slowly.
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Draw Player
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, 12, 12);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.0)';

    // 3. Draw Glitches
    glitches.forEach(glitch => {
        // Effetto tremolio: disegniamo il glitch leggermente spostato a caso
        // per farlo sembrare instabile, ma la sua "vera" posizione resta fissa
        const shakeX = (Math.random() - 0.5) * 4;
        const shakeY = (Math.random() - 0.5) * 4;

        ctx.fillStyle = glitch.colors[Math.floor(Math.random() * glitch.colors.length)];
        ctx.fillRect(glitch.x + shakeX, glitch.y + shakeY, glitch.size, glitch.size);
    });

    // 2. LOGICA STATI
    if (gameState === 'START') {
        drawStartScreen();
    }
    else if (gameState === 'PLAYING') {
        // Disegna Player, Goal, HUD, Pulse
        // 3. Draw Glitches
        // drawBackground();

        // 4. Draw Goal
        if (goal.isCorrupted) {
            // DISEGNO CORROTTO (Come un glitch nemico)
            const shakeX = (Math.random() - 0.5) * 4;
            const shakeY = (Math.random() - 0.5) * 4;
            // Usiamo colori da glitch per camuffarlo
            const glitchColors = ['#ff0000', '#00ff00', '#0000ff'];
            ctx.fillStyle = glitchColors[Math.floor(Math.random() * glitchColors.length)];
            ctx.fillRect(goal.x + shakeX, goal.y + shakeY, goal.size, goal.size);
            // Add rotation to the goal
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
            pulseEffect.radius += 2; // Velocità espansione

            // Se diventa troppo grande, spegnilo
            if (pulseEffect.radius > 100) { // 100 deve essere uguale al range del filtro
                pulseEffect.active = false;
            }
        }
    }
    else if (gameState === 'GAMEOVER') {
        drawGameOverScreen();
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

function triggerDebugPower() {
    const now = Date.now();
    if (now - lastDebugTime < 300) return;

    lastDebugTime = now;
    console.log("DEBUG PULSE ACTIVATED!");

    playSound('shoot');

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
            playSound('hit');
            console.log("SYSTEM FAILURE.");
            gameState = 'GAMEOVER';
            // score = 0; // Azzera punteggio (o togli punti)
            player.x = canvas.width / 2;
            player.y = canvas.height / 2;
            glitches = []; // Pulisci lo schermo per dare tregua al giocatore
            ammountOfGlitches += 10;
            spawnGlitches(ammountOfGlitches); // Ricrea un set base

            // Opzionale: Cambia colore per un attimo per feedback visivo
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
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'; // Più scuro
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ff0000'; // Rosso errore
    ctx.font = '30px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('SYSTEM FAILURE', canvas.width / 2, canvas.height / 2 - 40);

    ctx.fillStyle = '#fff';
    ctx.font = '20px "Courier New", monospace';
    ctx.fillText('DATA RECOVERED: ' + score + 'kb', canvas.width / 2, canvas.height / 2);

    ctx.fillStyle = '#aaa'; // Lampeggiante? (Opzionale)
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