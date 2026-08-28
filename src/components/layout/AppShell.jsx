import React from "react";
import Sidebar from "../dashboard/Sidebar";

export default function AppShell({ children }) {
  return (
    <div className="dashboard-page">
      <Sidebar />
      <main className="main-panel">{children}</main>
    </div>
  );
}