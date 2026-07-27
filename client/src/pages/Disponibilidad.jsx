import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api.js";

const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

function reglasIniciales() {
  return DIAS.map((_, dia_semana) => ({
    dia_semana,
    activo: false,
    hora_inicio: "09:00",
    hora_fin: "18:00",
  }));
}

export default function Disponibilidad() {
  const [reglas, setReglas] = useState(reglasIniciales());
  const [guardando, setGuardando] = useState(false);
  const [bloqueos, setBloqueos] = useState([]);
  const [nuevoBloqueo, setNuevoBloqueo] = useState({ fecha: "", diaCompleto: true, hora_inicio: "", hora_fin: "" });
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get("/disponibilidad").then((existentes) => {
      setReglas((base) =>
        base.map((r) => {
          const existente = existentes.find((e) => e.dia_semana === r.dia_semana);
          return existente
            ? { ...r, activo: true, hora_inicio: existente.hora_inicio.slice(0, 5), hora_fin: existente.hora_fin.slice(0, 5) }
            : r;
        })
      );
    });
    api.get("/bloqueos").then(setBloqueos);
  }, []);

  function actualizarRegla(dia_semana, cambios) {
    setReglas((rs) => rs.map((r) => (r.dia_semana === dia_semana ? { ...r, ...cambios } : r)));
  }

  async function guardarDisponibilidad(e) {
    e.preventDefault();
    setError(null);
    setGuardando(true);
    try {
      const activas = reglas
        .filter((r) => r.activo)
        .map(({ dia_semana, hora_inicio, hora_fin }) => ({ dia_semana, hora_inicio, hora_fin }));
      await api.put("/disponibilidad", { reglas: activas });
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  async function crearBloqueo(e) {
    e.preventDefault();
    setError(null);
    try {
      const body = { fecha: nuevoBloqueo.fecha };
      if (!nuevoBloqueo.diaCompleto) {
        body.hora_inicio = nuevoBloqueo.hora_inicio;
        body.hora_fin = nuevoBloqueo.hora_fin;
      }
      const creado = await api.post("/bloqueos", body);
      setBloqueos((b) => [...b, creado]);
      setNuevoBloqueo({ fecha: "", diaCompleto: true, hora_inicio: "", hora_fin: "" });
    } catch (err) {
      setError(err.message);
    }
  }

  async function eliminarBloqueo(id) {
    await api.del(`/bloqueos/${id}`);
    setBloqueos((b) => b.filter((bl) => bl.id !== id));
  }

  return (
    <main>
      <h1>Disponibilidad</h1>
      <p>
        <Link to="/mi-negocio">Volver a Mi negocio</Link>
      </p>

      <section>
        <h2>Horario semanal</h2>
        <form onSubmit={guardarDisponibilidad}>
          {reglas.map((r) => (
            <div key={r.dia_semana}>
              <label>
                <input
                  type="checkbox"
                  checked={r.activo}
                  onChange={(e) => actualizarRegla(r.dia_semana, { activo: e.target.checked })}
                />
                {DIAS[r.dia_semana]}
              </label>
              {r.activo && (
                <>
                  <input
                    type="time"
                    value={r.hora_inicio}
                    onChange={(e) => actualizarRegla(r.dia_semana, { hora_inicio: e.target.value })}
                  />
                  <input
                    type="time"
                    value={r.hora_fin}
                    onChange={(e) => actualizarRegla(r.dia_semana, { hora_fin: e.target.value })}
                  />
                </>
              )}
            </div>
          ))}
          {error && <p role="alert">{error}</p>}
          <button type="submit" disabled={guardando}>
            Guardar horario semanal
          </button>
        </form>
      </section>

      <section>
        <h2>Bloqueos puntuales</h2>
        <ul>
          {bloqueos.map((b) => (
            <li key={b.id}>
              {b.fecha} {b.hora_inicio ? `${b.hora_inicio.slice(0, 5)}–${b.hora_fin.slice(0, 5)}` : "(día completo)"}
              <button type="button" onClick={() => eliminarBloqueo(b.id)}>
                Eliminar
              </button>
            </li>
          ))}
        </ul>
        <form onSubmit={crearBloqueo}>
          <label>
            Fecha
            <input
              type="date"
              value={nuevoBloqueo.fecha}
              onChange={(e) => setNuevoBloqueo({ ...nuevoBloqueo, fecha: e.target.value })}
              required
            />
          </label>
          <label>
            <input
              type="checkbox"
              checked={nuevoBloqueo.diaCompleto}
              onChange={(e) => setNuevoBloqueo({ ...nuevoBloqueo, diaCompleto: e.target.checked })}
            />
            Día completo
          </label>
          {!nuevoBloqueo.diaCompleto && (
            <>
              <input
                type="time"
                value={nuevoBloqueo.hora_inicio}
                onChange={(e) => setNuevoBloqueo({ ...nuevoBloqueo, hora_inicio: e.target.value })}
                required
              />
              <input
                type="time"
                value={nuevoBloqueo.hora_fin}
                onChange={(e) => setNuevoBloqueo({ ...nuevoBloqueo, hora_fin: e.target.value })}
                required
              />
            </>
          )}
          <button type="submit">Agregar bloqueo</button>
        </form>
      </section>
    </main>
  );
}
