// INSTRUCCIÓN RESUELTA: Soporte de color de alta precisión (16 bits / punto flotante)
// y espacio de color extendido (Display P3 / CSS Color 4) con fallback sRGB.

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

// --- MOTOR DE PRECISIÓN DE COLOR (16 BITS / CANAL Y GAMA AMPLIA) ---
const ColorEngine = {
    // Detecta si la pantalla y el navegador soportan gama amplia Display P3
    supportsP3: (function () {
        return window.matchMedia &&
            window.matchMedia("(color-gamut: p3)").matches &&
            CSS.supports("color", "color(display-p3 1 1 1)");
    })(),

    // Convierte Hexadecimal (#RRGGBB o #48-bit #RRRRGGGGBBBB) a normalizado flotante [0.0, 1.0]
    toNormalized(hex) {
        const clean = hex.replace("#", "");
        if (clean.length === 12) {
            // Hexadecimal de 48 bits (16 bits por canal: 0 a 65535)
            return {
                r: parseInt(clean.slice(0, 4), 16) / 65535,
                g: parseInt(clean.slice(4, 8), 16) / 65535,
                b: parseInt(clean.slice(8, 12), 16) / 65535
            };
        }
        // Hexadecimal estándar de 24 bits (8 bits por canal)
        return {
            r: parseInt(clean.slice(0, 2), 16) / 255,
            g: parseInt(clean.slice(2, 4), 16) / 255,
            b: parseInt(clean.slice(4, 6), 16) / 255
        };
    },

    // Genera CSS string aprovechando Display P3 de 16 bits flotantes si está disponible
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
    },

    to16BitHex(normRgb) {
        const toHex16 = (c) => Math.round(Math.max(0, Math.min(1, c)) * 65535).toString(16).padStart(4, "0");
        return `#${toHex16(normRgb.r)}${toHex16(normRgb.g)}${toHex16(normRgb.b)}`.toUpperCase();
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
        this.bindEvents();
        this.renderPresets();
        this.updateFavoritesCount();
        this.updateUI();
        if (this.storageError) {
            this.showToast("No se pudieron cargar los favoritos guardados.");
        }
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
            /^#[0-9a-f]{6}([0-9a-f]{6})?$/i.test(state.baseColor) &&
            /^#[0-9a-f]{6}([0-9a-f]{6})?$/i.test(state.ref1Color) &&
            /^#[0-9a-f]{6}([0-9a-f]{6})?$/i.test(state.ref2Color) &&
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
                this.setColor("baseColor", preset.hex);
                this.showToast("Base seleccionada: " + preset.name);
            });
            container.appendChild(button);
        });
    }

    bindEvents() {
        this.bindColorInput("base", "baseColor");
        this.bindColorInput("ref1", "ref1Color");
        this.bindColorInput("ref2", "ref2Color");

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

    bindColorInput(prefix, stateKey) {
        const picker = document.getElementById(prefix + "-color-picker");
        const hexInput = document.getElementById(prefix + "-hex-input");

        if (picker) {
            picker.addEventListener("input", () => this.setColor(stateKey, picker.value));
        }
        if (hexInput) {
            hexInput.addEventListener("input", () => {
                // Acepta HEX estándar (#RRGGBB) o 16-bit HEX (#RRRRGGGGBBBB)
                const valid = /^#[0-9a-f]{6}([0-9a-f]{6})?$/i.test(hexInput.value);
                hexInput.setCustomValidity(valid ? "" : "Formato HEX (#RRGGBB o 16-bit #RRRRGGGGBBBB).");
                if (valid) this.setColor(stateKey, hexInput.value);
            });
            hexInput.addEventListener("change", () => {
                if (hexInput.validationMessage) hexInput.reportValidity();
            });
        }
    }

    setColor(stateKey, color) {
        this.state[stateKey] = color.toLowerCase();
        const prefix = stateKey === "baseColor" ? "base" : stateKey.replace("Color", "");
        const picker = document.getElementById(prefix + "-color-picker");
        const hexInput = document.getElementById(prefix + "-hex-input");

        if (picker) {
            // El selector nativo exige formato #RRGGBB estándar
            const norm = ColorEngine.toNormalized(color);
            picker.value = ColorEngine.to8BitHex(norm);
        }
        if (hexInput) {
            hexInput.value = color.toUpperCase();
            hexInput.setCustomValidity("");
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
        this.setColor("ref1Color", correction.color);
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
            colorNorm: result,
            cssColor: ColorEngine.toCSS(result),
            hex8: ColorEngine.to8BitHex(result),
            hex16: ColorEngine.to16BitHex(result),
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
        const ref2Controls = document.getElementById("ref2-controls");
        if (ref1Controls) ref1Controls.classList.toggle("is-disabled", !this.state.ref1Active);
        if (ref2Controls) ref2Controls.classList.toggle("is-disabled", !this.state.ref2Active);

        this.setText("ratio-badge", this.getRatioLabel());

        const swatch = document.getElementById("result-color-swatch");
        if (swatch) swatch.style.backgroundColor = result.cssColor;

        // Se muestra el hex de 16-bit o estándar según corresponda
        this.setText("result-hex-code", result.hex8);

        const activeRefNames = this.getActiveReflectionNames(ref1Name, ref2Name);
        this.setText("preview-status-text", "Base " + baseName + activeRefNames);

        const container = document.getElementById("hair-container");
        if (container) {
            container.setAttribute("aria-label", `Simulación de ${baseName}${activeRefNames}. Color estimado ${result.hex8}.`);
        }

        this.renderFormulaDetails(baseName, ref1Name, ref2Name);
        this.updateLighting();
        this.updateFavoritesCount();
    }

    setText(id, text) {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    }

    updateReflectionLayer(id, hex, opacity, active, proportion, angle) {
        const layer = document.getElementById(id);
        if (!layer) return;

        const norm = ColorEngine.toNormalized(hex);
        const alpha = active ? (opacity / 100) * proportion : 0;
        const colorCSS = ColorEngine.toCSS(norm, alpha);

        layer.style.backgroundImage = `linear-gradient(${angle}deg, transparent 12%, ${colorCSS} 50%, transparent 88%)`;
        layer.style.opacity = active ? "1" : "0";
        layer.setAttribute("aria-hidden", String(!active));
    }

    getRatioLabel() {
        if (this.state.ref1Active && this.state.ref2Active) return "Mezcla dual: 75% / 25%";
        if (this.state.ref1Active) return "1 reflejo activo";
        if (this.state.ref2Active) return "1 reflejo secundario activo";
        return "Solo color base";
    }

    getActiveReflectionNames(ref1Name, ref2Name) {
        let names = "";
        if (this.state.ref1Active) names += " + " + ref1Name;
        if (this.state.ref2Active) names += " + " + ref2Name;
        return names;
    }

    renderFormulaDetails(baseName, ref1Name, ref2Name) {
        const details = document.getElementById("formula-breakdown-details");
        if (!details) return;
        details.replaceChildren();
        this.addFormulaLine(details, "Color base (fondo)", baseName, this.state.baseColor,
            this.state.baseIntensity + "% intensidad");

        if (this.state.ref1Active) {
            this.addFormulaLine(details, "Reflejo 1", ref1Name, this.state.ref1Color,
                this.state.ref1Opacity + "% opacidad" + (this.state.ref2Active ? ", 75% proporción" : ""));
        }
        if (this.state.ref2Active) {
            this.addFormulaLine(details, "Reflejo 2", ref2Name, this.state.ref2Color,
                this.state.ref2Opacity + "% opacidad" + (this.state.ref1Active ? ", 25% proporción" : ""));
        }
    }

    addFormulaLine(container, label, name, hex, detail) {
        const line = document.createElement("p");
        line.textContent = label + ": " + name + " (" + hex.toUpperCase() + ") — " + detail;
        container.appendChild(line);
    }

    updateLighting() {
        const container = document.getElementById("hair-container");
        const sheen = document.getElementById("hair-sheen");
        if (!container || !sheen) return;

        const lightSettings = {
            warm: {
                filter: "brightness(1.05) saturate(1.1) sepia(0.12)",
                sheen: "rgba(255, 238, 190, 0.78)"
            },
            studio: {
                filter: "brightness(1.1) saturate(0.95) contrast(1.05)",
                sheen: "rgba(240, 248, 255, 0.85)"
            },
            ring: {
                filter: "brightness(1.15) saturate(1.05) contrast(1.1)",
                sheen: "rgba(255, 255, 255, 0.95)"
            },
            dim: {
                filter: "brightness(0.85) saturate(0.9) contrast(1.15)",
                sheen: "rgba(210, 210, 210, 0.4)"
            }
        };
        const lighting = lightSettings[this.state.lighting] || lightSettings.warm;
        container.style.filter = lighting.filter;
        sheen.style.backgroundImage = "linear-gradient(90deg, transparent, " + lighting.sheen + ", transparent)";
        document.querySelectorAll(".light-btn").forEach((button) => {
            const isCurrent = button.dataset.light === this.state.lighting;
            button.classList.toggle("is-selected", isCurrent);
            button.setAttribute("aria-pressed", String(isCurrent));
        });
    }

    openSaveFavoriteDialog() {
        const modal = document.getElementById("save-favorite-modal");
        const nameInput = document.getElementById("favorite-name-input");
        if (!modal || !nameInput) return;
        nameInput.value = "Mi combinación " + (this.favorites.length + 1);
        modal.hidden = false;
        nameInput.focus();
        nameInput.select();
    }

    closeSaveFavoriteDialog() {
        const modal = document.getElementById("save-favorite-modal");
        if (modal) modal.hidden = true;
        const btn = document.getElementById("save-favorite");
        if (btn) btn.focus();
    }

    saveFavorite(name) {
        const normalizedName = name.trim();
        if (!normalizedName) {
            this.showToast("Escribe un nombre para guardar la fórmula.");
            return false;
        }

        this.favorites.unshift({
            id: Date.now(),
            name: normalizedName.slice(0, 80),
            state: { ...this.state },
            date: new Date().toLocaleDateString("es-CL")
        });
        if (this.persistFavorites()) {
            this.updateFavoritesCount();
            this.showToast("Fórmula guardada correctamente.");
            return true;
        }
        this.favorites.shift();
        return false;
    }

    updateFavoritesCount() {
        const favEl = document.getElementById("fav-count");
        if (favEl) favEl.textContent = this.favorites.length;
    }

    openFavoritesModal() {
        const modal = document.getElementById("favorites-modal");
        const list = document.getElementById("favorites-list");
        if (!modal || !list) return;
        list.replaceChildren();

        if (!this.favorites.length) {
            const empty = document.createElement("p");
            empty.className = "favorites-empty";
            empty.textContent = "No tienes fórmulas guardadas todavía.";
            list.appendChild(empty);
        } else {
            this.favorites.forEach((favorite) => {
                const row = document.createElement("article");
                row.className = "favorite-item";
                const name = document.createElement("strong");
                name.textContent = favorite.name;
                const info = document.createElement("span");
                info.textContent = (favorite.date || "") + " · Base: " + favorite.state.baseColor.toUpperCase();
                const colors = document.createElement("div");
                colors.className = "favorite-swatches";
                [favorite.state.baseColor,
                ...(favorite.state.ref1Active ? [favorite.state.ref1Color] : []),
                ...(favorite.state.ref2Active ? [favorite.state.ref2Color] : [])
                ].forEach((color) => {
                    const swatch = document.createElement("span");
                    swatch.style.backgroundColor = ColorEngine.toCSS(ColorEngine.toNormalized(color));
                    colors.appendChild(swatch);
                });
                const text = document.createElement("div");
                text.append(name, info);
                const actions = document.createElement("div");
                actions.className = "favorite-actions";
                actions.append(
                    this.createFavoriteAction("Cargar", "load", favorite.id),
                    this.createFavoriteAction("Eliminar", "delete", favorite.id)
                );
                row.append(colors, text, actions);
                list.appendChild(row);
            });
        }

        modal.hidden = false;
        const closeBtn = document.getElementById("close-favorites");
        if (closeBtn) closeBtn.focus();
    }

    createFavoriteAction(label, action, id) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "sim-secondary-button";
        button.textContent = label;
        button.dataset.favoriteAction = action;
        button.dataset.favoriteId = String(id);
        return button;
    }

    closeFavoritesModal() {
        const modal = document.getElementById("favorites-modal");
        if (modal) modal.hidden = true;
        const openBtn = document.getElementById("open-favorites");
        if (openBtn) openBtn.focus();
    }

    loadFavorite(id) {
        const favorite = this.favorites.find((item) => item.id === id);
        if (!favorite || !this.isValidFavorite(favorite)) {
            this.showToast("No se pudo cargar esa fórmula guardada.");
            return;
        }
        this.state = { ...this.state, ...favorite.state };
        this.syncInputsFromState();
        this.updateUI();
        this.closeFavoritesModal();
        this.showToast("Fórmula cargada correctamente.");
    }

    deleteFavorite(id) {
        const previousFavorites = this.favorites;
        this.favorites = this.favorites.filter((item) => item.id !== id);
        if (this.persistFavorites()) {
            this.updateFavoritesCount();
            this.openFavoritesModal();
            this.showToast("Fórmula eliminada.");
        } else {
            this.favorites = previousFavorites;
        }
    }

    syncInputsFromState() {
        ["base", "ref1", "ref2"].forEach((prefix) => {
            const key = prefix === "base" ? "baseColor" : prefix + "Color";
            const picker = document.getElementById(prefix + "-color-picker");
            const hexInput = document.getElementById(prefix + "-hex-input");
            const norm = ColorEngine.toNormalized(this.state[key]);

            if (picker) picker.value = ColorEngine.to8BitHex(norm);
            if (hexInput) {
                hexInput.value = this.state[key].toUpperCase();
                hexInput.setCustomValidity("");
            }
        });
        const baseInt = document.getElementById("base-intensity");
        if (baseInt) {
            baseInt.value = this.state.baseIntensity;
            document.getElementById("base-intensity-val").textContent = this.state.baseIntensity + "%";
        }
        ["ref1", "ref2"].forEach((key) => {
            const act = document.getElementById(key + "-active");
            const op = document.getElementById(key + "-opacity");
            if (act) act.checked = this.state[key + "Active"];
            if (op) {
                op.value = this.state[key + "Opacity"];
                document.getElementById(key + "-opacity-val").textContent = this.state[key + "Opacity"] + "%";
            }
        });
    }

    async copyFormulaText() {
        const result = this.getResultColor();
        const lines = [
            "--- FÓRMULA ATELIER CAPILAR ---",
            "Color base: " + this.state.baseColor.toUpperCase() + " (intensidad: " + this.state.baseIntensity + "%)"
        ];
        if (this.state.ref1Active) {
            lines.push("Reflejo 1: " + this.state.ref1Color.toUpperCase() + " (opacidad: " +
                this.state.ref1Opacity + "%" + (this.state.ref2Active ? ", proporción: 75%" : "") + ")");
        }
        if (this.state.ref2Active) {
            lines.push("Reflejo 2: " + this.state.ref2Color.toUpperCase() + " (opacidad: " +
                this.state.ref2Opacity + "%" + (this.state.ref1Active ? ", proporción: 25%" : "") + ")");
        }
        lines.push("Color estimado (sRGB): " + result.hex8);
        lines.push("Precisión 16-bit: " + result.hex16);
        lines.push("Espacio de color: " + (ColorEngine.supportsP3 ? "Display P3 (Wide Color)" : "sRGB (Estándar)"));
        lines.push("Iluminación: " + this.state.lighting);

        try {
            await navigator.clipboard.writeText(lines.join("\n"));
            this.showToast("Fórmula copiada al portapapeles.");
        } catch (error) {
            const textArea = document.createElement("textarea");
            textArea.value = lines.join("\n");
            textArea.setAttribute("readonly", "");
            textArea.style.position = "fixed";
            textArea.style.opacity = "0";
            document.body.appendChild(textArea);
            textArea.select();
            let copied = false;
            try {
                copied = typeof document.execCommand === "function" && document.execCommand("copy");
            } catch (fallbackError) {
                console.error("El método alternativo de copia falló.", fallbackError);
            } finally {
                textArea.remove();
            }
            if (copied) this.showToast("Fórmula copiada al portapapeles.");
            else this.showToast("No se pudo copiar. Revisa los permisos.");
        }
    }

    resetForm() {
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
        this.syncInputsFromState();
        this.updateUI();
        this.showToast("Valores restaurados.");
    }

    showToast(message) {
        const toast = document.getElementById("toast-notification");
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add("is-visible");
        window.clearTimeout(this.toastTimer);
        this.toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 3000);
    }
}

window.app = new HairColorSimulator();

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

    const baseElem = document.getElementById("tipo-base");
    const quimicosElem = document.getElementById("quimicos-previos");
    if (!baseElem || !quimicosElem) return;

    let origenBase = baseElem.value;
    let quimicos = quimicosElem.value;

    if (origenBase === "artificial") {
        total += MATRIZ_PRECIOS.historial.artificial;
    }
    total += MATRIZ_PRECIOS.historial.quimicos[quimicos] || 0;

    let zonasSelects = document.querySelectorAll(".input-zona");
    zonasSelects.forEach(function (selectZona) {
        if (selectZona.value !== "ninguna") {
            total += MATRIZ_PRECIOS.precioPorZonaSeleccionada;
        }
    });

    const raizElem = document.getElementById("tipo-raiz");
    if (raizElem) {
        let tecnicaRaiz = raizElem.value;
        total += MATRIZ_PRECIOS.raiz[tecnicaRaiz] || 0;
    }

    let elementoPrecio = document.getElementById("monto-estimado");
    if (elementoPrecio) {
        elementoPrecio.textContent = "$" + total.toLocaleString("es-CL") + " CLP";
    }
}

let entradasCotizador = document.querySelectorAll(".input-cotizador, .input-zona");
entradasCotizador.forEach(function (entrada) {
    entrada.addEventListener("change", calcularCotizacionIluminacion);
});

const zonasSVG = document.querySelectorAll(".zona-svg");
zonasSVG.forEach(function (zona) {
    zona.addEventListener("click", function () {
        let numZona = zona.getAttribute("data-zona");
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
