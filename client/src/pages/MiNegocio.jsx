import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function MiNegocio() {
  const { logout, prestadorId } = useAuth();
  const [perfil, setPerfil] = useState(null);
  const [servicios, setServicios] = useState([]);
  const [perfilError, setPerfilError] = useState(null);
  const [servicioError, setServicioError] = useState(null);
  const [nuevoServicio, setNuevoServicio] = useState({ nombre: "", duracion_minutos: "", precio: "" });
  const [editandoId, setEditandoId] = useState(null);
  const [edicion, setEdicion] = useState({ nombre: "", duracion_minutos: "", precio: "" });

  useEffect(() => {
    api.get("/perfil").then(setPerfil);
    api.get("/servicios").then(setServicios);
  }, []);

  async function guardarPerfil(e) {
    e.preventDefault();
    setPerfilError(null);
    try {
      const actualizado = await api.put("/perfil", {
        nombre_negocio: perfil.nombre_negocio,
        rubro: perfil.rubro,
        foto_url: perfil.foto_url,
      });
      setPerfil(actualizado);
    } catch (err) {
      setPerfilError(err.message);
    }
  }

  async function crearServicio(e) {
    e.preventDefault();
    setServicioError(null);
    try {
      const creado = await api.post("/servicios", {
        nombre: nuevoServicio.nombre,
        duracion_minutos: Number(nuevoServicio.duracion_minutos),
        precio: nuevoServicio.precio ? Number(nuevoServicio.precio) : null,
      });
      setServicios((s) => [...s, creado]);
      setNuevoServicio({ nombre: "", duracion_minutos: "", precio: "" });
    } catch (err) {
      setServicioError(err.message);
    }
  }

  function empezarEdicion(servicio) {
    setEditandoId(servicio.id);
    setEdicion({
      nombre: servicio.nombre,
      duracion_minutos: servicio.duracion_minutos,
      precio: servicio.precio ?? "",
    });
  }

  async function guardarEdicion(id) {
    setServicioError(null);
    try {
      const actualizado = await api.put(`/servicios/${id}`, {
        nombre: edicion.nombre,
        duracion_minutos: Number(edicion.duracion_minutos),
        precio: edicion.precio ? Number(edicion.precio) : null,
      });
      setServicios((s) => s.map((sv) => (sv.id === id ? actualizado : sv)));
      setEditandoId(null);
    } catch (err) {
      setServicioError(err.message);
    }
  }

  async function eliminarServicio(id) {
    setServicioError(null);
    try {
      await api.del(`/servicios/${id}`);
      setServicios((s) => s.filter((sv) => sv.id !== id));
    } catch (err) {
      setServicioError(err.message);
    }
  }

  if (!perfil) return <p>Cargando...</p>;

  return (
    <main>
      <h1>Mi negocio</h1>
      <button type="button" onClick={logout}>
        Cerrar sesión
      </button>
      <p>
        Link público: <Link to={`/negocios/${prestadorId}`}>/negocios/{prestadorId}</Link>
      </p>
      <p>
        <Link to="/disponibilidad">Configurar disponibilidad y bloqueos</Link>
      </p>
      <p>
        <Link to="/calendario">Ver calendario</Link>
      </p>

      <section>
        <h2>Perfil</h2>
        <form onSubmit={guardarPerfil}>
          <label>
            Nombre del negocio
            <input
              value={perfil.nombre_negocio || ""}
              onChange={(e) => setPerfil({ ...perfil, nombre_negocio: e.target.value })}
              required
            />
          </label>
          <label>
            Rubro
            <input
              value={perfil.rubro || ""}
              onChange={(e) => setPerfil({ ...perfil, rubro: e.target.value })}
              required
            />
          </label>
          <label>
            URL de foto
            <input
              value={perfil.foto_url || ""}
              onChange={(e) => setPerfil({ ...perfil, foto_url: e.target.value })}
            />
          </label>
          {perfilError && <p role="alert">{perfilError}</p>}
          <button type="submit">Guardar perfil</button>
        </form>
      </section>

      <section>
        <h2>Servicios</h2>
        <ul>
          {servicios.map((s) =>
            editandoId === s.id ? (
              <li key={s.id}>
                <input
                  value={edicion.nombre}
                  onChange={(e) => setEdicion({ ...edicion, nombre: e.target.value })}
                />
                <input
                  type="number"
                  value={edicion.duracion_minutos}
                  onChange={(e) => setEdicion({ ...edicion, duracion_minutos: e.target.value })}
                />
                <input
                  type="number"
                  value={edicion.precio}
                  onChange={(e) => setEdicion({ ...edicion, precio: e.target.value })}
                />
                <button type="button" onClick={() => guardarEdicion(s.id)}>
                  Guardar
                </button>
                <button type="button" onClick={() => setEditandoId(null)}>
                  Cancelar
                </button>
              </li>
            ) : (
              <li key={s.id}>
                {s.nombre} — {s.duracion_minutos} min
                {s.precio ? ` — $${s.precio}` : ""}
                <button type="button" onClick={() => empezarEdicion(s)}>
                  Editar
                </button>
                <button type="button" onClick={() => eliminarServicio(s.id)}>
                  Eliminar
                </button>
              </li>
            )
          )}
        </ul>

        <form onSubmit={crearServicio}>
          <label>
            Nombre
            <input
              value={nuevoServicio.nombre}
              onChange={(e) => setNuevoServicio({ ...nuevoServicio, nombre: e.target.value })}
              required
            />
          </label>
          <label>
            Duración (min)
            <input
              type="number"
              value={nuevoServicio.duracion_minutos}
              onChange={(e) =>
                setNuevoServicio({ ...nuevoServicio, duracion_minutos: e.target.value })
              }
              required
            />
          </label>
          <label>
            Precio (opcional)
            <input
              type="number"
              value={nuevoServicio.precio}
              onChange={(e) => setNuevoServicio({ ...nuevoServicio, precio: e.target.value })}
            />
          </label>
          {servicioError && <p role="alert">{servicioError}</p>}
          <button type="submit">Agregar servicio</button>
        </form>
      </section>
    </main>
  );
}
