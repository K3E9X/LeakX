// Dashboard shell: sidebar + topbar + content router

function Sidebar({ current, goTo }) {
  return (
    <aside className="side">
      <div className="side-head">
        <a className="brand" href="index.html" aria-label="LeakX">
          <span className="brand-mark"><window.Icon.logo/></span>
          <span><b>Leak</b><span className="brand-x">X</span></span>
        </a>
      </div>
      <div className="side-org" data-screen-label="00 Sidebar org-picker">
        <div className="org-picker" onClick={() => {}}>
          <div className="org-pic-logo">{window.ORG.logo}</div>
          <div style={{flex: 1, minWidth: 0}}>
            <div className="org-pic-name">{window.ORG.name}</div>
            <div className="org-pic-domain">{window.ORG.domain} · {window.ORG.plan}</div>
          </div>
          <window.Icon.chev className="org-pic-chev" style={{width: 14, height: 14}}/>
        </div>
      </div>
      <nav className="side-nav">
        {window.SIDE_NAV.map((group, gi) => (
          <div key={gi}>
            <div className="side-group-label">{group.group}</div>
            {group.items.map(item => {
              const I = window.Icon[item.icon] || window.Icon.alert;
              const isOn = current === item.id || (item.id === "leaks" && current === "leak-detail");
              return (
                <button
                  key={item.id}
                  className={"side-item" + (isOn ? " on" : "")}
                  onClick={() => goTo(item.id)}
                >
                  <I/> <span>{item.label}</span>
                  {item.count && <span className={"count" + (item.alert ? " alert" : "")}>{item.count}</span>}
                </button>
              );
            })}
          </div>
        ))}
      </nav>
      <div className="side-foot">
        <div className="side-foot-avatar">{window.USER.initials}</div>
        <div className="side-foot-meta">
          <div className="side-foot-name">{window.USER.name}</div>
          <div className="side-foot-role">{window.USER.role}</div>
        </div>
        <button className="icon-btn"><window.Icon.cog/></button>
      </div>
    </aside>
  );
}

function Topbar({ current, goTo }) {
  const crumbMap = {
    overview: ["Surveillance", "Vue d'ensemble"],
    identities: ["Surveillance", "Identités"],
    leaks: ["Surveillance", "Fuites"],
    "leak-detail": ["Surveillance", "Fuites", "Lumma · log #a4f2"],
    alerts: ["Surveillance", "Alertes"],
    stealer: ["Sources", "Stealer logs"],
    telegram: ["Sources", "Telegram"],
    darkweb: ["Sources", "Dark web"],
    ransom: ["Sources", "Ransomware"],
    integrations: ["Configuration", "Intégrations"],
    api: ["Configuration", "API & clés"],
    team: ["Configuration", "Équipe"],
    settings: ["Configuration", "Paramètres"],
  };
  const crumbs = crumbMap[current] || ["Surveillance", "Vue d'ensemble"];

  return (
    <header className="topbar">
      <div className="crumbs">
        {crumbs.map((c, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span className="sep">/</span>}
            <span className={i === crumbs.length - 1 ? "now" : ""}>
              {i === 1 && current === "leak-detail" ? (
                <a onClick={() => goTo("leaks")} style={{cursor: "pointer"}}>{c}</a>
              ) : c}
            </span>
          </React.Fragment>
        ))}
      </div>
      <div className="topbar-search">
        <window.Icon.search style={{width: 14, height: 14}}/>
        <input placeholder="Rechercher dans toutes les fuites…" />
        <span className="kbd">⌘ K</span>
      </div>
      <div className="topbar-right">
        <button className="icon-btn" title="Notifications">
          <window.Icon.bell/>
          <span className="dot"></span>
        </button>
        <button className="icon-btn" title="Aide"><window.Icon.refresh/></button>
        <button className="icon-btn" title="Plus"><window.Icon.three_dots/></button>
        <a className="btn btn-primary" style={{marginLeft: 8}} href="index.html">
          <window.Icon.ext style={{width: 13, height: 13}}/> Inviter
        </a>
      </div>
    </header>
  );
}

function App() {
  const [current, setCurrent] = useState("overview");
  const [leakId, setLeakId] = useState(null);

  // hash-based routing
  useEffect(() => {
    const apply = () => {
      const h = window.location.hash.replace(/^#/, "");
      if (h.startsWith("leak-detail/")) {
        setCurrent("leak-detail");
        setLeakId(h.split("/")[1]);
      } else if (h) {
        setCurrent(h);
        setLeakId(null);
      }
      // scroll to top of content
      const c = document.querySelector(".content");
      if (c) c.scrollTop = 0;
    };
    apply();
    window.addEventListener("hashchange", apply);
    return () => window.removeEventListener("hashchange", apply);
  }, []);

  function goTo(target, id) {
    if (target === "leak-detail" && id) {
      window.location.hash = "leak-detail/" + id;
    } else {
      window.location.hash = target;
    }
  }

  const screens = {
    overview:      <window.ScreenOverview goTo={goTo}/>,
    identities:    <window.ScreenIdentities goTo={goTo}/>,
    leaks:         <window.ScreenLeaks goTo={goTo}/>,
    "leak-detail": <window.ScreenLeakDetail goTo={goTo} leakId={leakId}/>,
    alerts:        <window.ScreenAlerts/>,
    stealer:       <window.ScreenStealer/>,
    telegram:      <window.ScreenTelegram/>,
    darkweb:       <window.ScreenDarkweb/>,
    ransom:        <window.ScreenRansom/>,
    integrations:  <window.ScreenIntegrations/>,
    api:           <window.ScreenApi/>,
    team:          <window.ScreenTeam/>,
    settings:      <window.ScreenSettings/>,
  };

  return (
    <div className="dash">
      <Sidebar current={current} goTo={goTo}/>
      <Topbar  current={current} goTo={goTo}/>
      <main className="content" data-screen-label={`Dashboard · ${current}`}>
        {screens[current] || screens.overview}
      </main>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App/>);
