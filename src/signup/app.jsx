// Signup tunnel app — orchestrates steps

function Stepper({ steps, current }) {
  return (
    <div className="stepper">
      {steps.map((s, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span className="step-arrow">→</span>}
          <span className={"step-pill " + (i < current ? "done" : i === current ? "active" : "")}>
            <span className="n">{i < current ? <window.Icon.check/> : (i + 1)}</span>
            <span>{s}</span>
          </span>
        </React.Fragment>
      ))}
    </div>
  );
}

function App() {
  const [state, setState] = useState({
    plan: null,
    yearly: true,
    account: null,
    domain: "",
    domainVerified: false,
    payment: null,
  });
  const [step, setStep] = useState(0);

  // Pre-select plan from URL ?plan=community|pro|enterprise
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const planParam = params.get("plan");
    if (planParam && ["community", "pro", "enterprise"].includes(planParam)) {
      setState(s => ({ ...s, plan: planParam }));
      setStep(1); // skip the plan picker, jump to account
    }
  }, []);

  // Step flow depends on plan
  const flow = useMemo(() => {
    if (!state.plan) return ["plan", "account"];
    const plan = window.SIGNUP_PLANS.find(p => p.id === state.plan);
    if (!plan) return ["plan", "account"];
    if (plan.id === "community") return ["plan", "account", "success"];
    if (plan.id === "enterprise") return ["plan", "account", "success"];
    return ["plan", "account", "domain", "payment", "success"];
  }, [state.plan]);

  // Labels for stepper
  const labels = useMemo(() => {
    if (state.plan === "community") return ["Formule", "Compte", "Bienvenue"];
    if (state.plan === "enterprise") return ["Formule", "Contact", "Reçu"];
    return ["Formule", "Compte", "Domaine", "Paiement", "Activé"];
  }, [state.plan]);

  function next() { setStep(s => Math.min(s + 1, flow.length - 1)); }
  function back() { setStep(s => Math.max(0, s - 1)); }

  const current = flow[step];

  return (
    <div className="signup-shell">
      <header className="signup-nav">
        <a className="brand" href="index.html">
          <span className="brand-mark"><window.Icon.logo/></span>
          <span><b>Leak</b><span className="brand-x">X</span></span>
        </a>
        <div className="help">
          Déjà un compte ? <a href="Dashboard.html">Se connecter</a>
        </div>
      </header>

      <Stepper steps={labels} current={step}/>

      <main className="signup-main">
        <div className="signup-card">
          {current === "plan"     && <window.StepPlan     state={state} setState={setState} next={next}/>}
          {current === "account"  && <window.StepAccount  state={state} setState={setState} next={next} back={back}/>}
          {current === "domain"   && <window.StepDomain   state={state} setState={setState} next={next} back={back}/>}
          {current === "payment"  && <window.StepPayment  state={state} setState={setState} next={next} back={back}/>}
          {current === "success"  && <window.StepSuccess  state={state}/>}
        </div>
      </main>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App/>);
