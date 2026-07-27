CREATE TABLE disponibilidad_semanal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prestador_id UUID NOT NULL REFERENCES prestadores(id) ON DELETE CASCADE,
  dia_semana SMALLINT NOT NULL CHECK (dia_semana BETWEEN 0 AND 6), -- 0=domingo ... 6=sábado
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  CHECK (hora_fin > hora_inicio)
);

CREATE INDEX disponibilidad_semanal_prestador_id_idx ON disponibilidad_semanal (prestador_id);
