// =============================================
// MÓDULO 5 — Clima Click
// POO + ES6+ + Consumo de API Open-Meteo
// Autora: Camila Andrea Molina Hernández
// =============================================

// ── CLASE 1: ApiClient ──
class ApiClient {
    constructor(baseUrl = 'https://api.open-meteo.com/v1') {
        this.baseUrl = baseUrl
    }

    async obtenerClima(lat, lon) {
        const url = `${this.baseUrl}/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=America/Santiago&forecast_days=7`
        const respuesta = await fetch(url)
        if (!respuesta.ok) throw new Error('Error al obtener datos de la API')
        return await respuesta.json()
    }
}

// ── CLASE 2: LugarClima ──
class LugarClima {
    constructor({ id, nombre, lat, lon }) {
        this.id = id
        this.nombre = nombre
        this.lat = lat
        this.lon = lon
        this.tempActual = null
        this.estadoActual = null
        this.icono = null
        this.pronosticoSemanal = []
    }

    static interpretarCodigo(codigo) {
        if (codigo === 0)      return { texto: 'Despejado',  icono: 'fas fa-sun' }
        if (codigo <= 3)       return { texto: 'Parcial',    icono: 'fas fa-cloud-sun' }
        if (codigo <= 48)      return { texto: 'Nublado',    icono: 'fas fa-cloud' }
        if (codigo <= 67)      return { texto: 'Lluvioso',   icono: 'fas fa-cloud-rain' }
        if (codigo <= 77)      return { texto: 'Nieve',      icono: 'fas fa-snowflake' }
        if (codigo <= 82)      return { texto: 'Chubascos',  icono: 'fas fa-cloud-showers-heavy' }
        return { texto: 'Tormenta', icono: 'fas fa-bolt' }
    }

    cargarDesdeAPI(data) {
        const actual = LugarClima.interpretarCodigo(data.current_weather.weathercode)
        this.tempActual = Math.round(data.current_weather.temperature)
        this.estadoActual = actual.texto
        this.icono = actual.icono

        const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
        this.pronosticoSemanal = []

        for (let i = 0; i < data.daily.time.length; i++) {
            const fecha = new Date(data.daily.time[i])
            const estado = LugarClima.interpretarCodigo(data.daily.weathercode[i])
            this.pronosticoSemanal.push({
                dia: dias[fecha.getDay()],
                min: Math.round(data.daily.temperature_2m_min[i]),
                max: Math.round(data.daily.temperature_2m_max[i]),
                estado: estado.texto,
                icono: estado.icono
            })
        }
    }
}

// ── CLASE 3: WeatherApp ──
class WeatherApp {
    constructor() {
        this.apiClient = new ApiClient()
        this.lugares = []
        this.lugaresFiltrados = []
    }

    calcularEstadisticas(pronostico) {
        let tempMin = pronostico[0].min
        let tempMax = pronostico[0].max
        let sumaPromedios = 0
        const conteoClima = {}

        for (let i = 0; i < pronostico.length; i++) {
            const dia = pronostico[i]
            if (dia.min < tempMin) tempMin = dia.min
            if (dia.max > tempMax) tempMax = dia.max
            sumaPromedios += (dia.min + dia.max) / 2
            conteoClima[dia.estado] = (conteoClima[dia.estado] || 0) + 1
        }

        const promedio = Math.round(sumaPromedios / pronostico.length)

        let climaMasFrecuente = ''
        let maxConteo = 0
        for (const estado in conteoClima) {
            if (conteoClima[estado] > maxConteo) {
                maxConteo = conteoClima[estado]
                climaMasFrecuente = estado
            }
        }

        let resumen = ''
        if (climaMasFrecuente === 'Despejado' || climaMasFrecuente === 'Soleado') {
            resumen = '☀️ Semana mayormente despejada.'
        } else if (climaMasFrecuente === 'Lluvioso' || climaMasFrecuente === 'Chubascos') {
            resumen = '🌧️ Semana lluviosa, lleva paraguas.'
        } else if (climaMasFrecuente === 'Nublado') {
            resumen = '☁️ Semana nublada con pocas aclaraciones.'
        } else if (climaMasFrecuente === 'Parcial') {
            resumen = '⛅ Semana variable, sol con algunas nubes.'
        } else {
            resumen = '🌡️ Semana con clima variable.'
        }

        return { tempMin, tempMax, promedio, conteoClima, climaMasFrecuente, resumen }
    }

    generarAlertas(stats, pronostico) {
        const alertas = []
        if (stats.promedio > 28) {
            alertas.push({ texto: '🌡️ Alerta de calor: temperatura promedio muy alta.', clase: 'alerta-calor' })
        }
        if (stats.promedio < 10) {
            alertas.push({ texto: '🥶 Alerta de frío: semana con temperaturas bajas.', clase: 'alerta-frio' })
        }
        const diasLluvia = pronostico.filter(d => d.estado === 'Lluvioso' || d.estado === 'Chubascos').length
        if (diasLluvia >= 3) {
            alertas.push({ texto: `🌧️ Semana lluviosa: ${diasLluvia} días con lluvia previstos.`, clase: 'alerta-lluvia' })
        }
        if (alertas.length === 0) {
            alertas.push({ texto: '✅ Sin alertas esta semana. Clima estable.', clase: 'alerta-ok' })
        }
        return alertas
    }

    mostrarCarga(visible) {
        const el = document.getElementById('mensaje-carga')
        if (el) el.style.display = visible ? 'flex' : 'none'
    }

    mostrarError(visible) {
        const el = document.getElementById('mensaje-error')
        if (el) el.style.display = visible ? 'flex' : 'none'
    }

    // Carga todas las ciudades en paralelo
    async cargarLugares() {
        this.mostrarCarga(true)
        this.mostrarError(false)
        const contenedor = document.getElementById('contenedor-clima')
        if (contenedor) contenedor.style.display = 'none'

        try {
            const promesas = CIUDADES_BASE.map(async (base) => {
                const lugar = new LugarClima(base)
                const data = await this.apiClient.obtenerClima(base.lat, base.lon)
                lugar.cargarDesdeAPI(data)
                return lugar
            })

            this.lugares = await Promise.all(promesas)
            this.lugaresFiltrados = [...this.lugares]
            this.renderizarHome()

        } catch (error) {
            console.error('Error al cargar lugares:', error)
            this.mostrarCarga(false)
            this.mostrarError(true)
        }
    }

    // Filtra ciudades según búsqueda
    filtrarCiudades(texto) {
        const busqueda = texto.toLowerCase().trim()
        if (!busqueda) {
            this.lugaresFiltrados = [...this.lugares]
        } else {
            this.lugaresFiltrados = this.lugares.filter(l =>
                l.nombre.toLowerCase().includes(busqueda)
            )
        }
        this.renderizarCards()
    }

    renderizarHome() {
        this.renderizarCards()
        this.mostrarCarga(false)

        const contenedor = document.getElementById('contenedor-clima')
        if (contenedor) contenedor.style.display = 'grid'

        const searchInput = document.getElementById('buscador')
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.filtrarCiudades(e.target.value))
        }

        const linkDetalle = document.getElementById('link-detalle')
        if (linkDetalle && this.lugares.length > 0) {
            const aleatorio = this.lugares[Math.floor(Math.random() * this.lugares.length)]
            linkDetalle.href = `detalle.html?id=${aleatorio.id}`
        }
    }

    renderizarCards() {
        const contenedor = document.getElementById('contenedor-clima')
        if (!contenedor) return

        if (this.lugaresFiltrados.length === 0) {
            contenedor.innerHTML = `<p class="sin-resultados">No se encontraron ciudades con ese nombre.</p>`
            return
        }

        contenedor.innerHTML = ''
        for (const lugar of this.lugaresFiltrados) {
            contenedor.innerHTML += `
                <div class="col">
                    <article class="place-card">
                        <header class="place-card__header">
                            <h3 class="place-card__title">${lugar.nombre}</h3>
                        </header>
                        <div class="place-card__body">
                            <i class="${lugar.icono} fa-3x my-3"></i>
                            <div class="place-card__temp">${lugar.tempActual}°C</div>
                            <p class="place-card__status">${lugar.estadoActual}</p>
                        </div>
                        <div class="place-card__footer">
                            <a href="detalle.html?id=${lugar.id}" class="btn-primary w-100">Ver detalle</a>
                        </div>
                    </article>
                </div>
            `
        }
    }

    async cargarDetalleLugar() {
        this.mostrarCarga(true)
        this.mostrarError(false)

        const params = new URLSearchParams(window.location.search)
        const id = Number(params.get('id'))
        const base = CIUDADES_BASE.find(c => c.id === id)

        if (!base) {
            this.mostrarCarga(false)
            this.mostrarError(true)
            return
        }

        try {
            const lugar = new LugarClima(base)
            const data = await this.apiClient.obtenerClima(base.lat, base.lon)
            lugar.cargarDesdeAPI(data)
            this.renderizarDetalle(lugar)
        } catch (error) {
            console.error('Error al cargar detalle:', error)
            this.mostrarCarga(false)
            this.mostrarError(true)
        }
    }

    renderizarDetalle(lugar) {
        const contenedor = document.getElementById('detalle-container')
        if (!contenedor) return

        document.title = `${lugar.nombre} | Clima Click`
        const stats = this.calcularEstadisticas(lugar.pronosticoSemanal)
        const alertas = this.generarAlertas(stats, lugar.pronosticoSemanal)

        let filasPronostico = ''
        for (const dia of lugar.pronosticoSemanal) {
            filasPronostico += `
                <div class="pronostico-row">
                    <span class="pro-dia">${dia.dia}</span>
                    <i class="${dia.icono} pro-icono"></i>
                    <span class="pro-estado">${dia.estado}</span>
                    <span class="pro-temps">
                        <span class="pro-min">${dia.min}°</span> / <span class="pro-max">${dia.max}°</span>
                    </span>
                </div>
            `
        }

        let conteoHTML = ''
        for (const estado in stats.conteoClima) {
            conteoHTML += `
                <div class="conteo-item">
                    <span>${estado}</span>
                    <strong>${stats.conteoClima[estado]} día${stats.conteoClima[estado] > 1 ? 's' : ''}</strong>
                </div>
            `
        }

        let alertasHTML = ''
        for (const alerta of alertas) {
            alertasHTML += `<div class="alerta-item ${alerta.clase}">${alerta.texto}</div>`
        }

        contenedor.innerHTML = `
            <div class="detail-card">
                <div class="detail-header">
                    <div class="detail-icon"><i class="${lugar.icono} fa-3x"></i></div>
                    <div class="detail-info">
                        <h1 class="detail-city">${lugar.nombre}</h1>
                        <p class="detail-desc">${lugar.estadoActual}</p>
                    </div>
                    <div class="detail-temp">${lugar.tempActual}°C</div>
                </div>

                <section class="pronostico-section">
                    <h2 class="section-title">Pronóstico semanal</h2>
                    <div class="pronostico-list">${filasPronostico}</div>
                </section>

                <section class="estadisticas-section">
                    <h2 class="section-title">Estadísticas de la semana</h2>
                    <div class="stats-grid">
                        <div class="stat-card">
                            <span class="stat-label">Mínima</span>
                            <span class="stat-value">${stats.tempMin}°C</span>
                        </div>
                        <div class="stat-card">
                            <span class="stat-label">Máxima</span>
                            <span class="stat-value">${stats.tempMax}°C</span>
                        </div>
                        <div class="stat-card">
                            <span class="stat-label">Promedio</span>
                            <span class="stat-value">${stats.promedio}°C</span>
                        </div>
                    </div>
                    <div class="conteo-climas">
                        <h3 class="conteo-title">Días por tipo de clima</h3>
                        <div class="conteo-grid">${conteoHTML}</div>
                    </div>
                    <div class="resumen-box">
                        <p class="resumen-texto">${stats.resumen}</p>
                    </div>
                </section>

                <section class="alertas-section">
                    <h2 class="section-title">⚠️ Alertas de clima</h2>
                    <div class="alertas-list">${alertasHTML}</div>
                </section>
            </div>
        `

        this.mostrarCarga(false)
        contenedor.style.display = 'block'
    }
}
