import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../lib/api.js";

function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function ReservarTurno() {
  const { negocioId, servicioId } = useParams();
  const [servicio, setServicio] = useState(null);
  const [fecha, setFecha] = useState(hoyISO());
  const [slots, setSlots] = useState(null);
  const [horario, setHorario] = useState(null);
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [error, setError] = useState(null);
  const [turnoConfirmado, setTurnoConfirmado] = useState(null);

  useEffect(() => {
    api.get(`/negocios/${negocioId}`).then((negocio) => {
      setServicio(negocio.servicios.find((s) => s.id === servicioId) || null);
    });
  }, [negocioId, servicioId]);

  useEffect(() => {
    if (!fecha) return;
    setHorario(null);
    setSlots(null);
    api
      .get(`/negocios/${negocioId}/disponibilidad?servicio_id=${servicioId}&fecha=${fecha}`)
      .then((data) => setSlots(data.slots));
  }, [negocioId, servicioId, fecha]);

  async function confirmarReserva(e) {
    e.preventDefault();
    setError(null);
    try {
      const turno = await api.post(`/negocios/${negocioId}/turnos`, {
        servicio_id: servicioId,
        fecha,
        hora_inicio: horario,
        cliente_nombre: nombre,
        cliente_telefono: telefono,
      });
      setTurnoConfirmado(turno);
    } catch (err) {
      setError(err.message);
    }
  }

  if (turnoConfirmado) {
    return (
      <main>
        <h1>Reserva confirmada</h1>
        <p>
          {servicio?.nombre} el {turnoConfirmado.fecha} a las {turnoConfirmado.hora_inicio.slice(0, 5)}
        </p>
        <p>
          Podés gestionar tu turno en{" "}
          <Link to={`/reserva/${turnoConfirmado.id}`}>este link</Link>. Guardalo para cancelar si lo necesitás.
        </p>
      </main>
    );
  }

  return (
    <main>
      <h1>Reservar {servicio ? `— ${servicio.nombre}` : ""}</h1>

      <section>
        <h2>1. Elegí una fecha</h2>
        <input type="date" min={hoyISO()} value={fecha} onChange={(e) => setFecha(e.target.value)} />
      </section>

      <section>
        <h2>2. Elegí un horario</h2>
        {slots === null && <p>Cargando horarios...</p>}
        {slots?.length === 0 && <p>No hay horarios disponibles ese día.</p>}
        <ul>
          {slots?.map((s) => (
            <li key={s}>
              <button type="button" onClick={() => setHorario(s)} aria-pressed={horario === s}>
                {s}
              </button>
            </li>
          ))}
        </ul>
      </section>

      {horario && (
        <section>
          <h2>3. Tus datos</h2>
          <form onSubmit={confirmarReserva}>
            <label>
              Nombre
              <input value={nombre} onChange={(e) => setNombre(e.target.value)} required />
            </label>
            <label>
              Teléfono
              <input value={telefono} onChange={(e) => setTelefono(e.target.value)} required />
            </label>
            {error && <p role="alert">{error}</p>}
            <button type="submit">Confirmar reserva</button>
          </form>
        </section>
      )}
    </main>
  );
}
