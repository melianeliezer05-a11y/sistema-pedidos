# DESIGN

## Idea visual central
**Cartel de menú de bar**: papel crema, tinta casi negra, rojo tomate y mostaza como únicos acentos. Los platos se presentan como "pegatinas" (emoji grande sobre una baldosa de color plano con borde de tinta), no como fotos. Admin = mismo lenguaje pero denso y operativo.

## Color (tokens, OKLCH)
- `--paper` oklch(0.97 0.012 85) fondo
- `--ink` oklch(0.2 0.02 50) texto
- `--tomato` oklch(0.6 0.2 28) acción primaria
- `--mustard` oklch(0.82 0.15 85) acento / alertas suaves
- `--leaf` oklch(0.6 0.13 150) ok
- Dark mode: papel → oklch(0.19 0.01 50), tinta → crema. Tokens, nunca hex en componentes.

## Tipografía
- Títulos: Bricolage Grotesque Variable (peso 700-800, tracking -0.02em).
- Cuerpo/UI: Figtree Variable. Números con `tabular-nums`.
- Escala: 12 / 14 / 16 / 20 / 28 / 44 (clamp en hero).

## Forma y espacio
- Radio 14 px tarjetas, 10 px controles. Bordes 1.5 px de tinta suave (`ink/15`) en vez de sombras difusas; sombra "offset duro" 3px solo en la baldosa de plato.
- Espacio base 4 px; secciones 24/40.
- Tap targets ≥ 44 px en cliente.

## Movimiento (motion)
- Entrada/salida: `ease-out` 180-260 ms. Nunca `ease-in`, nunca `transition-all`.
- Carrito: drawer lateral; contador del botón rebota 1 vez al añadir.
- Lista de pedidos admin: entrada con altura+opacidad, pedido nuevo destaca 2 s.
- `prefers-reduced-motion`: sin transformaciones, solo opacidad.

## Imágenes
Sin fotografía: emoji grande sobre baldosa de color + patrón de puntos suave. Decisión consciente; sustituible por foto real por producto (campo `image` futuro).

## Componentes (stack)
React + Tailwind v4 + shadcn/ui (base), motion, lucide. Sheet (carrito), Dialog (personalizar, ticket), Tabs (admin), Table, Badge, Switch, Sonner (avisos).

## Accesibilidad
Contraste AA mínimo, foco visible con anillo mostaza+tinta, estados no solo por color (icono + texto), `aria-live` para estado de pedido y avisos.

## Admin como herramienta profesional (v2.1)
- **Estructura**: riel lateral oscuro fijo (tokens `--rail*`) con atajos numéricos 1-6, barra superior con estado «En vivo», paleta `Ctrl K`, sonido y tema. En móvil, barra inferior de 6 secciones (objetivos ≥ 44 px).
- **Resumen**: KPIs de hoy con variación vs ayer, pedidos por hora (barras) y más vendidos; todo calculado en el cliente desde los pedidos (sin endpoint nuevo).
- **Pedidos**: tablero de 3 columnas (Recibidos, Preparando, Listos) ordenado por llegada; el temporizador pasa a mostaza a 8 min y a rojo a 15 min (icono + texto, no solo color). Historial y exportación CSV.
- **Teclado**: `Ctrl/⌘ K` busca pedidos, secciones y acciones; `1-6` cambian de sección. Sonido de aviso de pedido nuevo (opt-out, guardado en el navegador).
- **Tema**: claro/oscuro/sistema con selector manual; el riel se mantiene oscuro en ambos.
