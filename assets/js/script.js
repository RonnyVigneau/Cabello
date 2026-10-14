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

    if (seccionInicio) seccionInicio.appendChild(mensaje);
}

let botonSaludo = document.getElementById("btn-saludo");
if (botonSaludo) {
    botonSaludo.addEventListener("click", function () {
        generarPromocion(20);
        botonSaludo.disabled = true;
    });
}

const BASE_PRESETS = [
    { name: "Negro ébano", hex: "#121212" },
    { name: "Castaño oscuro", hex: "#2c221e" },
    { name: "Castaño claro", hex: "#5d4037" },
    { name: "Rubio ceniza", hex: "#b5a690" },
    { name: "Rubio dorado", hex: "#d4af37" },
    { name: "Cobrizo intenso", hex: "#b84a23" },
    { name: "Rojo fuego", hex: "#9c1c1c" },
    { name: "Violeta fantasía", hex: "#5b247a" }
];

const HAIR_COLOR_PALETTE = [
    ...BASE_PRESETS,
    { name: "Negro natural", hex: "#1c1b1a" },
    { name: "Castaño oscuro profundo", hex: "#221a16" },
    { name: "Castaño medio chocolate", hex: "#422e23" },
    { name: "Castaño miel / avellana", hex: "#7a5230" },
    { name: "Rubio oscuro", hex: "#8c6d53" },
    { name: "Rubio beige / arena", hex: "#c7b299" },
    { name: "Rubio platino / claro", hex: "#e5dec9" },
    { name: "Rubio muy claro polar", hex: "#f2efe9" },
    { name: "Cobrizo claro / miel", hex: "#cc6c3b" },
    { name: "Rojo fuego / caoba", hex: "#9c1c1c" },
    { name: "Rojo borgoña", hex: "#6e1525" },
    { name: "Rosa / magenta", hex: "#b83280" },
    { name: "Azul fantasía", hex: "#235cb8" },
    { name: "Verde esmeralda", hex: "#23825b" },
    { name: "Gris metálico / plata", hex: "#8c9296" },
    { name: "Blanco ceniza", hex: "#e0e0e0" }
];

const NEUTRALIZATION_COLORS = {
    yellow: { color: "#5b247a", label: "Violeta (neutraliza amarillo)" },
    orange: { color: "#235cb8", label: "Azul (neutraliza naranjo)" },
    red: { color: "#23825b", label: "Verde / mate (neutraliza rojo)" },
    green: { color: "#b84a23", label: "Cobrizo / rojo (neutraliza verde)" }
};

const FAVORITES_STORAGE_KEY = "atelier_hair_favorites";

// Motor de color continuo con soporte para gama extendida Display P3
const ColorEngine = {
    supportsP3: (function () {
        return window.matchMedia &&
            window.matchMedia("(color-gamut: p3)").matches &&
            CSS.supports("color", "color(display-p3 1 1 1)");
    })(),

    toNormalized(hex) {
        const clean = hex.replace("#", "");
        if (clean.length === 12) {
            return {
                r: parseInt(clean.slice(0, 4), 16) / 65535,
                g: parseInt(clean.slice(4, 8), 16) / 65535,
                b: parseInt(clean.slice(8, 12), 16) / 65535
            };
        }
        return {
            r: parseInt(clean.slice(0, 2), 16) / 255,
            g: parseInt(clean.slice(2, 4), 16) / 255,
            b: parseInt(clean.slice(4, 6), 16) / 255
        };
    },

    toCSS(normRgb, alpha = 1) {
        const r = Math.max(0, Math.min(1, normRgb.r));
        const g = Math.max(0, Math.min(1, normRgb.g));
        const b = Math.max(0, Math.min(1, normRgb.b));

        if (this.supportsP3) {
            return `color(display-p3 ${r.toFixed(5)} ${g.toFixed(5)} ${b.toFixed(5)} / ${alpha.toFixed(3)})`;
        }
        return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${alpha.toFixed(3)})`;
    },

    to8BitHex(normRgb) {
        const toHex = (c) => Math.round(Math.max(0, Math.min(1, c)) * 255).toString(16).padStart(2, "0");
        return `#${toHex(normRgb.r)}${toHex(normRgb.g)}${toHex(normRgb.b)}`.toUpperCase();
    }
};

function getHairToneName(hex) {
    const color = ColorEngine.toNormalized(hex);
    let closest = HAIR_COLOR_PALETTE[0];
    let minimumDistance = Infinity;

    HAIR_COLOR_PALETTE.forEach(function (tone) {
        const sample = ColorEngine.toNormalized(tone.hex);
        const red = color.r - sample.r;
        const green = color.g - sample.g;
        const blue = color.b - sample.b;
        const distance = Math.sqrt(0.3 * red * red + 0.59 * green * green + 0.11 * blue * blue);

        if (distance < minimumDistance) {
            minimumDistance = distance;
            closest = tone;
        }
    });

    return closest.name;
}

class HairColorSimulator {
    constructor() {
        this.state = {
            baseColor: "#2c221e",
            baseIntensity: 100,
            ref1Active: true,
            ref1Color: "#d4af37",
            ref1Opacity: 65,
            ref2Active: false,
            ref2Color: "#b83280",
            ref2Opacity: 40,
            lighting: "warm"
        };
        this.storageError = false;
        this.favorites = this.readFavorites();
        this.toastTimer = null;
        this.pickers = {};
        this.bindEvents();
        this.initPickrs();
        this.renderPresets();
        this.updateFavoritesCount();
        this.updateUI();
        if (this.storageError) {
            this.showToast("No se pudieron cargar los favoritos guardados.");
        }
    }

    initPickrs() {
        const setups = [
            { containerId: "#base-picker-container", key: "baseColor", initial: this.state.baseColor },
            { containerId: "#ref1-picker-container", key: "ref1Color", initial: this.state.ref1Color },
            { containerId: "#ref2-picker-container", key: "ref2Color", initial: this.state.ref2Color }
        ];

        setups.forEach((item) => {
            const el = document.querySelector(item.containerId);
            if (!el || typeof Pickr === "undefined") return;

            const pickr = Pickr.create({
                el: el,
                theme: 'nano',
                default: item.initial,
                swatches: [
                    '#121212', '#2C221E', '#5D4037', '#B5A690',
                    '#D4AF37', '#B84A23', '#9C1C1C', '#5B247A'
                ],
                components: {
                    preview: true,
                    opacity: false,
                    hue: true,
                    interaction: {
                        hex: false,
                        input: false,
                        save: false
                    }
                }
            });

            pickr.on('change', (color) => {
                const hex = color.toHEXA().toString();
                this.setColor(item.key, hex, false);
            });

            this.pickers[item.key] = pickr;
        });
    }

    readFavorites() {
        try {
            const favorites = JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY) || "[]");
            if (!Array.isArray(favorites)) return [];
            return favorites.filter(this.isValidFavorite);
        } catch (error) {
            console.error("No se pudieron leer las fórmulas guardadas.", error);
            this.storageError = true;
            return [];
        }
    }

    isValidFavorite(favorite) {
        const state = favorite && favorite.state;
        return favorite && Number.isFinite(favorite.id) &&
            typeof favorite.name === "string" && state &&
            /^#[0-9a-f]{6}$/i.test(state.baseColor) &&
            /^#[0-9a-f]{6}$/i.test(state.ref1Color) &&
            /^#[0-9a-f]{6}$/i.test(state.ref2Color) &&
            typeof state.ref1Active === "boolean" && typeof state.ref2Active === "boolean" &&
            Number.isFinite(state.baseIntensity) &&
            Number.isFinite(state.ref1Opacity) &&
            Number.isFinite(state.ref2Opacity) &&
            ["warm", "studio", "ring", "dim"].includes(state.lighting);
    }

    persistFavorites() {
        try {
            localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(this.favorites));
            return true;
        } catch (error) {
            this.showToast("No fue posible guardar los favoritos en este navegador.");
            return false;
        }
    }

    renderPresets() {
        const container = document.getElementById("base-presets");
        if (!container) return;
        container.replaceChildren();

        BASE_PRESETS.forEach((preset) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "base-preset";
            button.title = preset.name;
            button.setAttribute("aria-label", "Usar tono base " + preset.name);

            const swatch = document.createElement("span");
            swatch.className = "preset-swatch";
            swatch.style.backgroundColor = preset.hex;

            const name = document.createElement("span");
            name.textContent = preset.name;

            button.append(swatch, name);
            button.addEventListener("click", () => {
                this.setColor("baseColor", preset.hex, true);
                this.showToast("Base seleccionada: " + preset.name);
            });
            container.appendChild(button);
        });
    }

    bindEvents() {
        this.bindHexInput("base", "baseColor");
        this.bindHexInput("ref1", "ref1Color");
        this.bindHexInput("ref2", "ref2Color");

        const baseInt = document.getElementById("base-intensity");
        if (baseInt) {
            baseInt.addEventListener("input", (event) => {
                this.state.baseIntensity = Number(event.target.value);
                document.getElementById("base-intensity-val").textContent = event.target.value + "%";
                this.updateUI();
            });
        }

        ["ref1", "ref2"].forEach((key) => {
            const activeElem = document.getElementById(key + "-active");
            const opacElem = document.getElementById(key + "-opacity");

            if (activeElem) {
                activeElem.addEventListener("change", (event) => {
                    this.state[key + "Active"] = event.target.checked;
                    this.updateUI();
                });
            }
            if (opacElem) {
                opacElem.addEventListener("input", (event) => {
                    this.state[key + "Opacity"] = Number(event.target.value);
                    document.getElementById(key + "-opacity-val").textContent = event.target.value + "%";
                    this.updateUI();
                });
            }
        });

        document.querySelectorAll("[data-neutralize]").forEach((button) => {
            button.addEventListener("click", () => this.applyNeutralization(button.dataset.neutralize));
        });

        document.querySelectorAll(".light-btn").forEach((button) => {
            button.addEventListener("click", () => {
                this.state.lighting = button.dataset.light;
                this.updateUI();
            });
        });

        this.bindSafeClick("save-favorite", () => this.openSaveFavoriteDialog());
        this.bindSafeClick("copy-formula", () => this.copyFormulaText());
        this.bindSafeClick("reset-simulator", () => this.resetForm());
        this.bindSafeClick("open-favorites", () => this.openFavoritesModal());
        this.bindSafeClick("close-favorites", () => this.closeFavoritesModal());
        this.bindSafeClick("cancel-save-favorite", () => this.closeSaveFavoriteDialog());

        const saveModal = document.getElementById("save-favorite-modal");
        if (saveModal) {
            saveModal.addEventListener("click", (event) => {
                if (event.target.id === "save-favorite-modal") this.closeSaveFavoriteDialog();
            });
        }

        const favForm = document.getElementById("save-favorite-form");
        if (favForm) {
            favForm.addEventListener("submit", (event) => {
                event.preventDefault();
                const saved = this.saveFavorite(document.getElementById("favorite-name-input").value);
                if (saved) this.closeSaveFavoriteDialog();
            });
        }

        const favModal = document.getElementById("favorites-modal");
        if (favModal) {
            favModal.addEventListener("click", (event) => {
                if (event.target.id === "favorites-modal") this.closeFavoritesModal();
            });
        }

        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape") {
                if (favModal && !favModal.hidden) this.closeFavoritesModal();
                if (saveModal && !saveModal.hidden) this.closeSaveFavoriteDialog();
            }
        });

        const favList = document.getElementById("favorites-list");
        if (favList) {
            favList.addEventListener("click", (event) => {
                const button = event.target.closest("[data-favorite-action]");
                if (!button) return;
                const id = Number(button.dataset.favoriteId);
                if (button.dataset.favoriteAction === "load") this.loadFavorite(id);
                if (button.dataset.favoriteAction === "delete") this.deleteFavorite(id);
            });
        }
    }

    bindSafeClick(id, handler) {
        const el = document.getElementById(id);
        if (el) el.addEventListener("click", handler);
    }

    bindHexInput(prefix, stateKey) {
        const hexInput = document.getElementById(prefix + "-hex-input");
        if (hexInput) {
            hexInput.addEventListener("input", () => {
                const valid = /^#[0-9a-f]{6}$/i.test(hexInput.value);
                hexInput.setCustomValidity(valid ? "" : "Formato HEX (#RRGGBB).");
                if (valid) this.setColor(stateKey, hexInput.value, true);
            });
            hexInput.addEventListener("change", () => {
                if (hexInput.validationMessage) hexInput.reportValidity();
            });
        }
    }

    setColor(stateKey, color, updatePickr = false) {
        this.state[stateKey] = color.toLowerCase();
        const prefix = stateKey === "baseColor" ? "base" : stateKey.replace("Color", "");
        const hexInput = document.getElementById(prefix + "-hex-input");

        if (hexInput) {
            hexInput.value = color.toUpperCase();
            hexInput.setCustomValidity("");
        }

        if (updatePickr && this.pickers[stateKey]) {
            this.pickers[stateKey].setColor(color, true);
        }

        this.updateUI();
    }

    applyNeutralization(type) {
        const correction = NEUTRALIZATION_COLORS[type];
        if (!correction) return;
        this.state.ref1Active = true;
        this.state.ref1Opacity = 70;
        const refActive = document.getElementById("ref1-active");
        const refOpac = document.getElementById("ref1-opacity");
        const refOpacVal = document.getElementById("ref1-opacity-val");

        if (refActive) refActive.checked = true;
        if (refOpac) refOpac.value = "70";
        if (refOpacVal) refOpacVal.textContent = "70%";
        this.setColor("ref1Color", correction.color, true);
        this.showToast("Corrección aplicada: " + correction.label);
    }

    getResultColor() {
        const base = ColorEngine.toNormalized(this.state.baseColor);
        const intensity = this.state.baseIntensity / 100;
        const adjustedBase = {
            r: Math.min(1.0, base.r * intensity),
            g: Math.min(1.0, base.g * intensity),
            b: Math.min(1.0, base.b * intensity)
        };
        const reflections = [];

        if (this.state.ref1Active) {
            reflections.push({
                color: ColorEngine.toNormalized(this.state.ref1Color),
                weight: (this.state.ref1Opacity / 100) * (this.state.ref2Active ? 0.75 : 1)
            });
        }
        if (this.state.ref2Active) {
            reflections.push({
                color: ColorEngine.toNormalized(this.state.ref2Color),
                weight: (this.state.ref2Opacity / 100) * (this.state.ref1Active ? 0.25 : 1)
            });
        }

        const totalWeight = reflections.reduce((total, reflection) => total + reflection.weight, 0);
        const result = {
            r: adjustedBase.r * (1 - totalWeight),
            g: adjustedBase.g * (1 - totalWeight),
            b: adjustedBase.b * (1 - totalWeight)
        };

        reflections.forEach((reflection) => {
            result.r += reflection.color.r * reflection.weight;
            result.g += reflection.color.g * reflection.weight;
            result.b += reflection.color.b * reflection.weight;
        });

        return {
            base: adjustedBase,
            cssColor: ColorEngine.toCSS(result),
            hex8: ColorEngine.to8BitHex(result),
            reflections
        };
    }

    updateUI() {
        const result = this.getResultColor();
        const baseName = getHairToneName(this.state.baseColor);
        const ref1Name = getHairToneName(this.state.ref1Color);
        const ref2Name = getHairToneName(this.state.ref2Color);
        const baseLayer = document.getElementById("hair-base-layer");

        if (baseLayer) {
            baseLayer.style.backgroundColor = ColorEngine.toCSS(result.base);
        }

        this.updateReflectionLayer("hair-ref1-layer", this.state.ref1Color, this.state.ref1Opacity, this.state.ref1Active,
            this.state.ref2Active ? 0.75 : 1, 120);
        this.updateReflectionLayer("hair-ref2-layer", this.state.ref2Color, this.state.ref2Opacity, this.state.ref2Active,
            this.state.ref1Active ? 0.25 : 1, 60);

        this.setText("base-name-label", baseName);
        this.setText("base-hex-label", this.state.baseColor.toUpperCase());
        this.setText("ref1-name-label", ref1Name);
        this.setText("ref1-hex-label", this.state.ref1Color.toUpperCase());
        this.setText("ref2-name-label", ref2Name);
        this.setText("ref2-hex-label", this.state.ref2Color.toUpperCase());

        this.setText("ref1-prop-badge", this.state.ref1Active ? (this.state.ref2Active ? "75% (principal)" : "100%") : "Inactivo");
        this.setText("ref2-prop-badge", this.state.ref2Active ? (this.state.ref1Active ? "25% (secundario)" : "100%") : "Opcional");

        const ref1Controls = document.getElementById("ref1-controls");
        const ref2
