export interface NavigationBounds {
  readonly minX: number;
  readonly maxX: number;
  readonly minY: number;
  readonly maxY: number;
}

export interface NavigationInput {
  readonly start: string;
  readonly goals: readonly string[];
  readonly bounds: NavigationBounds;
  readonly obstacles: readonly string[];
}

interface Cell {
  readonly x: number;
  readonly y: number;
}

const directions: readonly Cell[] = [
  { x: 0, y: -1 },
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
];

function compare(left: string, right: string): number {
  const length = Math.min(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    const difference = left.charCodeAt(index) - right.charCodeAt(index);
    if (difference !== 0) return difference;
  }
  return left.length - right.length;
}

export function parseNavigationCell(value: string): Cell | undefined {
  const match = /^(-?\d+),(-?\d+)$/u.exec(value);
  if (match === null) return undefined;
  const x = Number(match[1]);
  const y = Number(match[2]);
  return Number.isSafeInteger(x) && Number.isSafeInteger(y) ? { x, y } : undefined;
}

export function navigationCellKey(cell: Cell): string {
  return `${cell.x},${cell.y}`;
}

function inBounds(cell: Cell, bounds: NavigationBounds): boolean {
  return cell.x >= bounds.minX && cell.x <= bounds.maxX
    && cell.y >= bounds.minY && cell.y <= bounds.maxY;
}

function distance(left: Cell, right: Cell): number {
  return Math.abs(left.x - right.x) + Math.abs(left.y - right.y);
}

function reconstruct(cameFrom: ReadonlyMap<string, string>, current: string): readonly string[] {
  const path = [current];
  let cursor = current;
  while (cameFrom.has(cursor)) {
    cursor = cameFrom.get(cursor)!;
    path.push(cursor);
  }
  return path.reverse();
}

/** Deterministic four-way A* over declared cells and obstacles only. */
export function planCardinalRoute(input: NavigationInput): readonly string[] | undefined {
  const start = parseNavigationCell(input.start);
  const goals = input.goals.map(parseNavigationCell).filter((value): value is Cell => value !== undefined);
  if (start === undefined || goals.length === 0 || !inBounds(start, input.bounds)) return undefined;
  const obstacleSet = new Set(input.obstacles);
  if (obstacleSet.has(input.start)) return undefined;
  const goalKeys = new Set(goals.filter((goal) => inBounds(goal, input.bounds)).map(navigationCellKey));
  if (goalKeys.size === 0) return undefined;
  const open = [input.start];
  const cameFrom = new Map<string, string>();
  const cost = new Map<string, number>([[input.start, 0]]);
  const goalDistance = (value: string): number => {
    const cell = parseNavigationCell(value)!;
    return Math.min(...goals.map((goal) => distance(cell, goal)));
  };
  while (open.length > 0) {
    open.sort((left, right) => {
      const leftCost = (cost.get(left) ?? Number.MAX_SAFE_INTEGER) + goalDistance(left);
      const rightCost = (cost.get(right) ?? Number.MAX_SAFE_INTEGER) + goalDistance(right);
      return leftCost - rightCost || goalDistance(left) - goalDistance(right) || compare(left, right);
    });
    const current = open.shift()!;
    if (goalKeys.has(current)) return reconstruct(cameFrom, current);
    const currentCell = parseNavigationCell(current)!;
    for (const direction of directions) {
      const nextCell = { x: currentCell.x + direction.x, y: currentCell.y + direction.y };
      const next = navigationCellKey(nextCell);
      if (!inBounds(nextCell, input.bounds) || obstacleSet.has(next)) continue;
      const nextCost = (cost.get(current) ?? 0) + 1;
      if (nextCost >= (cost.get(next) ?? Number.MAX_SAFE_INTEGER)) continue;
      cost.set(next, nextCost);
      cameFrom.set(next, current);
      if (!open.includes(next)) open.push(next);
    }
  }
  return undefined;
}
