// Tweaks panel — three expressive controls that reshape the whole feel.
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "vibe": "azul",
  "density": "regular",
  "finish": "suave"
}/*EDITMODE-END*/;

const VIBE_PALETTES = {
  azul: { // crisp corporate blue (default)
    accent: "#1E5BD9", accent2: "#4A7DE8", accentSoft: "#DCE7FB", accentInk: "#0A2A6E",
    bg: "#F5F7FA", surface: "#FFFFFF", surface2: "#EDF1F6", surface3: "#DDE3EC",
    border: "#DCE2EA", borderStrong: "#B8C2CF",
    text: "#0A0F1A", text2: "#4A5567", text3: "#7E8898",
  },
  terracota: { // warm clay
    accent: "#C2542A", accent2: "#D97757", accentSoft: "#F5DCCC", accentInk: "#5B2410",
    bg: "#FBF6F0", surface: "#FFFFFF", surface2: "#F2EBE2", surface3: "#E5DBCC",
    border: "#E4D9C8", borderStrong: "#C4B7A2",
    text: "#1F1810", text2: "#5C5043", text3: "#8E8275",
  },
  grafito: { // monochrome graphite
    accent: "#1A1A1A", accent2: "#3A3A3A", accentSoft: "#E1E1E1", accentInk: "#000000",
    bg: "#F4F4F4", surface: "#FFFFFF", surface2: "#EBEBEB", surface3: "#D8D8D8",
    border: "#D8D8D8", borderStrong: "#A8A8A8",
    text: "#0A0A0A", text2: "#444444", text3: "#7A7A7A",
  },
};

const DENSITY = {
  comoda:    { fs: "15px", pad: "1.25", radius: "12px", radiusLg: "20px" },
  regular:   { fs: "14px", pad: "1.00", radius: "10px", radiusLg: "16px" },
  compacta:  { fs: "13px", pad: "0.80", radius: "8px",  radiusLg: "12px" },
};

const FINISH = {
  suave:    { shSm: "0 1px 2px rgba(24,23,15,0.04), 0 1px 1px rgba(24,23,15,0.03)",
              shMd: "0 6px 22px -8px rgba(24,23,15,0.10), 0 2px 6px rgba(24,23,15,0.04)",
              shLg: "0 24px 60px -20px rgba(24,23,15,0.18), 0 8px 16px -8px rgba(24,23,15,0.08)",
              borderW: "1px" },
  plano:    { shSm: "none", shMd: "none", shLg: "none", borderW: "1px" },
  marcado:  { shSm: "0 2px 0 rgba(0,0,0,0.05)",
              shMd: "0 4px 0 rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.06)",
              shLg: "0 8px 0 rgba(0,0,0,0.10), 0 0 0 1.5px rgba(0,0,0,0.10)",
              borderW: "1.5px" },
};

const applyTweaks = (t) => {
  const r = document.documentElement.style;
  // Only apply palette in light mode; let dark stay as-is
  if (document.documentElement.dataset.theme !== "dark") {
    const p = VIBE_PALETTES[t.vibe] || VIBE_PALETTES.azul;
    r.setProperty("--accent", p.accent);
    r.setProperty("--accent-2", p.accent2);
    r.setProperty("--accent-soft", p.accentSoft);
    r.setProperty("--accent-ink", p.accentInk);
    r.setProperty("--bg", p.bg);
    r.setProperty("--surface", p.surface);
    r.setProperty("--surface-2", p.surface2);
    r.setProperty("--surface-3", p.surface3);
    r.setProperty("--border", p.border);
    r.setProperty("--border-strong", p.borderStrong);
    r.setProperty("--text", p.text);
    r.setProperty("--text-2", p.text2);
    r.setProperty("--text-3", p.text3);
  }
  const d = DENSITY[t.density] || DENSITY.regular;
  document.body.style.fontSize = d.fs;
  r.setProperty("--radius", d.radius);
  r.setProperty("--radius-lg", d.radiusLg);
  r.setProperty("--density-pad", d.pad);

  const f = FINISH[t.finish] || FINISH.suave;
  r.setProperty("--shadow-sm", f.shSm);
  r.setProperty("--shadow-md", f.shMd);
  r.setProperty("--shadow-lg", f.shLg);
  r.setProperty("--border-w", f.borderW);
};

const TweaksRoot = () => {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  React.useEffect(() => { applyTweaks(t); }, [t.vibe, t.density, t.finish]);

  return (
    <TweaksPanel title="Tweaks" subtitle="Reshape the feel">
      <TweakSection label="Vibe">
        <TweakColor t={t} setTweak={setTweak} k="vibe"
          options={[
            ["#1E5BD9","#DCE7FB","#0A2A6E"],
            ["#C2542A","#F5DCCC","#5B2410"],
            ["#1A1A1A","#E1E1E1","#000000"],
          ]}
          labels={["Azul","Terracota","Grafito"]}
        />
      </TweakSection>
      <TweakSection label="Densidad">
        <TweakRadio t={t} setTweak={setTweak} k="density"
          options={[
            { value: "comoda", label: "Cómoda" },
            { value: "regular", label: "Regular" },
            { value: "compacta", label: "Compacta" },
          ]}
        />
      </TweakSection>
      <TweakSection label="Acabado de superficies">
        <TweakRadio t={t} setTweak={setTweak} k="finish"
          options={[
            { value: "suave", label: "Suave" },
            { value: "plano", label: "Plano" },
            { value: "marcado", label: "Marcado" },
          ]}
        />
      </TweakSection>
    </TweaksPanel>
  );
};

// Pre-apply persisted tweaks before React mounts so first paint is correct
try {
  const saved = JSON.parse(localStorage.getItem("__tweaks_state") || "null");
  if (saved) applyTweaks({ ...TWEAK_DEFAULTS, ...saved });
} catch {}

// Mount panel into its own root so it doesn't interfere with the app
const __tweakHost = document.createElement("div");
document.body.appendChild(__tweakHost);
ReactDOM.createRoot(__tweakHost).render(<TweaksRoot/>);
