import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { setupSilentRefresh } from "./services/authService";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import AddPolicyPage from "./pages/AddPolicyPage";
import PolicyDetailsPage from "./pages/PolicyDetailsPage";
import ExtendPolicyPage from "./pages/ExtendPolicyPage";
import UpdatePolicyPage from "./pages/UpdatePolicyPage";
import ChangeContractorPage from "./pages/ChangeContractorPage";
import EditContractorPage from "./pages/EditContractorPage";
import StatisticsPage from "./pages/StatisticsPage";
import ContractorsPage from "./pages/ContractorsPage";
import ContractorDetailsPage from "./pages/ContractorDetailsPage";
import SettingsPage from "./pages/SettingsPage";
import BSkadencaPage from "./pages/BSkadencaPage";
import EmployeesPage from "./pages/EmployeesPage";
import EmployeeDetailsPage from "./pages/EmployeeDetailsPage";
import EmployeeFormPage from "./pages/EmployeeFormPage";
import TrashPage from "./pages/TrashPage";
import DeletedPolicyDetailsPage from "./pages/DeletedPolicyDetailsPage";
import ProtectedRoute from "./components/common/ProtectedRoute";
import AdminRoute from "./components/common/AdminRoute";

function App() {
  useEffect(() => {
    setupSilentRefresh();
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } />

        <Route path="/statistika" element={
          <ProtectedRoute>
            <StatisticsPage />
          </ProtectedRoute>
        } />

        <Route path="/ugovaratelji" element={
          <ProtectedRoute>
            <ContractorsPage />
          </ProtectedRoute>
        } />

        <Route path="/ugovaratelji/:contractorId" element={
          <ProtectedRoute>
            <ContractorDetailsPage />
          </ProtectedRoute>
        } />

        <Route path="/ugovaratelji/:contractorId/uredi" element={
          <ProtectedRoute>
            <EditContractorPage />
          </ProtectedRoute>
        } />

        <Route path="/postavke" element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        } />

        <Route path="/b-skadenca" element={
          <ProtectedRoute>
            <BSkadencaPage />
          </ProtectedRoute>
        } />

        <Route path="/smece" element={
          <ProtectedRoute>
            <TrashPage />
          </ProtectedRoute>
        } />

        <Route path="/smece/:policyId" element={
          <ProtectedRoute>
            <DeletedPolicyDetailsPage />
          </ProtectedRoute>
        } />

        <Route path="/zaposlenici" element={
          <ProtectedRoute><AdminRoute>
            <EmployeesPage />
          </AdminRoute></ProtectedRoute>
        } />

        <Route path="/zaposlenici/novi" element={
          <ProtectedRoute><AdminRoute>
            <EmployeeFormPage />
          </AdminRoute></ProtectedRoute>
        } />

        <Route path="/zaposlenici/:employeeId/uredi" element={
          <ProtectedRoute><AdminRoute>
            <EmployeeFormPage />
          </AdminRoute></ProtectedRoute>
        } />

        <Route path="/zaposlenici/:employeeId" element={
          <ProtectedRoute><AdminRoute>
            <EmployeeDetailsPage />
          </AdminRoute></ProtectedRoute>
        } />

        <Route path="/dodaj-policu" element={
          <ProtectedRoute>
            <AddPolicyPage />
          </ProtectedRoute>
        } />

        <Route path="/police/:policyNumber" element={
          <ProtectedRoute>
            <PolicyDetailsPage />
          </ProtectedRoute>
        } />

        <Route path="/police/:policyNumber/uredi" element={
          <ProtectedRoute>
            <UpdatePolicyPage />
          </ProtectedRoute>
        } />

        <Route path="/police/:policyNumber/ugovaratelj/uredi" element={
          <ProtectedRoute>
            <EditContractorPage />
          </ProtectedRoute>
        } />

        <Route path="/police/:policyNumber/ugovaratelj" element={
          <ProtectedRoute>
            <ChangeContractorPage />
          </ProtectedRoute>
        } />

        <Route path="/police/:policyNumber/produzi" element={
          <ProtectedRoute>
            <ExtendPolicyPage />
          </ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
