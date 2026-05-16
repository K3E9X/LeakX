// Docs app — sidebar + content with code panel

function Sidebar({ current, onPick }) {
  return (
    <aside className="docs-side">
      <div className="docs-side-head">
        <a className="brand" href="index.html">
          <span className="brand-mark"><window.Icon.logo/></span>
          <span><b>Leak</b><span className="brand-x">X</span><small>docs</small></span>
        </a>
        <div className="docs-search">
          <window.Icon.search style={{width: 14, height: 14}}/>
          <input placeholder="Rechercher…"/>
          <span className="kbd">⌘ K</span>
        </div>
      </div>
      <nav className="docs-nav">
        {window.DOCS_NAV.map((group, gi) => (
          <div key={gi}>
            <div className="group">{group.group}</div>
            {group.items.map(item => (
              <a
                key={item.id}
                href={"#" + item.id}
                className={current === item.id ? "on" : ""}
                onClick={(e) => { e.preventDefault(); onPick(item.id); }}
              >
                {item.method && <span className={"method " + item.method}>{item.method === "del" ? "DEL" : item.method.toUpperCase()}</span>}
                <span>{item.label}</span>
              </a>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}

// ============== Syntax highlighter (placeholder-based, safe) ==============
function highlight(code, lang) {
  // Step 1: escape HTML
  let out = code
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Step 2: use placeholders so further regexes don't re-match inside spans.
  // Encode indices as A-Z letters (no digits) so \b\d+\b can't accidentally match them.
  const tokens = [];
  function encodeIdx(n) {
    let s = "";
    do { s = String.fromCharCode(65 + (n % 26)) + s; n = Math.floor(n / 26); } while (n > 0);
    return s;
  }
  function stash(content, cls) {
    const idx = tokens.length;
    tokens.push(`<span class="${cls}">${content}</span>`);
    return `\uE000${encodeIdx(idx)}\uE001`;
  }

  // Comments
  out = out.replace(/(#[^\n]*|\/\/[^\n]*)/g, m => stash(m, "com"));
  // Strings (double, single, backtick)
  out = out.replace(/("[^"\n]*"|'[^'\n]*'|`[^`\n]*`)/g, m => stash(m, "str"));
  // URLs (now safe — strings already stashed)
  out = out.replace(/(https:\/\/[^\s"'`]+)/g, m => stash(m, "url"));
  // Numbers — placeholders are \uE000... so won't match \d+
  out = out.replace(/\b(\d+)\b/g, m => stash(m, "num"));
  // Keywords
  const kw = ["import","from","def","return","if","else","elif","for","in","while","async","await","try","except","raise","package","func","struct","var","const","let","interface","type","map","range","chan","go","fn","pub","use","mut","match","impl","trait","new","yield","export","as","with","not","or","and","is","None","True","False","true","false","null","nil","void","int","string","bool"];
  const kwRe = new RegExp("\\b(" + kw.join("|") + ")\\b", "g");
  out = out.replace(kwRe, m => stash(m, "kw"));

  // Step 3: restore placeholders (iterate until none remain, in case nested)
  for (let i = 0; i < 3; i++) {
    out = out.replace(/\uE000([A-Z]+)\uE001/g, (_, code) => {
      let idx = 0;
      for (const ch of code) idx = idx * 26 + (ch.charCodeAt(0) - 65);
      return tokens[idx];
    });
  }

  return out;
}

// ============== Code block with tabs ==============
function CodeBlock({ block }) {
  const [lang, setLang] = useState(block.langs[0].id);
  const [copied, setCopied] = useState(false);
  const current = block.langs.find(l => l.id === lang) || block.langs[0];

  function copy() {
    navigator.clipboard.writeText(current.code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }).catch(() => {});
  }

  return (
    <React.Fragment>
      <div className="code-block">
        <div className="code-tabs">
          {block.langs.map(l => (
            <button key={l.id} className={"code-tab" + (lang === l.id ? " on" : "")} onClick={() => setLang(l.id)}>
              {l.label}
            </button>
          ))}
        </div>
        <div className="code-head">
          <span>Request</span>
          <button className={"copy" + (copied ? " copied" : "")} onClick={copy} title="Copier">
            {copied ? <window.Icon.check style={{width: 12, height: 12}}/> : <window.Icon.copy/>}
          </button>
        </div>
        <pre className="code-body" dangerouslySetInnerHTML={{__html: highlight(current.code, lang)}}/>
      </div>

      {block.response && (
        <div className="code-block response-block">
          <div className="code-head">
            <span>Response</span>
            <span className="status-pill">{block.response.status}</span>
            <span style={{flex: 1}}></span>
          </div>
          <pre className="code-body" dangerouslySetInnerHTML={{__html: highlight(block.response.code, "json")}}/>
        </div>
      )}
    </React.Fragment>
  );
}
window.CodeBlock = CodeBlock;

// ============== Section page ==============
function DocSection({ id }) {
  const section = window.DOCS_SECTIONS[id];
  const codeData = window.DOCS_CODE[id];
  if (!section) return <p>Section non trouvée : {id}</p>;
  const Body = section.body;

  return (
    <div className="docs-layout">
      <div className="docs-prose">
        <h1>{section.title}</h1>
        {section.sub && <p className="h1-sub">{section.sub}</p>}
        {section.badges && (
          <div className="meta-row">
            {section.badges.map((b, i) => (
              <span key={i} className="pill">
                {i === 0 && <window.Icon.bolt/>}
                {b}
              </span>
            ))}
          </div>
        )}
        <Body Icon={window.Icon}/>
      </div>
      {codeData && (
        <div className="code-stack">
          {codeData.blocks.map((b, i) => <CodeBlock key={i} block={b}/>)}
        </div>
      )}
    </div>
  );
}

// ============== Topbar with crumbs ==============
function Topbar({ section }) {
  const crumbs = section ? section.crumb : ["Documentation"];
  return (
    <div className="docs-topbar">
      <div className="docs-crumbs">
        {crumbs.map((c, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span className="sep">/</span>}
            <span className={i === crumbs.length - 1 ? "now" : ""}>{c}</span>
          </React.Fragment>
        ))}
      </div>
      <div className="docs-topbar-right">
        <span className="docs-pill"><span className="dot"></span>api.leakx.fr · operational</span>
        <a className="docs-home-link" href="index.html">
          <window.Icon.back/> Retour au site
        </a>
        <a className="docs-home-link" href="Dashboard.html">
          <window.Icon.grid/> Dashboard
        </a>
      </div>
    </div>
  );
}

// ============== App root ==============
function App() {
  const [current, setCurrent] = useState("introduction");

  useEffect(() => {
    const apply = () => {
      const h = window.location.hash.replace(/^#/, "");
      if (h && window.DOCS_SECTIONS[h]) {
        setCurrent(h);
        const c = document.querySelector(".docs-main");
        if (c) c.scrollTop = 0;
      }
    };
    apply();
    window.addEventListener("hashchange", apply);
    return () => window.removeEventListener("hashchange", apply);
  }, []);

  function pick(id) {
    window.location.hash = id;
    setCurrent(id);
    const c = document.querySelector(".docs-main");
    if (c) c.scrollTop = 0;
  }

  const section = window.DOCS_SECTIONS[current];

  return (
    <div className="docs">
      <Sidebar current={current} onPick={pick}/>
      <main className="docs-main" data-screen-label={`Docs · ${current}`}>
        <Topbar section={section}/>
        <div className="docs-content">
          <DocSection id={current}/>
        </div>
      </main>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App/>);
