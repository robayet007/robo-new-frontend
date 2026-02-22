import { Link } from 'react-router-dom';
import { FaSearch, FaUser, FaCreditCard, FaBolt, FaClock, FaShieldAlt, FaWallet, FaHeadset } from 'react-icons/fa';

const steps = [
  {
    id: 'Step 01',
    title: 'Choose Your Game',
    desc: 'Browse our collection of 50+ popular games and select the one you need to top up.',
    Icon: FaSearch,
  },
  {
    id: 'Step 02',
    title: 'Enter Player ID',
    desc: 'Input your in-game Player ID. This is how we deliver the credits directly to your account.',
    Icon: FaUser,
  },
  {
    id: 'Step 03',
    title: 'Select Package & Pay',
    desc: 'Choose your desired credit package and complete payment using your preferred method.',
    Icon: FaCreditCard,
  },
  {
    id: 'Step 04',
    title: 'Instant Delivery',
    desc: 'Receive your credits within seconds. Start playing with your new items immediately.',
    Icon: FaBolt,
  },
];

const highlights = [
  { label: 'Instant Delivery', Icon: FaClock },
  { label: '100% Secure', Icon: FaShieldAlt },
  { label: 'Best Prices', Icon: FaWallet },
  { label: '24/7 Support', Icon: FaHeadset },
];

function ServiceWorkflow() {
  return (
    <section className="max-w-5xl px-4 py-8 mx-auto sm:px-6 md:py-12">
      <div className="p-5 text-center border shadow-sm rounded-3xl border-slate-200 bg-white/80 sm:p-7">
        <div className="inline-flex items-center px-3 py-1 mb-3 text-xs font-semibold rounded-full bg-slate-100 text-slate-600">
          Service Workflow
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">How It Works</h1>
        <p className="max-w-2xl mx-auto mt-3 text-sm text-slate-500 sm:text-base">
          Top up your favorite games in just 4 simple steps with secure payment and instant delivery.
        </p>
      </div>

      <div className="mt-8 space-y-4 sm:mt-10">
        {steps.map(({ id, title, desc, Icon }) => (
          <div
            key={id}
            className="flex items-start gap-4 p-4 border shadow-sm rounded-2xl sm:p-5 border-slate-200 bg-white/85 hover:shadow-md transition-shadow"
          >
            <div
              className="flex items-center justify-center w-11 h-11 rounded-xl shrink-0 text-white shadow-md"
              style={{
                background: 'linear-gradient(135deg, var(--theme-primary), var(--theme-secondary))',
              }}
            >
              <Icon className="w-4 h-4" />
            </div>
            <div className="pt-0.5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{id}</p>
              <h3 className="text-base font-semibold text-slate-900 sm:text-lg">{title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-500 sm:text-sm">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 mt-8 border shadow-sm sm:mt-10 sm:p-6 rounded-2xl border-slate-200 bg-white/85">
        <h2 className="text-lg font-semibold text-center text-slate-900 sm:text-xl">Why Gamers Love Us</h2>
        <div className="grid grid-cols-2 gap-3 mt-4 sm:grid-cols-4">
          {highlights.map(({ label, Icon }) => (
            <div key={label} className="flex items-center justify-center gap-2 py-2.5 text-xs font-medium rounded-xl bg-slate-50 text-slate-700">
              <Icon className="w-3.5 h-3.5 text-slate-500" />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 text-center sm:mt-10">
        <Link
          to="/"
          className="inline-flex items-center px-7 py-2.5 text-sm font-semibold text-white rounded-xl shadow-lg transition-all hover:scale-[1.02]"
          style={{
            background: 'linear-gradient(135deg, var(--theme-primary), var(--theme-secondary))',
          }}
        >
          Start Topping Up Now
        </Link>
      </div>
    </section>
  );
}

export default ServiceWorkflow;

