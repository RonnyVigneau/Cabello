
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

function getHairToneName(hex) {
    const color = hexToRgb(hex);
    let closest = HAIR_COLOR_PALETTE[0];
    let minimumDistance = Infinity;

    HAIR_COLOR_PALETTE.forEach(function (tone) {
        const sample = hexToRgb(tone.hex);
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

function hexToRgb(hex) {
    const normalized = hex.replace("#", "");
    return {
        r: parseInt(normalized.slice(0, 2), 16),
        g: parseInt(normalized.slice(2, 4), 16),
        b: parseInt(normalized.slice(4, 6), 16)
    };
}

function rgbToHex(color) {
    return "#" + [color.r, color.g, color.b].map(function (component) {
        return Math.round(Math.max(0, Math.min(255, component)))
            .toString(16).padStart(2, "0");
    }).join("").toUpperCase();
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
            if (!Array.isArray(favorites)) {
                console.warn("El almacenamiento de favoritos no contiene una lista válida.");
                return [];
            }
            const validFavorites = favorites.filter(this.isValidFavorite);
            if (validFavorites.length !== favorites.length) {
                console.warn("Se omitieron fórmulas guardadas con datos incompletos.");
            }
            return validFavorites;
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
            Number.isFinite(state.baseIntensity) && state.baseIntensity >= 40 && state.baseIntensity <= 140 &&
            Number.isFinite(state.ref1Opacity) && state.ref1Opacity >= 10 && state.ref1Opacity <= 95 &&
            Number.isFinite(state.ref2Opacity) && state.ref2Opacity >= 10 && state.ref2Opacity <= 95 &&
            ["warm", "studio", "ring", "dim"].includes(state.lighting);
    }

    persistFavorites() {
        try {
            localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(this.favorites));
            return true;
        } catch (error) {
            console.error("No se pudieron guardar las fórmulas.", error);
            this.showToast("No fue posible guardar los favoritos en este navegador.");
            return false;
        }
    }

    renderPresets() {
        const container = document.getElementById("base-presets");
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

        document.getElementById("base-intensity").addEventListener("input", (event) => {
            this.state.baseIntensity = Number(event.target.value);
            document.getElementById("base-intensity-val").textContent = event.target.value + "%";
            this.updateUI();
        });

        ["ref1", "ref2"].forEach((key) => {
            document.getElementById(key + "-active").addEventListener("change", (event) => {
                this.state[key + "Active"] = event.target.checked;
                this.updateUI();
            });
            document.getElementById(key + "-opacity").addEventListener("input", (event) => {
                this.state[key + "Opacity"] = Number(event.target.value);
                document.getElementById(key + "-opacity-val").textContent = event.target.value + "%";
                this.updateUI();
            });
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

        document.getElementById("save-favorite").addEventListener("click", () => this.openSaveFavoriteDialog());
        document.getElementById("copy-formula").addEventListener("click", () => this.copyFormulaText());
        document.getElementById("reset-simulator").addEventListener("click", () => this.resetForm());
        document.getElementById("open-favorites").addEventListener("click", () => this.openFavoritesModal());
        document.getElementById("close-favorites").addEventListener("click", () => this.closeFavoritesModal());
        document.getElementById("cancel-save-favorite").addEventListener("click", () => this.closeSaveFavoriteDialog());
        document.getElementById("save-favorite-modal").addEventListener("click", (event) => {
            if (event.target.id === "save-favorite-modal") this.closeSaveFavoriteDialog();
        });
        document.getElementById("save-favorite-form").addEventListener("submit", (event) => {
            event.preventDefault();
            const saved = this.saveFavorite(document.getElementById("favorite-name-input").value);
            if (saved) this.closeSaveFavoriteDialog();
        });
        document.getElementById("favorites-modal").addEventListener("click", (event) => {
            if (event.target.id === "favorites-modal") this.closeFavoritesModal();
        });
        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape" && !document.getElementById("favorites-modal").hidden) {
                this.closeFavoritesModal();
            } else if (event.key === "Escape" && !document.getElementById("save-favorite-modal").hidden) {
                this.closeSaveFavoriteDialog();
            }
        });
        document.getElementById("favorites-list").addEventListener("click", (event) => {
            const button = event.target.closest("[data-favorite-action]");
            if (!button) return;
            const id = Number(button.dataset.favoriteId);
            if (button.dataset.favoriteAction === "load") this.loadFavorite(id);
            if (button.dataset.favoriteAction === "delete") this.deleteFavorite(id);
        });
    }

    bindColorInput(prefix, stateKey) {
        const picker = document.getElementById(prefix + "-color-picker");
        const hexInput = document.getElementById(prefix + "-hex-input");

        picker.addEventListener("input", () => this.setColor(stateKey, picker.value));
        hexInput.addEventListener("input", () => {
            const valid = /^#[0-9a-f]{6}$/i.test(hexInput.value);
            hexInput.setCustomValidity(valid ? "" : "Ingresa un color HEX con el formato #RRGGBB.");
            if (valid) this.setColor(stateKey, hexInput.value);
        });
        hexInput.addEventListener("change", () => {
            if (hexInput.validationMessage) hexInput.reportValidity();
        });
    }

    setColor(stateKey, color) {
        this.state[stateKey] = color.toLowerCase();
        const prefix = stateKey === "baseColor" ? "base" : stateKey.replace("Color", "");
        document.getElementById(prefix + "-color-picker").value = color;
        document.getElementById(prefix + "-hex-input").value = color.toUpperCase();
        document.getElementById(prefix + "-hex-input").setCustomValidity("");
        this.updateUI();
    }

    applyNeutralization(type) {
        const correction = NEUTRALIZATION_COLORS[type];
        if (!correction) return;
        this.state.ref1Active = true;
        this.state.ref1Opacity = 70;
        document.getElementById("ref1-active").checked = true;
        document.getElementById("ref1-opacity").value = "70";
        document.getElementById("ref1-opacity-val").textContent = "70%";
        this.setColor("ref1Color", correction.color);
        this.showToast("Corrección aplicada: " + correction.label);
    }

    getResultColor() {
        const base = hexToRgb(this.state.baseColor);
        const intensity = this.state.baseIntensity / 100;
        const adjustedBase = {
            r: Math.min(255, base.r * intensity),
            g: Math.min(255, base.g * intensity),
            b: Math.min(255, base.b * intensity)
        };
        const reflections = [];

        if (this.state.ref1Active) {
            reflections.push({
                color: hexToRgb(this.state.ref1Color),
                weight: this.state.ref1Opacity / 100 * (this.state.ref2Active ? 0.75 : 1)
            });
        }
        if (this.state.ref2Active) {
            reflections.push({
                color: hexToRgb(this.state.ref2Color),
                weight: this.state.ref2Opacity / 100 * (this.state.ref1Active ? 0.25 : 1)
            });
        }

        const totalWeight = reflections.reduce((total, reflection) => total + reflection.weight, 0);
        const result = { r: adjustedBase.r * (1 - totalWeight), g: adjustedBase.g * (1 - totalWeight), b: adjustedBase.b * (1 - totalWeight) };
        reflections.forEach((reflection) => {
            result.r += reflection.color.r * reflection.weight;
            result.g += reflection.color.g * reflection.weight;
            result.b += reflection.color.b * reflection.weight;
        });

        return { base: adjustedBase, color: rgbToHex(result), reflections };
    }

    updateUI() {
        const result = this.getResultColor();
        const baseName = getHairToneName(this.state.baseColor);
        const ref1Name = getHairToneName(this.state.ref1Color);
        const ref2Name = getHairToneName(this.state.ref2Color);
        const baseLayer = document.getElementById("hair-base-layer");
        baseLayer.style.backgroundColor = rgbToHex(result.base);

        this.updateReflectionLayer("hair-ref1-layer", this.state.ref1Color, this.state.ref1Opacity, this.state.ref1Active,
            this.state.ref2Active ? 0.75 : 1, 120);
        this.updateReflectionLayer("hair-ref2-layer", this.state.ref2Color, this.state.ref2Opacity, this.state.ref2Active,
            this.state.ref1Active ? 0.25 : 1, 60);

        document.getElementById("base-name-label").textContent = baseName;
        document.getElementById("base-hex-label").textContent = this.state.baseColor.toUpperCase();
        document.getElementById("ref1-name-label").textContent = ref1Name;
        document.getElementById("ref1-hex-label").textContent = this.state.ref1Color.toUpperCase();
        document.getElementById("ref2-name-label").textContent = ref2Name;
        document.getElementById("ref2-hex-label").textContent = this.state.ref2Color.toUpperCase();
        document.getElementById("ref1-prop-badge").textContent =
            this.state.ref1Active ? (this.state.ref2Active ? "75% (principal)" : "100%") : "Inactivo";
        document.getElementById("ref2-prop-badge").textContent =
            this.state.ref2Active ? (this.state.ref1Active ? "25% (secundario)" : "100%") : "Opcional";

        document.getElementById("ref1-controls").classList.toggle("is-disabled", !this.state.ref1Active);
        document.getElementById("ref2-controls").classList.toggle("is-disabled", !this.state.ref2Active);
        document.getElementById("ratio-badge").textContent = this.getRatioLabel();
        document.getElementById("result-color-swatch").style.backgroundColor = result.color;
        document.getElementById("result-hex-code").textContent = result.color;
        document.getElementById("preview-status-text").textContent =
            "Base " + baseName + this.getActiveReflectionNames(ref1Name, ref2Name);
        document.getElementById("hair-container").setAttribute("aria-label",
            "Simulación de " + baseName + this.getActiveReflectionNames(ref1Name, ref2Name) +
            ". Color estimado " + result.color + ".");
        this.renderFormulaDetails(baseName, ref1Name, ref2Name);
        this.updateLighting();
        this.updateFavoritesCount();
    }

    updateReflectionLayer(id, hex, opacity, active, proportion, angle) {
        const layer = document.getElementById(id);
        const color = hexToRgb(hex);
        const alpha = active ? opacity / 100 * proportion : 0;
        layer.style.backgroundImage = "linear-gradient(" + angle + "deg, transparent 12%, " +
            "rgba(" + color.r + ", " + color.g + ", " + color.b + ", " + alpha.toFixed(3) +
            ") 50%, transparent 88%)";
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
            button.classList.toggle("is-selected", button.dataset.light === this.state.lighting);
            button.setAttribute("aria-pressed", String(button.dataset.light === this.state.lighting));
        });
    }

    openSaveFavoriteDialog() {
        const modal = document.getElementById("save-favorite-modal");
        const nameInput = document.getElementById("favorite-name-input");
        nameInput.value = "Mi combinación " + (this.favorites.length + 1);
        modal.hidden = false;
        nameInput.focus();
        nameInput.select();
    }

    closeSaveFavoriteDialog() {
        document.getElementById("save-favorite-modal").hidden = true;
        document.getElementById("save-favorite").focus();
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
        document.getElementById("fav-count").textContent = this.favorites.length;
    }

    openFavoritesModal() {
        const modal = document.getElementById("favorites-modal");
        const list = document.getElementById("favorites-list");
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
                    swatch.style.backgroundColor = color;
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
        document.getElementById("close-favorites").focus();
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
        document.getElementById("favorites-modal").hidden = true;
        document.getElementById("open-favorites").focus();
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
            document.getElementById(prefix + "-color-picker").value = this.state[key];
            const hexInput = document.getElementById(prefix + "-hex-input");
            hexInput.value = this.state[key].toUpperCase();
            hexInput.setCustomValidity("");
        });
        document.getElementById("base-intensity").value = this.state.baseIntensity;
        document.getElementById("base-intensity-val").textContent = this.state.baseIntensity + "%";
        ["ref1", "ref2"].forEach((key) => {
            document.getElementById(key + "-active").checked = this.state[key + "Active"];
            document.getElementById(key + "-opacity").value = this.state[key + "Opacity"];
            document.getElementById(key + "-opacity-val").textContent = this.state[key + "Opacity"] + "%";
        });
    }

    async copyFormulaText() {
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
        lines.push("Color estimado: " + this.getResultColor().color);
        lines.push("Iluminación: " + this.state.lighting);

        try {
            await navigator.clipboard.writeText(lines.join("\n"));
            this.showToast("Fórmula copiada al portapapeles.");
        } catch (error) {
            console.warn("El portapapeles moderno no está disponible; se intentará el método alternativo.", error);
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
            else this.showToast("No se pudo copiar. Revisa los permisos del navegador.");
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