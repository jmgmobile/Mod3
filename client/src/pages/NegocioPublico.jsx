import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../lib/api.js";

export default function NegocioPublico() {
  const { negocioId } = useParams();
  const [negocio, setNegocio] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .get(`/negocios/${negocioId}`)
      .then(setNegocio)
      .catch((err) => setError(err.message));
  }, [negocioId]);

  if (error) return <p role="alert">{error}</p>;
  if (!negocio) return <p>Cargando...</p>;

  return (
    <main>
      {negocio.foto_url && <img src={negocio.foto_url} alt={negocio.nombre_negocio} width={120} />}
      <h1>{negocio.nombre_negocio}</h1>
      <p>{negocio.rubro}</p>

      <h2>Servicios</h2>
      <ul>
        {negocio.servicios.map((s) => (
          <li key={s.id}>
            <Link to={`/negocios/${negocioId}/reservar/${s.id}`}>
              {s.nombre} — {s.duracion_minutos} min{s.precio ? ` — $${s.precio}` : ""}
            </Link>
          </li>
        ))}
      </ul>
      {negocio.servicios.length === 0 && <p>Este negocio todavía no cargó servicios.</p>}
    </main>
  );
}
