import { useState } from "react";
import { NavLink } from "react-router-dom";

const Sidebar = ({ title, subtitle, links = [], className = "" }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="mb-3 inline-flex items-center rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 md:hidden"
      >
        {open ? "Close menu" : "Open menu"}
      </button>

      <aside
        className={`${className} ${
          open ? "block" : "hidden"
        } rounded-2xl p-4 md:block md:min-h-[calc(100vh-48px)] md:w-64`}
      >
        <div className="mb-5 border-b border-current/20 pb-4">
          <p className="text-xs uppercase tracking-[0.2em] opacity-80">{subtitle}</p>
          <h2 className="mt-2 text-xl font-bold">{title}</h2>
        </div>

        <nav className="space-y-2">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={Boolean(link.end)}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  isActive ? link.activeClassName : link.className
                }`
              }
            >
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-current/30 text-[11px]">
                {link.icon || "•"}
              </span>
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
