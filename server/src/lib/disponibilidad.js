function aMinutos(horaStr) {
  const [h, m] = horaStr.split(":").map(Number);
  return h * 60 + m;
}

function aHoraStr(minutos) {
  const h = String(Math.floor(minutos / 60)).padStart(2, "0");
  const m = String(minutos % 60).padStart(2, "0");
  return `${h}:${m}`;
}

function seSuperponen(inicioA, finA, inicioB, finB) {
  return inicioA < finB && inicioB < finA;
}

/**
 * Calcula los horarios de inicio disponibles para un servicio en un día dado.
 * Todas las horas son strings "HH:MM"/"HH:MM:SS"; se trabaja en minutos desde medianoche.
 */
export function calcularSlotsDisponibles({
  ventanas, // [{ hora_inicio, hora_fin }] de disponibilidad_semanal para ese día
  bloqueos, // [{ hora_inicio, hora_fin }] del día (hora_inicio/hora_fin null = día completo)
  turnosOcupados, // [{ hora_inicio, hora_fin }] de turnos ya reservados (no cancelados)
  duracionMinutos,
}) {
  if (bloqueos.some((b) => b.hora_inicio === null)) {
    return [];
  }

  const bloqueosRango = bloqueos.map((b) => [aMinutos(b.hora_inicio), aMinutos(b.hora_fin)]);
  const ocupadosRango = turnosOcupados.map((t) => [aMinutos(t.hora_inicio), aMinutos(t.hora_fin)]);

  const slots = [];
  for (const ventana of ventanas) {
    const inicioVentana = aMinutos(ventana.hora_inicio);
    const finVentana = aMinutos(ventana.hora_fin);

    for (let inicio = inicioVentana; inicio + duracionMinutos <= finVentana; inicio += duracionMinutos) {
      const fin = inicio + duracionMinutos;
      const bloqueado = bloqueosRango.some(([bi, bf]) => seSuperponen(inicio, fin, bi, bf));
      const ocupado = ocupadosRango.some(([oi, of_]) => seSuperponen(inicio, fin, oi, of_));
      if (!bloqueado && !ocupado) {
        slots.push(aHoraStr(inicio));
      }
    }
  }

  return slots;
}
