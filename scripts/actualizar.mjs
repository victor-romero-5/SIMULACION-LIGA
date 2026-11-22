// Descarga los partidos de la Primera Fase (Grup A y Grup B) de la Lliga Catalana Or Sènior Masculina
// desde la API de resultados de iSQUAD y los guarda en data/partidos.json.
// Uso: node scripts/actualizar.mjs
import { writeFile, readFile } from 'node:fs/promises';

const API = 'https://resultadosbalonmano.isquad.es/maqueta/json/beta.php';
const GRUPOS = [
  { nombre: 'Grup A', id: 1038540 },
  { nombre: 'Grup B', id: 1038541 },
];
const SALIDA = new URL('../data/partidos.json', import.meta.url);

async function torneo(id) {
  const r = await fetch(API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0 (simulacion-liga; GitHub Actions)',
      Referer: 'https://resultadosbalonmano.isquad.es/maqueta/',
    },
    body: new URLSearchParams({ tipo: 'torneo', id: String(id) }),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status} al pedir el torneo ${id}`);
  const j = await r.json();
  if (!Array.isArray(j.partidos) || !j.partidos.length) throw new Error(`Respuesta sin partidos para el torneo ${id}`);
  return j;
}

const limpia = s => String(s).replace(/\s+/g, ' ').trim();
const equipos = {};
const grupos = [];
for (const g of GRUPOS) {
  const j = await torneo(g.id);
  const partidos = j.partidos.map(m => {
    equipos[m.l.id] = limpia(m.l.n);
    equipos[m.v.id] = limpia(m.v.n);
    const fin = m.estado === 'Finalizado' && m.gl != null && m.gv != null;
    return [m.id, m.j, m.fecha, m.l.id, m.v.id, fin ? +m.gl : null, fin ? +m.gv : null];
  }).sort((a, b) => a[1] - b[1] || a[0] - b[0]);
  grupos.push({ nombre: g.nombre, id: g.id, jornadas: j.jornadas, partidos });
}

// Solo se reescribe si cambia algo (así no hay commits vacíos)
let anterior = null;
try { anterior = JSON.parse(await readFile(SALIDA, 'utf8')); } catch { }
const sinFecha = d => JSON.stringify({ equipos: d.equipos, grupos: d.grupos });
const nuevo = { actualizado: new Date().toISOString(), equipos, grupos };
if (anterior && sinFecha(anterior) === sinFecha(nuevo)) {
  console.log('Sin cambios.');
} else {
  await writeFile(SALIDA, JSON.stringify(nuevo) + '\n');
  console.log('data/partidos.json actualizado.');
}
