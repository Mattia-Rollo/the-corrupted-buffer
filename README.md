# The Corrupted Buffer

Un esperimento di Game Dev in Vanilla JS (No Frameworks, No Engines).
Obiettivo: Creare un motore grafico "pixel-based" da zero e un piccolo gioco giocabile entro il 5 Gennaio 2026.

## 🎮 Il Concept
Sei l'unità di manutenzione `0x1` in una memoria RAM che sta morendo.
Il mondo è infestato da "Glitch" (rumore visivo). Il tuo compito è debuggare l'area prima che il sistema vada in Kernel Panic.

**Stile:** Grafica astratta, generata proceduralmente manipolando i pixel del Canvas. Nessuna immagine esterna.

## 🕹️ Comandi
- **Frecce Direzionali / WASD:** Muovi l'unità 0x1.
- **Barra Spaziatrice:** Emetti l'impulso di DEBUG (cancella i glitch vicini).

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

---
*Progetto personale sviluppato in diretta su Twitch.*


---
## Progressions:

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
- [ ] Creazione Mappa/Livello (tramite array JS).
- [ ] Condizione di Vittoria e Polish finale.
- [ ] Aggiungere la vita al player.
- [x] Deployment: Metteremo il gioco su GitHub Pages o Netlify.
- [ ] Obiettivo: Incollare il link in chat e dire "Provatelo voi adesso". La chat impazzirà.
- [ ] Mobile Support: Aggiungeremo i controlli touch (perché il 50% di chi cliccherà il link sarà da telefono).
- [x] Dash Ability: (Se avanza tempo) Uno scatto veloce per schivare i nemici all'ultimo secondo.
- [x] Capped at 60 FPS: (Se avanza tempo) Limitiamo il gioco a 60 FPS per evitare problemi di performance.