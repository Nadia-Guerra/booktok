# Desplegar DuoBook en AWS

Rama `deploy`. El servidor (API y las tres bases) corre en **una instancia EC2** con Docker Compose. La aplicación móvil **no se despliega en AWS**: es un APK que se instala en el teléfono y habla con la API por HTTPS (D-65).

```
internet --HTTPS--> Caddy --(red web)--> API --(red datos, sin internet)--> PostgreSQL | MongoDB | Neo4j
                    \__________________________ una sola instancia EC2 __________________________/
```

## Seguridad

| Riesgo | Medida |
|---|---|
| Bases expuestas | Ninguna publica puertos; viven en una red de Docker interna, sin salida a internet. Caddy tampoco llega a ellas |
| Acceso a la máquina | Sin SSH, sin llaves y **sin bastión**: se entra con Systems Manager Session Manager desde la consola de AWS. El puerto 22 está cerrado |
| Puertos abiertos | Solo 80 (redirige) y 443 |
| Tráfico en claro | HTTPS con certificado de Let's Encrypt y cabecera HSTS |
| Robo de credenciales de la máquina | IMDSv2 obligatorio y a un salto: los contenedores no las alcanzan. El rol solo permite Session Manager |
| Disco | Cifrado |
| Contraseñas | Se generan en el servidor; la de los usuarios de ejemplo se cambia al cargar, porque la del repositorio es pública |
| Parches | Actualizaciones de seguridad automáticas de Ubuntu |
| Contenedores | `no-new-privileges`, tope de memoria y registros con rotación; la API no corre como root |

**Por qué no un bastión.** Un bastión es una máquina de salto para llegar a una base en una red privada (por ejemplo, RDS). Aquí las bases no tienen dirección propia: solo existen dentro de Docker en la misma máquina. Session Manager es la forma de entrar sin abrir puertos ni pagar una segunda instancia.

**Lo que no se hace** (por costo o alcance): balanceador, NAT, WAF, copias de seguridad y límite de intentos de inicio de sesión.

## Qué está probado y qué no

| Probado en el equipo de desarrollo (2026-11-27) | Sin probar |
|---|---|
| `generar-env.sh`, `levantar.sh` y `cargar-datos.sh` en un proyecto de Docker vacío | La plantilla `aws.yml` (AWS la valida al subirla) |
| Con los topes de memoria del servidor: 12 flujos en meta, sin reinicios | La memoria en una `t3.small` real y la construcción de la imagen ahí |
| Desde Caddy no se alcanza ninguna base; las bases no salen a internet | `preparar-servidor.sh` (necesita Ubuntu) |
| HTTPS por Caddy (certificado local) y redirección desde HTTP | El certificado público |
| La app se empaqueta con Expo 58.1 | La compilación del APK |

## Costo

Precios aproximados en `us-east-1`; confírmalos en la página de precios de AWS.

| Concepto | Por mes encendida |
|---|---|
| `t3.small` (0.0208 USD/h) | unos 15 USD |
| IPv4 pública (0.005 USD/h, también apagada) | unos 3.6 USD |
| Disco de 20 GB | unos 1.6 USD |

En el plan gratuito por créditos esto se descuenta de los créditos.

**Memoria.** Con la semilla, los contenedores usan unos 1.2 GB de los 2 GB: cabe, con poco margen y con Neo4j cerca de su tope. Si falla, la misma plantilla permite `c7i-flex.large` (4 GB, unas cuatro veces el precio por hora).

## 1. Antes de empezar

- Usa un usuario de IAM propio del proyecto, con verificación en dos pasos. No uses la cuenta raíz ni las llaves de otro proyecto. Sus permisos: la política [politica-iam.json](politica-iam.json) (solo lo que crea `aws.yml`) y la administrada `SignInLocalDevelopmentAccess`, para `aws login`.
- En **Billing → Budgets** crea una alerta de gasto.
- Elige la región **N. Virginia (us-east-1)**.

## 2. Crear todo

**CloudFormation → Create stack → Upload a template file** → [aws.yml](aws.yml). Nombre `duobook`, tipo `t3.small`, y acepta la casilla de que crea recursos de IAM. Tarda unos minutos.

En la pestaña **Outputs** copia `Dominio` (algo como `3-90-1-2.sslip.io`).

La máquina termina de prepararse sola unos minutos después (instala Docker y descarga esta rama en `/opt/duobook`).

## 3. Levantar

**EC2 → Instances → duobook → Connect → Session Manager → Connect.** En esa terminal:

```sh
sudo -i
tail -n 3 /var/log/preparar.log
```

Debe terminar en `Listo.`. Si aún no, espera un poco. Después, con tu dominio:

```sh
cd /opt/duobook
sh deploy/generar-env.sh 3-90-1-2.sslip.io
sh deploy/levantar.sh
sh deploy/cargar-datos.sh
curl https://3-90-1-2.sslip.io/api/v1/salud
```

La última línea debe responder que las tres bases están bien. Si falla el certificado: `docker compose --profile todas logs caddy`.

Para entrar con los usuarios de ejemplo (`admin@ejemplo.test` y los demás):

```sh
grep CLAVE_SEMILLA .env
```

No copies ese `.env` al repositorio ni a un reporte.

## 4. Compilar el APK

En tu computadora, rama `deploy`, agrega la dirección al perfil `demo` de `frontend/eas.json`:

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

La primera vez pregunta si crea el proyecto en tu cuenta de Expo y la clave de firma: acepta. Escribe un identificador en `app.json`; haz commit de ese cambio. Al terminar da un enlace para descargar el APK.

## 5. Actualizar, apagar y borrar

Actualizar (no toca los datos):

```sh
cd /opt/duobook && git pull && sh deploy/levantar.sh
```

**Apagar** sin perder datos: EC2 → Stop. Deja de cobrar la máquina, pero siguen el disco y la IP. Al encender, entra y ejecuta `sh deploy/levantar.sh`, y revisa `/api/v1/salud`.

**Borrar todo** al terminar el curso: CloudFormation → pila `duobook` → Delete. Elimina máquina, datos, IP y red, y deja de gastar.

Nunca levantes dos copias de la API: lleva dentro el sincronizador. `cargar-datos.sh` **borra** las bases y vuelve a cargar los datos de ejemplo.

Las imágenes vienen de Wikimedia y Open Library. Wikimedia limita las peticiones seguidas: la app reintenta y algunas pueden tardar en aparecer.
