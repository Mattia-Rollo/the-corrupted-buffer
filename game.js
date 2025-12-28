// 1. Selezioniamo il canvas dall'HTML
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 2. Impostiamo una dimensione fissa (piccola, stile retro)
// Il browser la scalerà, ma noi lavoriamo su pochi pixel per quel look "glitch"
canvas.width = 320;
canvas.height = 240;

// 3. Test di disegno: Riempiamo lo schermo di un colore grigio scuro (il "buffer")
ctx.fillStyle = '#222';
ctx.fillRect(0, 0, canvas.width, canvas.height);

// 4. Disegniamo un singolo pixel verde al centro (il tuo primo pixel!)
ctx.fillStyle = '#0f0';
ctx.fillRect(160, 120, 1, 1); // x, y, larghezza, altezza

console.log("Sistema Inizializzato. The Corrupted Buffer è online.");