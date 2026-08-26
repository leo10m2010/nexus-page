# Nexus Series - web

Rediseño de [nexusseries.org](https://nexusseries.org). Astro estático, sin
framework de UI, sin librería de animación.

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # -> dist/
npm run preview
```

## Qué se conservó del sitio anterior

- **Todo el copy**, literal y en inglés (hero, about, vision, los tres pilares,
  partners y contacto).
- **La arquitectura de información y los anclajes**: `#home`, `#about`,
  `#vision`, `#contact`. No se renombró ninguna ruta ni etiqueta de navegación,
  para no romper SEO ni enlaces existentes.
- **Los enlaces reales**: `partners@nexusseries.org`, el Discord, X y los tres
  canales de Twitch (ES / EN / RU).
- `<title>`, `meta description` y datos estructurados `Organization`.

## Qué se retiró

Los cinco PNG del sitio anterior (`nexus-hero-global.png`,
`nexus-about-us-connection.png`, `nexus-brand-closing-background.png`,
`nexus-logo-web.png`, `nexus-series-wordmark-horizontal.png`). El sistema visual
se reconstruyó a partir de los SVG de marca.

## Arquitectura

Separada por capas. La regla es que un componente nunca contiene datos ni copy:
los lee. Así añadir una página, un idioma o una sección no obliga a tocar el
marcado existente.

```
src/
  config/      site.ts, nav.ts        fuente única de marca, URLs, CTAs, anclas
  content/     home.ts                todo el copy visible, tipado
  types/       index.ts               contratos compartidos
  lib/         images.ts, theme.ts, reveal.ts
  components/
    ui/        primitivos reutilizables, agnósticos de contenido
    layout/    Nav, Footer, Seo, ThemeToggle
    sections/  una por bloque de la página
  layouts/     Base.astro
  styles/      tokens, base, typography, on-media, surfaces, buttons, motion
  pages/       index.astro
```

Alias de importación configurados en `tsconfig.json`: `@config/*`, `@content/*`,
`@lib/*`, `@ui/*`, `@layout/*`, `@sections/*`, `@layouts/*`, `@assets/*`,
`@styles/*` y `@types`. No hay rutas relativas encadenadas.

### Dónde se toca cada cosa

| Quiero | Voy a |
| --- | --- |
| Cambiar un enlace, correo o handle | `config/site.ts`, y solo ahí |
| Cambiar un texto | `content/home.ts` |
| Añadir un canal de Twitch | el array `channels` en `config/site.ts` |
| Añadir un ítem al menú | `config/nav.ts` |
| Cambiar o añadir una foto | `lib/images.ts` |
| Añadir una sección | un archivo en `components/sections/`, y montarlo en `pages/index.astro` |
| Tocar color, tipografía o espaciado | el archivo correspondiente en `styles/` |

Antes del refactor el enlace de Discord estaba repetido en cuatro archivos y el
de Twitch en tres. Ahora cada URL aparece una sola vez.

### Invariantes que la estructura protege

- **Un rótulo por intención.** Los CTA salen del registro `ctas` en
  `config/site.ts`, no se escriben a mano. Por eso la misma acción no puede
  aparecer como "Become a partner" en un sitio y "Get in touch" en otro.
- **Las anclas no se renombran.** `#home`, `#about`, `#vision` y `#contact`
  vienen del sitio anterior; renombrarlas rompe enlaces entrantes y SEO. Se
  pueden añadir entradas a `navLinks`, no rebautizar las existentes.
- **`Section.astro` es dueño del ancho, los márgenes laterales y el ritmo
  vertical**, para que las secciones solo describan su contenido.
- **`npm run build` corre `astro check` antes de compilar**, así un error de
  tipos no llega a `dist/`. Para saltárselo en iteración rápida, `build:fast`.

## Página de competición

Torneos, calendario, resultados y equipos, en `/competition/` y su equivalente
en cada idioma, más una página por torneo. **Se publica.**

### Bajarla otra vez

Abre `src/config/features.ts` y cambia una palabra:

```ts
export const features = {
  competition: { published: false },   // estaba en true
};
```

Con `published: false` las páginas **no se generan**. No existe el archivo en
`dist/`, así que nadie puede llegar a ellas aunque escriba la URL exacta. No es
una contraseña: es que no están.

Un sitio estático no puede tener login de verdad. Si pusiéramos una contraseña
en JavaScript, el HTML con todos los datos se descargaría igual y cualquiera lo
leería en el código fuente. Por eso no está hecho así.

Mientras el flag esté en `false` las páginas llevan además `noindex`, por si
algún día se publican por error. Y las sigues viendo en tu equipo con
`npm run dev`, en `http://localhost:4321/competition/`.

### Ojo con los datos mientras estén publicadas

Los equipos, torneos y partidos que hay ahora son inventados, y ya no llevan
`noindex`: un buscador puede indexarlos. Reemplázalos por los reales, o baja el
flag hasta que los tengas.

### La página de cada torneo

`/competition/` es el índice. Cada torneo de `tournaments.yaml` tiene además su
propia página en `/competition/<id>/`, con la estructura que usan las páginas de
torneo del sector (Liquipedia y compañía), traducida al sistema visual de Nexus:
sin bordes redondeados, retícula de líneas de un píxel, oro solo como acento.

| Sección | Qué muestra | De dónde sale |
| --- | --- | --- |
| Cabecera | Nombre, estado, fechas, premios, equipos, formato, sede | `tournaments.yaml` |
| Barra de secciones | Índice pegajoso que marca por dónde vas leyendo | las secciones que tengan datos |
| Resumen | Reparto de premios + ficha con los datos del torneo | `prizePool` |
| Formato | Una tarjeta por fase: sistema, equipos, Bo, cuántos pasan | `phases` |
| Participantes | Los equipos, cómo entraron, su plantilla y su premio | `participants` + `players` |
| Clasificación | Tabla de cada grupo: series, mapas, diferencia | se **calcula** de los partidos con `group` |
| Cuadro | El bracket, con las llaves dibujadas | los partidos con `bracket` y `round` |
| Partidos | Todos los partidos por día, jugados y por jugar | `matches.yaml` |

**Una sección que no tiene datos no se dibuja, y tampoco aparece en la barra.**
Un torneo con solo fechas y equipos sigue dando una página que se lee entera,
no una llena de huecos. Por eso los tres torneos de ejemplo son distintos a
propósito: Season One lleva cuadro de doble eliminación, LATAM Qualifier lleva
grupos y no lleva cuadro, y Summer Invitational está terminado con premios ya
repartidos.

Nada de la clasificación está guardado: un resultado se escribe una sola vez,
en `matches.yaml`, y la tabla se cuenta a partir de ahí. Así una tabla nunca
puede contradecir al resultado del que salió.

### Editar los datos

Todo está en `src/data/`, en tres archivos con comentarios explicando cada
campo:

| Archivo | Contiene |
| --- | --- |
| `teams.yaml` | Equipos: nombre, abreviatura, región, logo y plantilla opcionales |
| `tournaments.yaml` | Torneos: fechas, estado, formato, equipos, premios, fases, participantes |
| `matches.yaml` | Partidos: torneo, fase, fecha y hora, equipos, marcador, cuadro |

**Un partido pasa de calendario a resultados solo con ponerle `score`.** No hay
que moverlo de sitio ni tocar código.

**Un hueco del cuadro se publica sin equipos.** Si dejas `home` y `away` sin
poner, el partido sale como "Por definir": puedes publicar el cuadro entero el
día uno y solo ir rellenando nombres.

Todo lo que no es obligatorio se puede dejar fuera. Los campos opcionales
—premios, fases, participantes, plantillas, `bracket`, `group`— existen para
encender secciones de la página del torneo; lo que no rellenes, no se dibuja.

Los nombres de fase, formato y estado se traducen solos a los tres idiomas: en
el YAML escribes la clave (`quarterfinal`, `swiss`, `live`) y la web pone
"Cuartos de final", "Sistema suizo", "En directo". Lo mismo con lo nuevo:
`invited` es "Invitado", `hybrid` es "En línea y presencial", y una frase como
"8 equipos · Bo3 · pasan 4" la escribe cada idioma por su cuenta a partir de los
números. Por eso no hay texto libre para describir el formato: se rompería en
los otros dos idiomas.

### Si te equivocas al editar

Hay dos redes de seguridad y las dos detienen la compilación con un mensaje
claro, en vez de dejar la página rota en silencio:

```bash
npm run check:data
```

Comprueba que ningún partido apunte a un equipo o torneo que no existe, que no
haya ids repetidos, que un equipo no juegue contra sí mismo y que un torneo no
termine antes de empezar. También, ahora que hay más que rellenar: que el
reparto de premios sume exactamente el bote, que `teamCount` coincida con los
participantes que has listado, y que un partido con `bracket` diga en qué ronda
va. Se ejecuta solo dentro de `npm run build`.

Los esquemas de `src/content.config.ts` validan cada archivo por separado.
Ejemplo real de lo que verías al escribir mal un formato:

```
[InvalidContentEntryDataError] tournaments → season-one
  format: Invalid option: expected one of "doubleElimination"|"singleElimination"|...
  teamCount: Required
```

Te dice el archivo, la entrada, el campo y las opciones válidas.

### Los datos actuales son de ejemplo

Los doce equipos, los tres torneos y los veintinueve partidos están inventados
para poder ver la página montada, plantillas incluidas. Cada archivo lo avisa
en la primera línea. Reemplázalos antes de publicar.

Los equipos sin `logo` se dibujan con un monograma de su abreviatura. Cuando
tengas los logos reales, déjalos en `public/` y añade la ruta en `teams.yaml`.

### Horarios

Todo se muestra en UTC y así lo dice la página. Es una web estática: una "hora
local" calculada al compilar sería la hora de la máquina que compila, no la de
quien mira. UTC es lo que publican los calendarios de competición y no admite
ambigüedad.

## Idiomas

Tres locales, con el inglés servido desde la raíz para no romper las URLs
existentes:

| Ruta | Idioma |
| --- | --- |
| `/` | English |
| `/es/` | Español |
| `/ru/` | Русский |

El conjunto sale de los propios canales de Twitch de la marca, que ya emiten en
ES, EN y RU.

### Dónde está el conmutador y por qué

En la barra de navegación, junto al conmutador de tema, como desplegable
compacto de 64px. La restricción que decidió el formato es la regla de que la
navegación debe caber en **una sola línea a 1024px**. Medido en ese ancho
quedaban 199px libres: tres enlaces sueltos `EN | ES | RU` no entran una vez que
las etiquetas en español, más largas, ocupan su sitio. El desplegable sí.

Se repite en el menú móvil por estar en el grupo de botones siempre visible, así
que no hace falta duplicarlo.

### Cómo funciona

`Astro.currentLocale` lo resuelve el enrutado i18n de Astro, y cada componente
llama a `useTranslations()` por su cuenta. No se pasa el idioma por props, así
que añadir una sección no obliga a encadenar nada.

`src/types/index.ts` define `Dictionary`. Cada archivo de `src/content/` debe
satisfacer ese tipo, por lo que **una clave que falte en una traducción es un
error de compilación**, no un hueco silencioso en la página.

### Añadir un idioma

1. Copia `src/content/en.ts` a `src/content/<código>.ts` y traduce.
2. Añade el código a `locales` en `astro.config.mjs`.
3. Añade su entrada en `localeMeta` y en `dictionaries` dentro de `lib/i18n.ts`.

La ruta, el conmutador, los `hreflang` y el `og:locale` se generan solos.

### El tamaño del titular es parte del idioma

`hero.headlineClamp` vive en el diccionario porque la longitud traducida cambia
la tipografía que aguanta. Medido: el titular en español a 72px ocupa 1274px y
desbordaría a 1280 de viewport, rompiendo la regla de máximo dos líneas. Por eso
el español usa un techo de 4rem y el inglés y el ruso 4.5rem.

### Sobre las traducciones

Las escribí yo. El español está listo; **el ruso conviene que lo revise un
hablante nativo** antes de publicar. Están redactadas evitando construcciones
que exijan raya (`—`), que el proyecto no usa en ninguna parte, sin forzar por
ello gramática incorrecta en ruso.

## Sistema de diseño

**Paleta bloqueada**, tomada de los propios SVG:

| Rol | Oscuro | Claro |
| --- | --- | --- |
| Fondo | `#06080f` | `#f1f1f0` |
| Texto | `#eeedee` | `#10131c` |
| Marca (estructural) | `#1d3c87` / `#4470d8` | `#1d3c87` |
| Acento (único) | `#ae7c32` / `#d2a355` | `#8a6023` |

El navy es estructura, el dorado es el único acento y se usa igual en toda la
página. Ambos temas pasan WCAG AA en todo el texto.

**Tipografía**: Archivo Variable para display, con el eje de ancho en 118% para
seguir la geometría ancha del wordmark NEXUS. Inter Tight para cuerpo. Ambas
auto-alojadas vía Fontsource, sin peticiones a Google Fonts.

**Forma**: radio 0 en todo. La marca es angular y la interfaz también.

**Tema**: doble. Por defecto sigue `prefers-color-scheme`, con conmutador
manual que persiste en `localStorage`. El wordmark cambia solo entre
`white.svg` y `normal.svg` mediante la variable `--logo-src`.

## Estructura

Seis secciones, seis familias de layout distintas, sin repetir patrón:

1. **Hero** - titular a todo el ancho en dos líneas exactas, y debajo un split
   asimétrico: texto y CTAs a la izquierda, panel de marca a la derecha.
2. **Canales** - banda fina con los tres canales de Twitch.
3. **About** - bloque editorial a ancho completo, cuerpo a dos columnas.
4. **Vision** - bento asimétrico de tres celdas con pesos visuales distintos.
5. **Partners** - tablero de patrocinio dividido por filetes.
6. **Contact** - split con la columna derecha interactiva.

## Movimiento

Sin GSAP ni Motion. Todo es CSS nativo más un `IntersectionObserver`:

- Entrada escalonada por sección al entrar en viewport.
- Los arcos del hero se dibujan una vez con `stroke-dashoffset`.
- Micro-feedback en hover y `:active` de botones, enlaces y filas de contacto.

Todo colapsa a estático bajo `prefers-reduced-motion: reduce`. El estado oculto
del reveal se arma desde un script en `<head>` (clase `.js-reveal`), así que sin
JavaScript la página se lee entera; además hay un watchdog de 2 s por si el
observer nunca reporta.

## Fotografía

Cuatro imágenes generadas con ChatGPT, en paleta de marca (navy y dorado, sin
texto ni logos). Los originales PNG viven en `src/assets/` y **no se sirven tal
cual**: Astro los procesa en build con `sharp` y emite WebP responsive.

| Archivo | Dónde | Peso original | Servido |
| --- | --- | --- | --- |
| `arena-stage.png` | Hero, a sangre completa | 1384 KB | 30 KB a 1440px |
| `broadcast-booth.png` | Bento 01, fondo de celda | 1409 KB | 18 a 34 KB |
| `team-practice.png` | About, split asimétrico | 1448 KB | 17 a 31 KB |
| `brand-field.png` | Origen de la tarjeta social | 1367 KB | 29 KB (JPEG) |

Las fotos se asignaron por composición, no por orden. La arena se generó con el
tercio izquierdo oscuro y el escenario a la derecha, así que aguanta tipografía
encima a pantalla completa. La cabina se renderiza en el bento a 801x489, casi
la proporción nativa de 1.75, así que apenas se recorta.

La tarjeta social vive en `public/media/og-nexus-series.jpg` (1200x630) y está
enlazada en `og:image` y `twitter:image`. Se regenera así:

```bash
node -e "require('sharp')('src/assets/brand-field.png').resize(1200,630,{fit:'cover'}).jpeg({quality:86,mozjpeg:true}).toFile('public/media/og-nexus-series.jpg')"
```

### Los dos componentes de imagen

- **`MediaBackdrop.astro`** para fotografía a sangre que lleva texto encima
  (hero, celda 01 del bento). Posiciona la imagen en absoluto y aplica un
  scrim. El contenedor debe llevar la clase `on-media`.
- **`MediaSlot.astro`** para imagen enmarcada sin texto encima (About). Sin
  `src` dibuja una superficie de marca en su lugar.

Los valores del scrim en `MediaBackdrop` están fijados en oscuro a propósito, no
tokenizados: un scrim existe para que el texto claro se lea sobre la foto, y una
foto no cambia con el tema. Por eso el texto que va encima usa `.on-media`, que
ancla los tokens al juego claro-sobre-oscuro en ambos modos.

Contraste medido componiendo el scrim sobre los píxeles reales, peor caso: hero
11:1 en el titular y 17:1 en el cuerpo; bento 15.5:1 en el titular y 10:1 en el
cuerpo. En viewport estrecho, donde el recorte es mayor, baja a 8.9:1 y 7.8:1.

### Cambiar o añadir una foto

Deja el archivo en `src/assets/` e impórtalo:

```astro
import arenaStage from "../assets/arena-stage.png";

<MediaSlot
  class="my-8 min-h-[180px] flex-1 lg:my-10"
  src={arenaStage}
  alt="Descripción de lo que se ve, no del evento."
  sizes="(min-width: 1024px) 52vw, 92vw"
  tint={16}
/>
```

`tint` es el lavado navy sobre la foto, de 0 a 100, y sirve para amarrar
material de stock a la paleta. No se usa ningún degradado basado en `--c-bg`
encima de las fotos: se invertiría con el tema y dejaría un velo lechoso al pie
de una foto oscura en modo claro.

## Assets de marca

Cada archivo tiene un sitio y no son intercambiables:

| Archivo | Qué es | Dónde se usa |
| --- | --- | --- |
| `white.svg` | Lockup principal, dibujado para fondo oscuro | Nav y pie en tema oscuro, tarjeta social |
| `normal.svg` | Lockup secundario, para fondo claro | Nav y pie en tema claro |
| `icono-normal.svg` | Isotipo aislado, sin texto | Marcas de agua y relleno de `MediaSlot` |
| `app.svg` | Isotipo en tesela redondeada | Favicon y `apple-touch-icon` |

El cambio entre `white.svg` y `normal.svg` lo hace la variable `--logo-src` en
`tokens.css`, no una condición en JavaScript.

`src/components/ui/NexusMark.astro` es el isotipo extraído de
`icono-normal.svg` con los rellenos convertidos a variables CSS, para que siga
el tema. `public/logos/` conserva los cuatro SVG originales sin tocar.

### Tarjeta social

Lleva el lockup principal compuesto sobre el fondo de marca. Se regenera con:

```bash
npm run og
```

`scripts/build-og.mjs` rasteriza `white.svg` a doble densidad antes de reducirlo,
para que el wordmark no quede blando. Va `white.svg` y no `normal.svg` porque la
tarjeta es oscura y el secundario se perdería en el fondo.

