
function generarPromocion(descuento) {


    let seccionInicio = document.getElementById("inicio");


    let mensaje = document.createElement("p");


    if (descuento > 0) {
        mensaje.textContent = "¡Felicidades! Tienes un " + descuento + "% de descuento en cortes.";
        mensaje.style.color = "green";
        mensaje.style.fontWeight = "bold";
    } else {
        mensaje.textContent = "Revisa nuestros servicios para encontrar tu estilo ideal.";
        mensaje.style.color = "gray";
    }


    seccionInicio.appendChild(mensaje);
}


let botonSaludo = document.getElementById("btn-saludo");

botonSaludo.addEventListener("click", function () {

    generarPromocion(20);


    botonSaludo.disabled = true;
});

// Funcionalidad de los Visores de Color y Matiz

// Capturamos los dos visores y las filas de ambas tablas
let visorColorBase = document.getElementById("visor-color");
let visorMatiz = document.getElementById("visor-matiz");

let filasDeColor = document.querySelectorAll(".fila-color");
let filasDeMatiz = document.querySelectorAll(".fila-matiz");

// Criterio 5: Función reutilizable con 3 parámetros
function actualizarVisor(elementoVisor, colorHex, nombre) {
    // Criterio 7: Manipulación del DOM[cite: 1]
    elementoVisor.style.backgroundColor = colorHex;
    elementoVisor.textContent = nombre;

    // Criterio 6: Uso de condiciones (if/else) para contraste de texto[cite: 1]
    // Añadimos también el código del dorado (#d4b85c) a los colores claros
    if (colorHex === "#d4af7a" || colorHex === "#ebd2a4" || colorHex === "#f5e6cd" || colorHex === "#d4b85c") {
        elementoVisor.style.color = "#333333"; // Letra oscura para fondos claros
    } else {
        elementoVisor.style.color = "#FFFFFF"; // Letra blanca para fondos oscuros
    }
}

// Agregamos el evento a las filas de la Tabla de Bases
filasDeColor.forEach(function (fila) {
    fila.addEventListener("click", function () {
        let colorSeleccionado = fila.getAttribute("data-color");
        let nombreSeleccionado = fila.getAttribute("data-nombre");
        // Llamamos a la función pasándole el visor de bases
        actualizarVisor(visorColorBase, colorSeleccionado, nombreSeleccionado);
    });
});

// Agregamos el evento a las filas de la Tabla de Matices
filasDeMatiz.forEach(function (fila) {
    fila.addEventListener("click", function () {
        let colorSeleccionado = fila.getAttribute("data-color");
        let nombreSeleccionado = fila.getAttribute("data-nombre");
        // Llamamos a la misma función, pero le pasamos el visor de matices
        actualizarVisor(visorMatiz, colorSeleccionado, nombreSeleccionado);
    });
});

const MATRIZ_PRECIOS = {
    baseServicio: 25000,

    historial: {
        natural: 0,
        artificial: 12000,
        quimicos: {
            ninguno: 0,
            alisado: 15000,
            decoloracion: 10000,
            "tinte-oscuro": 25000
        }
    },

    // Valor por cada zona donde el usuario seleccione una técnica activa
    precioPorZonaSeleccionada: 8000,

    raiz: {
        ninguna: 0,
        tapRoot: 10000,
        shadowRoot: 14000,
        meltingRoot: 18000
    }
};

function calcularCotizacionIluminacion() {
    let total = MATRIZ_PRECIOS.baseServicio;

    // 1. Historial
    let origenBase = document.getElementById("tipo-base").value;
    let quimicos = document.getElementById("quimicos-previos").value;

    if (origenBase === "artificial") {
        total += MATRIZ_PRECIOS.historial.artificial;
    }
    total += MATRIZ_PRECIOS.historial.quimicos[quimicos] || 0;

    // 2. Recorremos las 9 zonas integradas dentro de las tarjetas
    let zonasSelects = document.querySelectorAll(".input-zona");
    zonasSelects.forEach(function (selectZona) {
        if (selectZona.value !== "ninguna") {
            total += MATRIZ_PRECIOS.precioPorZonaSeleccionada;
        }
    });

    // 3. Diseño de Raíz
    let tecnicaRaiz = document.getElementById("tipo-raiz").value;
    total += MATRIZ_PRECIOS.raiz[tecnicaRaiz] || 0;

    // 4. Formato de moneda CLP
    let elementoPrecio = document.getElementById("monto-estimado");
    elementoPrecio.textContent = "$" + total.toLocaleString("es-CL") + " CLP";
}

// Escuchadores de eventos para recálculo automático
let entradasCotizador = document.querySelectorAll(".input-cotizador, .input-zona");
entradasCotizador.forEach(function (entrada) {
    entrada.addEventListener("change", calcularCotizacionIluminacion);
});

// --- INTERACCIÓN BIDIRECCIONAL ENTRE EL MAPA SVG Y EL FORMULARIO ---
const zonasSVG = document.querySelectorAll(".zona-svg");
const tarjetasInfo = document.querySelectorAll(".card-info");

// Actualización del evento de clic en las zonas SVG
zonasSVG.forEach(function (zona) {
    zona.addEventListener("click", function () {
        let numZona = zona.getAttribute("data-zona");
        let selectCorrespondiente = document.querySelector(`.input-zona[data-zona="${numZona}"]`);

        // Si la zona está inactiva y tiene valor "ninguna", resalta la tarjeta sin alterar la selección previa
        zona.classList.toggle("activa");

        let tarjetaObjetivo = document.querySelector(`.z${numZona}`);
        if (tarjetaObjetivo) {
            tarjetaObjetivo.scrollIntoView({ behavior: "smooth", block: "center" });

            tarjetaObjetivo.style.transition = "transform 0.3s ease, box-shadow 0.3s ease";
            tarjetaObjetivo.style.transform = "scale(1.03)";
            tarjetaObjetivo.style.boxShadow = "0 0 15px rgba(224, 201, 166, 0.5)";
            
            setTimeout(() => {
                tarjetaObjetivo.style.transform = "scale(1)";
                tarjetaObjetivo.style.boxShadow = "0 4px 8px rgba(0,0,0,0.3)";
            }, 500);
        }
    });
});