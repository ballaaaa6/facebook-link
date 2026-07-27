import type {
  OfficeRectangle,
  OfficeWorkstation,
} from "../officeTypes";

export function workstationSeatIntegerFields(station: OfficeWorkstation) {
  if (!station.seatCollision) return [];
  return [
    { id: `${station.id}.seatCollision.x`, value: station.seatCollision.x },
    { id: `${station.id}.seatCollision.y`, value: station.seatCollision.y },
    { id: `${station.id}.seatCollision.width`, value: station.seatCollision.width },
    { id: `${station.id}.seatCollision.height`, value: station.seatCollision.height },
  ];
}

export function workstationOccupiedAreas(workstations: OfficeWorkstation[]) {
  return workstations.flatMap((station): Array<{ id: string; rect: OfficeRectangle }> => [
    { id: `workstation:${station.id}`, rect: station.collision },
    ...(station.seatCollision
      ? [{ id: `workstation-seat:${station.id}`, rect: station.seatCollision }]
      : []),
  ]);
}
