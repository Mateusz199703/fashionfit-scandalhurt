import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './auth/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { ShopsPage } from './pages/ShopsPage';
import { ShopDetailPage } from './pages/ShopDetailPage';
import { InstallPage } from './pages/InstallPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { BillingPage } from './pages/BillingPage';
import { SettingsPage } from './pages/SettingsPage';
import { ModulePlaceholderPage } from './pages/ModulePlaceholderPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: 'rgba(10, 10, 10, 0.94)',
              color: '#ffffff',
              borderRadius: '14px',
              border: '1px solid rgba(255,255,255,0.22)',
            },
          }}
        />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route
              path="/fashion-agent"
              element={(
                <ModulePlaceholderPage
                  title="Agent mody"
                  description="Asystent rozmów, który analizuje intencję klienta i wspiera rekomendacje produktowe."
                />
              )}
            />
            <Route
              path="/try-on"
              element={(
                <ModulePlaceholderPage
                  title="Przymierzalnia"
                  description="Moduł przymiarek i podglądu stylizacji zostanie udostępniony w kolejnych etapach Studio."
                />
              )}
            />
            <Route
              path="/visual-system"
              element={(
                <ModulePlaceholderPage
                  title="System wizualny"
                  description="Tu pojawią się ustawienia brandingu, warstw UI i spójności wizualnej modułów FashionFit."
                />
              )}
            />
            <Route
              path="/ai-conversations"
              element={(
                <ModulePlaceholderPage
                  title="Rozmowy AI"
                  description="Panel rozmów i historii konwersacji stylisty będzie dostępny po podpięciu pełnego feedu."
                />
              )}
            />
            <Route
              path="/recommendations"
              element={(
                <ModulePlaceholderPage
                  title="Rekomendacje"
                  description="Sekcja rekomendacji pokaże skuteczność poleceń i konfigurację reguł merchandisingu."
                />
              )}
            />
            <Route
              path="/size-fit"
              element={(
                <ModulePlaceholderPage
                  title="Dopasowanie rozmiaru"
                  description="Tu pojawi się analiza trafności rozmiaru i sygnałów zwrotów dla poszczególnych kategorii."
                />
              )}
            />
            <Route
              path="/catalog"
              element={(
                <ModulePlaceholderPage
                  title="Katalog"
                  description="Widok katalogu produktów i jakości synchronizacji będzie rozwijany w kolejnych iteracjach."
                />
              )}
            />
            <Route
              path="/customers"
              element={(
                <ModulePlaceholderPage
                  title="Klienci"
                  description="Moduł klientów będzie łączyć segmenty, historię zachowań i kontekst zakupowy."
                />
              )}
            />
            <Route
              path="/analytics"
              element={(
                <ModulePlaceholderPage
                  title="Analityka"
                  description="Przekrojowe raporty będą dostępne po zasileniu pełnymi danymi ze sklepów i modułów."
                />
              )}
            />
            <Route path="/shops" element={<ShopsPage />} />
            <Route path="/shops/:id" element={<ShopDetailPage />} />
            <Route path="/install/:id" element={<InstallPage />} />
            <Route path="/analytics/:id" element={<AnalyticsPage />} />
            <Route path="/billing" element={<BillingPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
