# Pre-invitacion XV Anos - Paola

Sitio con:

- Pre-invitacion para anunciar que se acercan los XV y pedir si apartan o liberan la fecha (18 de julio).
- Panel de control para ver confirmados y rechazados.

## Estructura

- `index.html`: pagina publica de pre-invitacion.
- `admin.html`: panel de control de respuestas.
- `css/styles.css`: estilos con tematica floral/hadas.
- `js/config.js`: credenciales de Supabase.
- `js/main.js`: guardado de respuestas.
- `js/admin.js`: listado y conteos.
- `supabase/schema.sql`: tabla y politicas.

## Configuracion de Supabase

1. Crea un proyecto en Supabase.
2. Ejecuta `supabase/schema.sql` en SQL Editor.
3. Copia URL y ANON KEY de tu proyecto.
4. Edita `js/config.js`:

```js
window.APP_CONFIG = {
  supabaseUrl: "https://TU-PROYECTO.supabase.co",
  supabaseAnonKey: "TU-ANON-KEY"
};
```

## Uso local

Abre `index.html` y `admin.html` con una extension de servidor local de VS Code o cualquier servidor estatico.

Ejemplo en PowerShell dentro de la carpeta del proyecto:

```powershell
python -m http.server 5500
```

Luego entra a:

- `http://localhost:5500/index.html`
- `http://localhost:5500/admin.html`

## Imagenes

Si agregas imagenes dentro de `assets/images`, las puedo colocar en el sitio.

- Ya hay un espacio reservado para `assets/images/fairy-flowers-overlay.png` como textura suave de fondo.
- Si me compartes nombres de archivo o me dices cuales usar, te las integro en el diseno.
