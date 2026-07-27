import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../lib/api.js";

export default function GestionReserva() {
  const { turnoId } = useParams();
  const [turno, setTurno] = useState(null);
  const [error, setError] = useState(null);
  const [cancelando, setCancelando] = useState(false);

  function cargar() {
    api
      .get(`/turnos/${turnoId}`)
      .then(setTurno)
      .catch((err) => setError(err.message));
  }

  useEffect(cargar, [turnoId]);

  async function cancelar() {
    setError(null);
    setCancelando(true);
    try {
      await api.post(`/turnos/${turnoId}/cancelar`, {});
      cargar();
    } catch (err) {
      setError(err.message);
    } finally {
      setCancelando(false);
    }
  }

  if (error && !turno) return <p role="alert">{error}</p>;
  if (!turno) return <p>Cargando...</p>;

  return (
    <main>
      <h1>Tu turno</h1>
      <p>{turno.nombre_negocio}</p>
      <p>{turno.servicio_nombre}</p>
      <p>
        {turno.fecha} a las {turno.hora_inicio.slice(0, 5)}
      </p>
      <p>Estado: {turno.estado}</p>

      {turno.estado === "confirmado" && (
        <>
          <button type="button" onClick={cancelar} disabled={cancelando}>
            Cancelar turno
          </button>
          {error && <p role="alert">{error}</p>}
        </>
      )}
    </main>
  );
}
