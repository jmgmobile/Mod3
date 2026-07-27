import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute.jsx";
import Registro from "./pages/Registro.jsx";
import Login from "./pages/Login.jsx";
import MiNegocio from "./pages/MiNegocio.jsx";
import Disponibilidad from "./pages/Disponibilidad.jsx";
import NegocioPublico from "./pages/NegocioPublico.jsx";
import ReservarTurno from "./pages/ReservarTurno.jsx";
import GestionReserva from "./pages/GestionReserva.jsx";
import Calendario from "./pages/Calendario.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/registro" element={<Registro />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/mi-negocio"
        element={
          <ProtectedRoute>
            <MiNegocio />
          </ProtectedRoute>
        }
      />
      <Route
        path="/disponibilidad"
        element={
          <ProtectedRoute>
            <Disponibilidad />
          </ProtectedRoute>
        }
      />
      <Route
        path="/calendario"
        element={
          <ProtectedRoute>
            <Calendario />
          </ProtectedRoute>
        }
      />
      <Route path="/negocios/:negocioId" element={<NegocioPublico />} />
      <Route path="/negocios/:negocioId/reservar/:servicioId" element={<ReservarTurno />} />
      <Route path="/reserva/:turnoId" element={<GestionReserva />} />
    </Routes>
  );
}
