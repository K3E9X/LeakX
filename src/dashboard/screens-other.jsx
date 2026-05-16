// Other screens (placeholders that look intentional, not empty)

function placeholder(title, sub, ico) {
  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">{title}</h1>
          <p className="page-sub">{sub}</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-outline"><window.Icon.refresh/> Rafraîchir</button>
        </div>
      </div>
      <div className="placeholder">
        <div className="ico">{ico}</div>
        <h3>Module en pré-production</h3>
        <p>Cette section est connectée à votre périmètre mais le mock du module est en cours d'intégration. La structure de page, les filtres et les exports sont déjà câblés.</p>
      </div>
    </div>
  );
}

window.ScreenAlerts     = () => placeholder("Alertes", "8 alertes critiques ouvertes · routage automatique vers Slack #soc-alerts", <window.Icon.bell/>);
window.ScreenStealer    = () => placeholder("Stealer logs", "Lumma · RedLine · StealC · Vidar · Raccoon — corrélation par hash, HWID, victime", <window.Icon.stealer/>);
window.ScreenTelegram   = () => placeholder("Telegram", "4 117 canaux francophones surveillés · ingestion temps réel", <window.Icon.telegram/>);
window.ScreenDarkweb    = () => placeholder("Dark web", "BHF, FH, XSS.is, Exploit.in · accès via Tor exit dédié, anonymisation totale", <window.Icon.dark/>);
window.ScreenRansom     = () => placeholder("Ransomware", "112 groupes actifs surveillés sur leur leak site · alerte avant publication", <window.Icon.ransom/>);
window.ScreenIntegrations = () => placeholder("Intégrations", "Splunk · Sentinel · Elastic · TheHive · Cortex XSOAR · Webhooks signés HMAC", <window.Icon.plug/>);
window.ScreenApi        = () => placeholder("API & clés", "REST API · 10 000 req/j · SDK Python & Go · documentation OpenAPI 3.1", <window.Icon.key/>);
window.ScreenTeam       = () => placeholder("Équipe", "RBAC fin · SSO SAML · SCIM · audit log immuable", <window.Icon.users/>);
window.ScreenSettings   = () => placeholder("Paramètres", "Périmètre · canaux d'alerte · facturation · rétention", <window.Icon.cog/>);
