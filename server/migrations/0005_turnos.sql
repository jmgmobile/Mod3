CREATE TABLE turnos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prestador_id UUID NOT NULL REFERENCES prestadores(id) ON DELETE CASCADE,
  servicio_id UUID NOT NULL REFERENCES servicios(id),
  cliente_nombre TEXT NOT NULL,
  cliente_telefono TEXT NOT NULL,
  fecha DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  estado TEXT NOT NULL DEFAULT 'confirmado' CHECK (estado IN ('confirmado', 'cancelado', 'completado')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX turnos_prestador_id_fecha_idx ON turnos (prestador_id, fecha);

-- Evita doble-booking del mismo horario para el mismo prestador (ignora turnos ya cancelados).
CREATE UNIQUE INDEX turnos_sin_doble_booking_idx
  ON turnos (prestador_id, fecha, hora_inicio)
  WHERE estado <> 'cancelado';
