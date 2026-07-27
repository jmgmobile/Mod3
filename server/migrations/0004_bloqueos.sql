CREATE TABLE bloqueos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prestador_id UUID NOT NULL REFERENCES prestadores(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  hora_inicio TIME, -- NULL junto con hora_fin = día completo bloqueado
  hora_fin TIME,
  CHECK (
    (hora_inicio IS NULL AND hora_fin IS NULL)
    OR (hora_inicio IS NOT NULL AND hora_fin IS NOT NULL AND hora_fin > hora_inicio)
  )
);

CREATE INDEX bloqueos_prestador_id_fecha_idx ON bloqueos (prestador_id, fecha);
