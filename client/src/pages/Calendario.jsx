import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api.js";

function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

function TurnoItem({ turno, onCambio }) {
  const [error, setError] = useState(null);

  async function accion(tipo) {
    setError(null);
    try {
      await api.post(`/mis-turnos/${turno.id}/${tipo}`, {});
      onCambio();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <li>
      {turno.hora_inicio.slice(0, 5)} — {turno.cliente_nombre} — {turno.servicio_nombre} ({turno.estado})
      {turno.estado === "confirmado" && (
        <>
          <button type="button" onClick={() => accion("completar")}>
            Completar
          </button>
          <button type="button" onClick={() => accion("cancelar")}>
            Cancelar
          </button>
        </>
      )}
      {error && <span role="alert"> {error}</span>}
    </li>
  );
}

export default function Calendario() {
  const [vista, setVista] = useState("dia");
  const [fecha, setFecha] = useState(hoyISO());
  const [datos, setDatos] = useState(null);

  function cargar() {
    api.get(`/calendario?vista=${vista}&fecha=${fecha}`).then(setDatos);
  }

  useEffect(() => {
    setDatos(null);
    cargar();
  }, [vista, fecha]);

  return (
    <main>
      <h1>Calendario</h1>
      <p>
        <Link to="/mi-negocio">Volver a Mi negocio</Link>
      </p>

      <label>
        Vista
        <select value={vista} onChange={(e) => setVista(e.target.value)}>
          <option value="dia">Día</option>
          <option value="semana">Semana</option>
        </select>
      </label>
      <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />

      {!datos?.turnos && !datos?.dias && <p>Cargando...</p>}

      {datos?.turnos && (
        <ul>
          {datos.turnos.length === 0 && <li>Sin turnos para este día.</li>}
          {datos.turnos.map((t) => (
            <TurnoItem key={t.id} turno={t} onCambio={cargar} />
          ))}
        </ul>
      )}

      {datos?.dias && (
        <div>
          {datos.dias.map((dia) => (
            <div key={dia.fecha}>
              <h3>{dia.fecha}</h3>
              <ul>
                {dia.turnos.length === 0 && <li>Sin turnos.</li>}
                {dia.turnos.map((t) => (
                  <TurnoItem key={t.id} turno={t} onCambio={cargar} />
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
