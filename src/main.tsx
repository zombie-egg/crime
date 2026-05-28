import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import AppShell from "@/components/AppShell";
import AppErrorBoundary from "@/components/AppErrorBoundary";
import DetectiveOffice from "@/components/DetectiveOffice";
import InvestigationPage from "@/components/InvestigationPage";
import ResultPage from "@/components/ResultPage";
import "@/index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <BrowserRouter>
        <AnimatePresence mode="wait">
          <Routes>
            <Route element={<AppShell />}>
              <Route index element={<DetectiveOffice />} />
              <Route path="/case/:caseId" element={<InvestigationPage />} />
              <Route path="/result/:caseId" element={<ResultPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </AnimatePresence>
      </BrowserRouter>
    </AppErrorBoundary>
  </React.StrictMode>,
);
