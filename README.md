# The Corrupted Buffer

-- english --
A game about debugging a corrupted buffer.
This is my first game, created in a week. Using vanilla JS and HTML5 Canvas, no frameworks, no engines.

The Goal is to debug the system before it goes into Kernel Panic.

Un esperimento di Game Dev in Vanilla JS (No Frameworks, No Engines).
Obiettivo: Creare un motore grafico "pixel-based" da zero e un piccolo gioco giocabile entro il 5 Gennaio 2026.

## 🎮 Il Concept
You are unit `0x1` in a dying memory. The world is infested with "Glitch" (visual noise). Your task is to debug the area before the system goes into Kernel Panic.


Sei l'unità di manutenzione `0x1` in una memoria RAM che sta morendo.
Il mondo è infestato da "Glitch" (rumore visivo). Il tuo compito è debuggare l'area prima che il sistema vada in Kernel Panic.

**Style:** Abstract pixel art, procedurally generated using Canvas pixel manipulation. No external images.

**Stile:** Grafica astratta, generata proceduralmente manipolando i pixel del Canvas. Nessuna immagine esterna.

## 🕹️ Controls
- **Arrow Keys / WASD:** Move unit 0x1.
- **Space Bar:** Emit DEBUG impulse (clear nearby glitches).
- **LeftShift:** Dash to avoid enemies.

## 📅 Roadmap (Settimana del Focus)

- [x] **Giorno 0:** Setup progetto e Canvas.
- [x] **Giorno 1:** Movimento Player e scia "ghosting".
- [x] **Giorno 2:** Generazione procedurale dei Glitch (nemici).
- [x] **Giorno 3:** Meccanica di Debug (interazione con i pixel).
- [ ] **Giorno 4:** Creazione Mappa/Livello (tramite array JS).
- [ ] **Giorno 5:** Condizione di Vittoria e Polish finale.

## 🛠️ Tech Stack
- **HTML5 Canvas** (Manipolazione diretta `ImageData`).
- **Vanilla JavaScript** (ES6+).
- **Nessuna libreria esterna.**


## 📊 Progression:

**DAY - 1**
- [x] Setup progetto e Canvas.
- [x] Movimento Player e scia "ghosting".
- [x] Generazione procedurale dei Glitch (nemici).
- [x] Meccanica di Debug (interazione con i pixel).

**DAY - 2**
- [x] Particle System (Esplosioni): Quando usi l'impulso o purifichi il goal, non devono sparire e basta. Devono esplodere in mille pezzi.
- [x] High Score (Local Storage): Dobbiamo salvare il record migliore nel browser, così se chiudi e riapri rimane.
- [x] Difficulty Ramp: Il gioco deve diventare progressivamente più difficile (i glitch diventano più veloci o più numerosi man mano che fai punti).
- [x] Extra: Implement screen shake effects for goal collection, game over, and pulse activation, and ensure HUD remains static.
- [x] Extra: Add `getSafePosition` for safer object placement, increase glitch spawn amounts, and raise the game over limit.

**DAY - 3**
- [x] Deployment: Metteremo il gioco su GitHub Pages o Netlify.
- [x] Dash Ability: Uno scatto veloce per schivare i nemici all'ultimo secondo.
- [x] Capped at 60 FPS: Limitiamo il gioco a 60 FPS per evitare problemi di performance.

**DAY - 4**
- [ ] Creazione Mappa/Livello (tramite array JS).
- [ ] Condizione di Vittoria e Polish finale.
- [ ] Aggiungere la vita al player.
- [ ] Mobile Support: Fix mobile controls.

