# Clima Click - Módulo 5

¡Hola! Soy Camila y este es mi proyecto para el Módulo 5. En esta etapa reestructuré todo el código JavaScript usando Programación Orientada a Objetos (POO) y conecté la app a una API real de clima para obtener datos en tiempo real.

## ¿Qué mejoré en esta versión?

* **POO con clases ES6**: Organicé el código en tres clases: `ApiClient`, `LugarClima` y `WeatherApp`.
* **API real**: Conecté la app a Open-Meteo, una API gratuita y sin API key que entrega datos reales de temperatura y pronóstico.
* **async/await**: Usé programación asíncrona para obtener los datos sin bloquear la interfaz.
* **Alertas de clima**: Agregué una sección de alertas que se genera automáticamente según las condiciones de la semana.
* **Manejo de errores**: Si la API falla, se muestra un mensaje de error en pantalla con opción de reintentar.

## Estructura de clases

* **`ApiClient`**: Se encarga de hacer las peticiones a la API con `fetch`. Recibe latitud y longitud y retorna los datos del clima en formato JSON.
* **`LugarClima`**: Representa una ciudad. Almacena nombre, coordenadas, temperatura actual, estado y pronóstico semanal. Tiene un método estático para interpretar los códigos WMO de la API.
* **`WeatherApp`**: Clase principal. Coordina todo — carga los lugares, calcula estadísticas, genera alertas y actualiza el DOM.

## API utilizada

* **Nombre**: Open-Meteo
* **URL base**: `https://api.open-meteo.com/v1/forecast`
* **Documentación**: https://open-meteo.com/
* **Sin API key**: Gratuita y de uso libre
* **Datos que usa esta app**: temperatura actual, pronóstico de 7 días (mínima, máxima, código de clima)

## Estadísticas que calcula la app

* Temperatura mínima de la semana
* Temperatura máxima de la semana
* Temperatura promedio de la semana
* Conteo de días por tipo de clima
* Resumen textual automático
* Alertas: calor (promedio > 28°C), frío (promedio < 10°C), lluvia (≥ 3 días lluviosos)

## ¿Cómo revisar el proyecto?

Abre el archivo `index.html` con Live Server en VS Code. Necesita conexión a internet para obtener los datos de la API.

## Repositorio

https://github.com/camilaandreamh/weather-frontend-m5

## Autora

Camila Andrea Molina Hernández — Coronel, Chile — 2026
