# Worlds LoL

Salón de la fama de los campeones de Worlds de League of Legends, con contador y marcadores en vivo. Bilingüe (ES/EN).

> Proyecto de fans, no afiliado a Riot Games.

## Cómo verlo en tu computadora

1. Descomprime el zip y abre una terminal **dentro de la carpeta** (en Windows: abre la carpeta, haz clic en la barra de dirección, escribe `cmd` y presiona Enter).
2. Instala las dependencias (solo la primera vez, tarda un minuto):
   ```
   npm install
   ```
3. Arranca el sitio:
   ```
   npm run dev
   ```
4. Abre http://localhost:3000 en el navegador. Cada vez que guardes un archivo, la página se actualiza sola. Para detenerlo: `Ctrl + C`.

## Cómo publicarlo

1. Sube el contenido de esta carpeta a tu repo de GitHub (**sin** `node_modules` ni `.next`; el `.gitignore` ya los excluye).
2. En vercel.com entra con GitHub → **Add New → Project** → elige tu repo → **Deploy**. No hay que cambiar ninguna opción: Vercel detecta Next.js solo.
3. En **Settings → Domains** puedes poner el nombre `worldslol.vercel.app`.
4. Desde ahí, cada vez que subas cambios a `main`, Vercel republica el sitio automáticamente.

## Qué hay en cada carpeta

| Ruta | Para qué sirve |
|---|---|
| `data/champions.json` | Todos los campeones 2011–2025. Cada año se agrega una fila nueva |
| `data/worlds.config.json` | Fechas de cada Worlds. **Es lo que controla el contador y los estados** |
| `dictionaries/es.json`, `en.json` | Todos los textos del sitio en cada idioma |
| `app/[lang]/page.tsx` | La página principal (arma las secciones) |
| `app/globals.css` | Estilos, basados en `DESIGN.md` |
| `app/api/live/route.ts` | API de marcadores en vivo (por ahora devuelve "pendiente") |
| `components/` | Piezas de la página: hero, contador, estadísticas, salón de la fama |
| `lib/phase.ts` | La lógica que decide si toca cuenta regresiva, en vivo o celebración |

## Los estados del sitio

El sitio cambia solo según la fecha, sin tocar código:

| Estado | Cuándo | Qué se ve |
|---|---|---|
| Cuenta regresiva | Antes de que empiece el Worlds | Contador hacia el primer partido |
| En vivo | Durante el torneo | Tarjeta verde, tiempo restante y sección de marcadores |
| Celebración | 7 días después de la final | Campeón del año |
| Por confirmar | Si la siguiente edición no tiene fecha | Aviso de "fecha por confirmar" |

## Tareas del año

**Cuando Riot anuncie las fechas del Worlds 2027:** edita `data/worlds.config.json` y cambia `start`, `end`, `finalCity` y `finalDate` del bloque de 2027. Las horas van en UTC (con la `Z` al final). Si falta la hora exacta, pon una aproximada; después se afina.

**Cuando termine Worlds 2026:** agrega una fila al final de `data/champions.json` con los datos de la final (sigue el formato de las filas anteriores).

## Pendiente (siguientes fases)

- Fase 3: conectar `app/api/live/route.ts` a la fuente de datos para marcador y minuto de juego.
- Fase 5: animaciones, quiz y tarjetas para compartir.
