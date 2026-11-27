# Desplegar DuoBook en AWS

Rama `deploy`. Todo corre en **una sola máquina** (EC2) con Docker Compose: las tres bases, una copia de la API y Caddy, que pone el HTTPS (D-65).

```
teléfono --HTTPS--> Caddy (80 y 443) --> API :3000 --> PostgreSQL | MongoDB | Neo4j
```

## Qué está probado y qué no

| Probado en el equipo de desarrollo (2026-11-27) | Sin probar |
|---|---|
| `generar-env.sh`, `levantar.sh` y `cargar-datos.sh` en un proyecto de Docker vacío | `preparar-servidor.sh` (necesita Ubuntu) |
| HTTPS por Caddy con certificado local | El certificado público de un dominio real |
| La contraseña pública de la semilla ya no entra; la nueva sí | Todo lo de AWS |
| La app se empaqueta con Expo 58.1 | La compilación del APK |

## 1. Crear la máquina (consola de AWS)

| Ajuste | Valor |
|---|---|
| Sistema | Ubuntu Server 24.04 LTS (x86) |
| Tipo | `t3.medium` (4 GB). Con menos de 4 GB no caben las tres bases |
| Disco | 30 GB gp3 |
| Entrada permitida | 22 solo desde tu IP; 80 y 443 desde cualquier lugar |
| IP | Una IP elástica, para que no cambie al apagar |

La máquina cobra por hora encendida y la IP elástica también puede cobrar: revisa el precio y lo que cubre tu cuenta, y detenla cuando no la uses.

**Dominio.** Caddy necesita un nombre, no una IP. Sin dominio propio sirve `sslip.io`: para la IP `3.90.1.2` el nombre es `3-90-1-2.sslip.io`.

## 2. Instalar

Conéctate por SSH y ejecuta:

```sh
git clone -b deploy https://github.com/Nadia-Guerra/booktok.git
cd booktok
sudo sh deploy/preparar-servidor.sh
exit
```

Vuelve a conectarte (para usar Docker sin `sudo`) y, con tu dominio:

```sh
cd booktok
sh deploy/generar-env.sh 3-90-1-2.sslip.io
sh deploy/levantar.sh
sh deploy/cargar-datos.sh
curl https://3-90-1-2.sslip.io/api/v1/salud
```

La última línea debe responder que las tres bases están bien. Si falla el certificado: `docker compose --profile todas logs caddy` (casi siempre es el puerto 80 cerrado o el dominio mal escrito).

**Contraseñas.** `generar-env.sh` crea claves nuevas en el `.env` del servidor. Para entrar con los usuarios de ejemplo (`admin@ejemplo.test` y los demás), usa:

```sh
grep CLAVE_SEMILLA .env
```

No copies ese `.env` al repositorio ni a un reporte.

## 3. Compilar el APK

En tu computadora, en la rama `deploy`, agrega la dirección del servidor al perfil `demo` de `frontend/eas.json`:

```json
"demo": {
  "node": "24.14.0",
  "distribution": "internal",
  "android": { "buildType": "apk" },
  "env": { "EXPO_PUBLIC_API_URL": "https://3-90-1-2.sslip.io" }
}
```

Y desde `frontend/`:

```powershell
eas build --platform android --profile demo
```

La primera vez pregunta si crea el proyecto en tu cuenta de Expo y la clave de firma: acepta. Esa creación escribe un identificador en `app.json`; haz commit de ese cambio. Al terminar da un enlace para descargar el APK en el teléfono.

Si la dirección cambia, no hace falta compilar otra vez: se escribe en la app, en **Perfil → Conexión con la API**.

## 4. Actualizar o apagar

```sh
git pull
sh deploy/levantar.sh
```

`levantar.sh` no toca los datos. `cargar-datos.sh` sí: los borra y vuelve a cargar los de ejemplo.

Para apagar sin perder datos: `docker compose --profile todas stop`, y después detén la instancia en AWS.

## Límites conocidos

- Una sola máquina y sin copias de seguridad.
- El inicio de sesión no limita los intentos.
- Las imágenes vienen de Wikimedia y Open Library. Wikimedia limita las peticiones seguidas: la app reintenta y algunas pueden tardar en aparecer.
- Nunca levantes dos copias de la API: lleva dentro el sincronizador.
