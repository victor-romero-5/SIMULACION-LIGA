// Lógica de la Lliga Catalana Or Sènior Masculina: clasificaciones de la Primera Fase y
// clasificaciones provisionales de la Fase Títol y la Fase Permanència con los puntos arrastrados.

export const PUNTOS = { victoria: 2, empate: 1, derrota: 0 };

// Plazas de cada grupo: [cuántos pasan a Títol] y el resto va a Permanència
export const PLAZAS_TITOL = 4;

// Nombres cortos para que las tablas se lean bien (si falta uno se usa el de iSQUAD)
export const NOMBRES = {
  201245: 'Handbol Gavà (A)',
  201668: 'CH Bordils "B"',
  201681: 'CH Vilamajor',
  201717: 'Handbol Ègara A',
  201848: 'Keynet H. Coop. Sant Boi',
  201858: "BM Barberà 'A'",
  201893: 'Montaggio',
  201917: 'H. Sant Joan Despí B',
  215193: 'Mubak BM La Roca',
  215375: 'MGC Mutua H. Ribes A',
  215388: 'AB Investments Joventut Mataró',
  219063: 'La Salle Bonanova',
  222345: 'Q-Handbol Molins',
  222444: 'CH Sant Andreu A',
  225570: 'Handbol Banyoles A',
  225579: 'CH Palautordera - Salicru',
  225629: 'Handbol Sant Cugat B',
};
export const nombre = (datos, id) => NOMBRES[id] || (datos.equipos && datos.equipos[id]) || String(id);

// Partido: { id, j, fecha, l, v, gl, gv, jugado }
export function partidosDe(grupo) {
  return grupo.partidos.map(([id, j, fecha, l, v, gl, gv]) => ({
    id, j, fecha, l, v, gl, gv, jugado: gl != null && gv != null,
  }));
}

function filaVacia(id) {
  return { id, pj: 0, g: 0, e: 0, p: 0, gf: 0, gc: 0, dg: 0, pts: 0 };
}

// Suma los partidos jugados en los que los dos equipos están en `ids`
export function acumular(ids, partidos) {
  const set = new Set(ids), filas = new Map(ids.map(id => [id, filaVacia(id)]));
  for (const m of partidos) {
    if (!m.jugado || !set.has(m.l) || !set.has(m.v)) continue;
    const L = filas.get(m.l), V = filas.get(m.v);
    L.pj++; V.pj++;
    L.gf += m.gl; L.gc += m.gv; V.gf += m.gv; V.gc += m.gl;
    if (m.gl > m.gv) { L.g++; V.p++; L.pts += PUNTOS.victoria; V.pts += PUNTOS.derrota }
    else if (m.gl < m.gv) { V.g++; L.p++; V.pts += PUNTOS.victoria; L.pts += PUNTOS.derrota }
    else { L.e++; V.e++; L.pts += PUNTOS.empate; V.pts += PUNTOS.empate }
  }
  for (const f of filas.values()) f.dg = f.gf - f.gc;
  return filas;
}

// Ordena unas filas. Desempate a igualdad de puntos:
//  1) si ya se han jugado todos los partidos entre los empatados: puntos, diferencia y goles a favor
//     en esos partidos (enfrentamiento directo);
//  2) diferencia de goles general;  3) goles a favor;  4) nombre.
// (Es el orden que coincide con la clasificación oficial de iSQUAD: con el directo aún incompleto,
//  decide la diferencia de goles general.)
export function ordenar(filas, partidos, nombreDe = id => String(id)) {
  const lista = [...filas];
  const porPuntos = new Map();
  for (const f of lista) {
    if (!porPuntos.has(f.pts)) porPuntos.set(f.pts, []);
    porPuntos.get(f.pts).push(f);
  }
  const directo = new Map();
  for (const empatados of porPuntos.values()) {
    if (empatados.length < 2) continue;
    const ids = empatados.map(f => f.id), set = new Set(ids);
    const entre = partidos.filter(m => set.has(m.l) && set.has(m.v));
    // Hacen falta partidos entre ellos y que estén todos jugados
    if (!entre.length || entre.some(m => !m.jugado)) continue;
    // Cada pareja tiene que haberse enfrentado (si no, no es comparable)
    const parejas = new Set(entre.map(m => [m.l, m.v].sort().join('-')));
    if (parejas.size < (ids.length * (ids.length - 1)) / 2) continue;
    const h = acumular(ids, entre);
    for (const [id, f] of h) directo.set(id, f);
  }
  const cmp = (a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    const da = directo.get(a.id), db = directo.get(b.id);
    if (da && db) {
      if (db.pts !== da.pts) return db.pts - da.pts;
      if (db.dg !== da.dg) return db.dg - da.dg;
      if (db.gf !== da.gf) return db.gf - da.gf;
    }
    if (b.dg !== a.dg) return b.dg - a.dg;
    if (b.gf !== a.gf) return b.gf - a.gf;
    return nombreDe(a.id).localeCompare(nombreDe(b.id), 'es');
  };
  return lista.sort(cmp);
}

export function equiposDe(partidos) {
  const s = new Set();
  for (const m of partidos) { s.add(m.l); s.add(m.v) }
  return [...s];
}

// Todo lo que pinta la web a partir de data/partidos.json
export function calcular(datos) {
  const nom = id => nombre(datos, id);
  const grupos = datos.grupos.map(g => {
    const partidos = partidosDe(g);
    const ids = equiposDe(partidos);
    const tabla = ordenar(acumular(ids, partidos).values(), partidos, nom)
      .map((f, i) => ({ ...f, pos: i + 1 }));
    const letra = g.nombre.replace(/^.*\s/, ''); // "Grup A" → "A"
    const jugados = partidos.filter(m => m.jugado).length;
    return { nombre: g.nombre, letra, jornadas: g.jornadas, partidos, tabla, jugados, total: partidos.length };
  });

  const fase = (elegir) => {
    const filas = [], pendientes = [], arrastrados = [];
    for (const g of grupos) {
      const ids = g.tabla.filter(elegir).map(f => f.id);
      const posPrimera = new Map(g.tabla.map(f => [f.id, f.pos]));
      for (const f of acumular(ids, g.partidos).values())
        filas.push({ ...f, grupo: g.letra, posGrupo: posPrimera.get(f.id) });
      const set = new Set(ids);
      for (const m of g.partidos) {
        if (!set.has(m.l) || !set.has(m.v)) continue;
        (m.jugado ? arrastrados : pendientes).push({ ...m, grupo: g.letra });
      }
    }
    const todos = grupos.flatMap(g => g.partidos);
    const tabla = ordenar(filas, todos, nom).map((f, i) => ({ ...f, pos: i + 1 }));
    const fecha = m => String(m.fecha || '');
    pendientes.sort((a, b) => fecha(a).localeCompare(fecha(b)) || a.j - b.j);
    return { tabla, pendientes, arrastrados };
  };

  const titol = fase(f => f.pos <= PLAZAS_TITOL);
  const permanencia = fase(f => f.pos > PLAZAS_TITOL);
  return { grupos, titol, permanencia };
}
