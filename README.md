# SIMULACION-LIGA

Simulación provisional de la segunda fase de la **Lliga Catalana Or Sènior Masculina** (balonmano, FCH): cómo quedarían la **Fase Títol** y la **Fase Permanència** si la Primera Fase acabara hoy, con los puntos arrastrados y los partidos pendientes entre los equipos que pasarían.

- `index.html` + `liga.js`: la web (GitHub Pages).
- `data/partidos.json`: resultados de la Primera Fase (Grup A y Grup B).
- `scripts/actualizar.mjs`: descarga los resultados de la API de [resultados de iSQUAD](https://resultadosbalonmano.isquad.es/maqueta/#v=jornada&s=1&se=0&temp=2627&t=17&am=0&cat=3077&comp=211864).
- `.github/workflows/actualizar.yml`: lo ejecuta cada 3 horas (y a mano desde la pestaña *Actions → Actualizar resultados → Run workflow*).

## Reglas que aplica

- Victoria 2, empate 1, derrota 0.
- Pasan a Fase Títol los 4 primeros de cada grupo; el resto (5.º–9.º del A y 5.º–8.º del B) a Fase Permanència.
- Se arrastran solo los resultados contra los equipos del mismo grupo que pasan a la misma fase.
- Fase Títol: 1.º en oro, 2.º en plata. Fase Permanència: 3 últimos en rojo, los 2 anteriores en naranja.
- Desempate: enfrentamiento directo si ya se han jugado todos los partidos entre los empatados; si no, diferencia de goles general y goles a favor.
