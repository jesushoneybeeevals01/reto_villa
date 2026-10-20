# Cerca · landing page

Landing page de **Cerca**, prototipo para la Hackathon Villavicencio 2026 (Reto 01 · `mente_sana_joven`).
Cerca ayuda a jóvenes de Villavicencio a encontrar información confiable, entender las rutas de apoyo
y llegar al servicio institucional que puede orientarlos. Cada dato lleva fuente oficial y fecha de consulta.

> Cerca no es un servicio de salud ni de emergencias: no diagnostica, no prescribe, no recomienda
> tratamientos y no evalúa riesgo. Es un prototipo TRL 4 que funciona con datos sintéticos.

## Verla en local

Es un sitio estático, sin dependencias ni paso de compilación:

```bash
python3 -m http.server 8080
# o
npx http-server . -p 8080
```

Luego abre <http://localhost:8080>. También funciona en GitHub Pages (el archivo `.nojekyll` ya está incluido).

## Estructura

```
index.html              Página única (contenido y marcado)
assets/css/styles.css   Estilos (tokens, componentes, responsive, movimiento)
assets/js/main.js       Interacciones en JavaScript sin dependencias
assets/fonts/           Geist y Geist Mono (subconjunto latino, auto-alojadas) + licencia OFL
assets/img/favicon.svg  Ícono
```

## Secciones

1. Franja de ayuda inmediata y botón fijo **Líneas de apoyo** (panel con fuente y fecha).
2. Hero con titular rotativo, red de rutas animada en canvas y una ventana que simula el flujo guiado.
3. Marquesina de principios y fuentes oficiales (en texto, sin logos).
4. El reto: frase que se ilumina con el scroll, cifras oficiales estáticas y líneas de apoyo en la misma pantalla.
5. Cómo funciona: cuatro pasos con un teléfono fijo que cambia de pantalla al hacer scroll.
6. Producto: las cuatro funciones permitidas en pestañas con avance automático y maquetas con datos ficticios.
7. Salvaguardas: qué hace y qué nunca hará, ciclo de verificación e indicador de vigencia.
8. Para quién, estado del proyecto (TRL 4), cómo lo probamos, preguntas frecuentes y bloque final de ayuda.

## Accesibilidad y movimiento

- HTML semántico, `lang="es-CO"`, enlaces para saltar al contenido y a las líneas de apoyo.
- Titular rotativo con versión estática para lectores de pantalla; se detiene solo tras tres vueltas.
- Botón **Pausar animaciones** (WCAG 2.2.2) y respeto de `prefers-reduced-motion`.
- Pestañas con el patrón ARIA (flechas, Inicio, Fin); el avance automático se pausa con el cursor o el foco.
- Sin cookies, sin analítica y sin peticiones a terceros (las fuentes están en el repositorio).
- `noindex`: mientras sea prototipo no debe aparecer en buscadores como si fuera un servicio activo.

## Fuentes y fechas de consulta

**El equipo debe abrir cada fuente y actualizar la fecha de consulta antes de la entrega (22 oct 2026).**
Las fechas del 20 oct 2026 vienen de una verificación hecha con resultados de búsqueda (los sitios `.gov.co`
no se pudieron abrir directamente desde el entorno de desarrollo).

| Dato en la página | Fuente | Fecha mostrada |
| --- | --- | --- |
| Línea 106 · Línea Nacional de Teleorientación en Salud Mental (llamada gratuita, 24/7) | [Directorio de salud mental y prevención del suicidio, MinSalud](https://www.minsalud.gov.co/sites/rid/Lists/BibliotecaDigital/RIDE/VS/PP/ET/directorio-salud-mental-prevencion-suicidio-minsalud.pdf) | 19 oct 2026 (slide de la organización) |
| Yo Te Escucho Villavicencio · línea gratuita 01 8000 931 089 · WhatsApp 316 390 7010 · 24 horas | Directorio MinSalud y [Alcaldía de Villavicencio](https://villavicencio.gov.co/linea-emocional-yo-te-escucho-atendio-441-casos-en-salud-mental-durante-el-ultimo-trimestre/) | 19 oct 2026 / 20 oct 2026 |
| 123 · Línea única de emergencias (solo riesgo inmediato) | [Función Pública](https://www1.funcionpublica.gov.co/preguntas-frecuentes/-/asset_publisher/sqxafjubsrEu/content/linea-unica-de-emergencias-nacional-123/28585938) | 20 oct 2026 |
| 28.290 intentos notificados en Colombia hasta el 27 sep 2025; 56,6 % entre 15 y 29 años (preliminar, Sivigila) | [Instituto Nacional de Salud](https://www.ins.gov.co/Noticias/Paginas/Problemas-familiares-el-factor-que-m%C3%A1s-afecta-la-salud-mental-de-los-colombianos.aspx) | 20 oct 2026 |
| 441 personas atendidas por Yo Te Escucho (2 mar – 3 jun 2026) | [Alcaldía de Villavicencio](https://villavicencio.gov.co/linea-emocional-yo-te-escucho-atendio-441-casos-en-salud-mental-durante-el-ultimo-trimestre/) | 20 oct 2026 |

Notas de la verificación:

- El slide dice "316 390 7010 · llamada y WhatsApp". La Alcaldía lo publica como **WhatsApp**, por eso la
  página ofrece la línea gratuita 01 8000 931 089 para llamar. Si el directorio confirma llamadas a ese número,
  se puede agregar.
- El 01 8000 931 089 aparecía sin etiqueta en el slide; la nota de la Alcaldía lo identifica como la línea
  gratuita de Yo Te Escucho.
- No usar el WhatsApp 300 754 8933 (es del 106 de Bogotá) ni "192 opción 4" (desactualizado, 2020).

Para cambiar un número, su etiqueta o una fecha, busca el texto en `index.html`: aparece en la franja
superior, el panel **Líneas de apoyo**, el bloque después de las cifras y el bloque final `#ayuda`.

## Declaración del equipo (borrador para completar)

- **Trabajo previo:** ninguno; la landing se creó durante la hackathon.
- **Herramientas:** HTML, CSS y JavaScript sin frameworks. Desarrollo asistido con IA (Claude Code, de
  Anthropic) para código, textos y verificación de fuentes; el equipo debe revisar y validar todo el contenido.
- **Componentes de terceros:** tipografías Geist y Geist Mono (SIL Open Font License 1.1, ver
  `assets/fonts/OFL-Geist.txt`). Los íconos y el logotipo se dibujaron para este proyecto.
- **Inspiración visual:** scale.com (ritmo, tipografía grande, animaciones). No se copió código, texto ni recursos.
- **Datos:** las maquetas usan solo servicios, actividades y fechas ficticias. No hay datos personales ni de salud.
