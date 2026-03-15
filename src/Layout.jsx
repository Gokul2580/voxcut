const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Clapperboard, LayoutDashboard, LogOut } from "lucide-react";

export default function Layout({ children, currentPageName }) {
  const isEditor = currentPageName === "Editor";
  const isLanding = currentPageName === "Landing";

  if (isLanding) {
    return <>{children}</>;
  }

  if (isEditor) {
    return (
      <div className="dark">
        <div className="h-screen bg-background text-foreground flex flex-col overflow-hidden">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="dark">
      <div className="min-h-screen bg-background text-foreground">
        <nav className="border-b border-border/50 backdrop-blur-xl bg-background/80 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <Link to={createPageUrl("Dashboard")} className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
                <Clapperboard className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight">VOXCUT</span>
            </Link>
            <div className="flex items-center gap-1">
              <Link
                to={createPageUrl("Dashboard")}
                className="px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors flex items-center gap-2"
              >
                <LayoutDashboard className="w-4 h-4" />
                Projects
              </Link>
              <button
                onClick={() => db.auth.logout()}
                className="px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </nav>
        <main>{children}</main>
      </div>
    </div>
  );
}