# VENTOBOT

Aplicación web móvil independiente para consultar mercados sintéticos de Deriv y llevar un registro manual de operaciones. Este repositorio no modifica el proyecto antiguo `Botder`.

## Funciones implementadas

- Lista de 10 instrumentos Volatility disponibles en la respuesta pública de Deriv.
- Conexión pública WebSocket con reconexión automática.
- Historial de velas M1 (solicitud de hasta 1.440 velas, 24 horas) y actualización de la vela en curso.
- Gráfico de velas con desplazamiento horizontal, zoom con rueda y diseño adaptable a móvil.
- Pantalla completa.
- Registro manual COMPRAR/VENDER con validación de Entrada, SL, TP1 y TP2.
- Persistencia local del historial y cierre manual.
- Cierre automático del seguimiento al tocar SL o TP2. TP1 queda registrado como nivel informativo y no cierra la operación.
- Dos motores visualmente separados. No emiten señales hasta que las reglas exactas estén implementadas y verificadas.

## Límites conocidos

- No envía órdenes, no usa token privado y no conecta una cuenta MT5.
- La API pública de Deriv y su disponibilidad pueden cambiar; el gráfico debe comprobarse desde el navegador publicado.
- El adaptador usa el endpoint público WebSocket con app_id público 1089.
- La lista muestra hasta 10 instrumentos Volatility que devuelve el proveedor; no garantiza que Deriv ofrezca siempre los mismos símbolos.
- El gráfico conserva hasta 2.000 velas en memoria; solicita 1.440 inicialmente.
- El historial manual se guarda en el almacenamiento local del navegador/dispositivo, no se sincroniza entre dispositivos.

## Motores de estrategia

No se habilitan señales ficticias. El motor de estructura necesita su regla final de confirmación de entrada y definición exacta de zonas. El motor de tres toques requiere validar cómo el usuario define los tres pivotes ZigZag y la línea/canal; no se adopta automáticamente la interpretación de triángulo ni una regla supuesta.

## Ejecutar pruebas

Requiere Node.js 20 o superior:

```sh
npm run check
npm test
```

## Publicación

GitHub → Settings → Pages → Build and deployment → GitHub Actions. El workflow de este repositorio publica la raíz cuando hay un push a `main`.

La dirección habitual del sitio será `https://nilsinbad-tech.github.io/Ventobot/` cuando Pages esté habilitado y el workflow termine correctamente.
