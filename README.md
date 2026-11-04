# BOTDER

Proyecto nuevo e independiente para análisis de mercados Deriv y seguimiento manual de señales. Está optimizado como interfaz web móvil.

## Estado actual

- Interfaz responsive inicial.
- Panel de instrumentos de volatilidad.
- Adaptador de datos separado del resto de la aplicación.
- Motores de estrategia separados conceptualmente.
- Registro local de operaciones manuales.
- Pantalla completa para el gráfico.
- No utiliza velas, precios ni resultados simulados.
- No envía órdenes al mercado.

## Estructura

- `src/app.js`: interfaz y coordinación.
- `src/data/deriv-client.js`: conexión de datos.
- `src/core/operation-book.js`: registro manual.
- `styles.css`: diseño adaptable.
- `index.html`: entrada de la aplicación.

## Publicar con GitHub Pages

En GitHub: Settings → Pages → Build and deployment → Deploy from a branch → `main` → `/ (root)` → Save.

## Pendiente antes de activar señales

1. Verificar el protocolo de conexión de datos en el entorno publicado y cargar velas históricas M1.
2. Implementar dibujo de velas, zoom y desplazamiento.
3. Definir y probar las reglas exactas del motor de estructura/liquidez.
4. Definir y probar de forma independiente el motor de canal de tres toques.
5. Unificar el registro de señales, entrada manual, TP/SL e historial con pruebas automatizadas.

**Aviso:** esta base es un panel de análisis. No está conectada a ejecución de operaciones reales y no debe interpretarse como un sistema de trading terminado.