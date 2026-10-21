# Vista 3D

Maqueta estilizada del pueblo para ver cómo sube el agua. Usa los mismos datos que el mapa y se descarga sólo
cuando alguien la abre (three.js, ~150 KB comprimido).

## Qué muestra

- **Relieve** corregido (Copernicus GLO-30 + correcciones). Cada celda se colorea según la cobertura de
  ESA WorldCover, con oclusión aproximada (los bajos se ven más oscuros).
- **Agua**: un plano a la cota simulada. El shader lo recorta con `umbral.png`: sólo se dibuja donde el terreno
  queda conectado con el río a esa cota, así que los bajos aislados quedan secos, igual que en el mapa. La parte
  que se suma respecto de hoy va con un tono más cálido, y hay espuma en la orilla.
- **Monte**: árboles instanciados en las celdas de bosque de WorldCover. Son ilustrativos: la posición sale del
  dato, la forma y la altura no.
- **Edificios**: huellas reales de Overture Maps (OpenStreetMap, Microsoft, Google), extruidas con su altura (o
  3,5 m si no se conoce). Bordó: con agua hoy · naranja: con agua a la altura simulada · claro: seco.
- **Tocar un edificio**: muestra a qué altura del río le llega el agua según el modelo (la celda más baja de su
  entorno inmediato).

La **exageración vertical es ×3** para el terreno, el agua y los edificios por igual, así las profundidades no
engañan. Los árboles van ×1,6, porque son decorativos.

## Calidad

Hay una sola calidad, liviana, igual en celular y escritorio (la alta consumía mucho más y no aportaba a la
lectura de la crecida):

| | |
|---|---|
| Malla del terreno | cada 3 celdas (~25 m) |
| Árboles | hasta 25.000, copa simple |
| Sombras | no |
| Antialias / pixel ratio | no / hasta 1,5 |

La escena se dibuja sólo cuando algo cambia, no en cada cuadro, para cuidar la batería.

Requiere WebGL 2 (texturas de media precisión filtrables).

## Datos (`public/data/relieve/<id>/escena/`)

| Archivo | Formato |
|---|---|
| `cobertura.png` | Escala de grises: código de clase de WorldCover por celda del modelo |
| `arboles.bin` | Uint16 `[x, z, escala·100]` por árbol; x, z en cuartos de metro desde la esquina NO de la grilla. Viene en orden aleatorio: tomar los primeros N deja la densidad pareja. |
| `edificios.json` | `{"unidad_m": 0.25, "e": [[cota_agua_cm \| null, altura_dm, base_cm, x0, z0, …], …]}`. La cota del agua es absoluta, así que no hay que regenerar si cambia el cero del hidrómetro. |

## Créditos obligatorios

Se muestran en la vista: Copernicus DEM (© DLR e.V. / © Airbus Defence and Space, programa Copernicus),
ESA WorldCover (CC BY 4.0) y Overture Maps (ODbL, incluye © OpenStreetMap).
