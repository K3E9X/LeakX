// App root for LeakX landing

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "lang": "fr",
  "accent": "#9658f7",
  "density": "regular",
  "heroVariant": "search",
  "terminalLive": true
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = window.useTweaks(TWEAK_DEFAULTS);
  const [lang, setLang] = useState(t.lang || "fr");

  // keep tweak lang and state lang in sync
  useEffect(() => {
    if (t.lang !== lang) setLang(t.lang);
  }, [t.lang]);
  function pickLang(L) {
    setLang(L);
    setTweak("lang", L);
  }

  // accent live-binding
  useEffect(() => {
    const c = t.accent || "#9658f7";
    const root = document.documentElement;
    root.style.setProperty("--accent", c);
    // derive helpers
    root.style.setProperty("--accent-hi", lightenHex(c, 0.15));
    root.style.setProperty("--accent-glow", hexAlpha(c, 0.45));
    root.style.setProperty("--accent-soft", hexAlpha(c, 0.12));
  }, [t.accent]);

  // density
  useEffect(() => {
    const root = document.documentElement;
    if (t.density === "compact") root.style.setProperty("--pad", "clamp(16px, 3vw, 36px)");
    else if (t.density === "comfy") root.style.setProperty("--pad", "clamp(28px, 5vw, 72px)");
    else root.style.setProperty("--pad", "clamp(20px, 4vw, 56px)");
  }, [t.density]);

  const ctx = useMemo(() => ({
    lang,
    setLang: pickLang,
    t: window.I18N[lang],
    heroVariant: t.heroVariant || "search",
  }), [lang, t.heroVariant]);

  const { Nav, Hero, Stats, Sources, HowItWorks, UseCases, Pricing, Sovereignty, FAQ, FinalCTA, Footer } = window;
  const { TweaksPanel, TweakSection, TweakRadio, TweakColor, TweakSelect } = window;

  return (
    <window.I18nContext.Provider value={ctx}>
      <Nav />
      <main>
        <Hero />
        <Stats />
        <Sources />
        <HowItWorks />
        <UseCases />
        <Pricing />
        <Sovereignty />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />

      <TweaksPanel title="Tweaks · LeakX">
        <TweakSection label={lang === "fr" ? "Langue" : "Language"} />
        <TweakRadio
          label={lang === "fr" ? "Affichage" : "Display"}
          value={t.lang}
          options={["fr", "en"]}
          onChange={(v) => pickLang(v)}
        />
        <TweakSection label={lang === "fr" ? "Thème" : "Theme"} />
        <TweakColor
          label={lang === "fr" ? "Couleur d'accent" : "Accent color"}
          value={t.accent}
          options={["#9658f7", "#3b82f6", "#22d3ee", "#10b981", "#f43f5e"]}
          onChange={(v) => setTweak("accent", v)}
        />
        <TweakSelect
          label={lang === "fr" ? "Densité" : "Density"}
          value={t.density}
          options={["compact", "regular", "comfy"]}
          onChange={(v) => setTweak("density", v)}
        />
        <TweakSection label={lang === "fr" ? "Hero" : "Hero"} />
        <TweakSelect
          label={lang === "fr" ? "Variante du hero" : "Hero variant"}
          value={t.heroVariant || "search"}
          options={["search", "counter", "map", "terminal"]}
          onChange={(v) => setTweak("heroVariant", v)}
        />
      </TweaksPanel>
    </window.I18nContext.Provider>
  );
}

// ------- color helpers -------
function hexAlpha(hex, a) {
  const { r, g, b } = parseHex(hex);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}
function lightenHex(hex, amt) {
  const { r, g, b } = parseHex(hex);
  const l = (c) => Math.round(c + (255 - c) * amt);
  return `rgb(${l(r)}, ${l(g)}, ${l(b)})`;
}
function parseHex(hex) {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map(x => x + x).join("");
  return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
