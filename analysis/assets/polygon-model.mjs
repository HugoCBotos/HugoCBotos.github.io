/** Unit-circle geometry shared by the drawing and its numerical readouts. */
export function inscribedPolygon(n) {
  if (!Number.isInteger(n) || n < 2 || n > 12) {
    throw new RangeError('n must be an integer between 2 and 12.');
  }
  const sides = 2 ** n;
  const angle = 2 * Math.PI / sides;
  const vertices = Array.from({ length: sides }, (_, i) => {
    const theta = i * angle - angle / 2;
    return [Math.cos(theta), Math.sin(theta)];
  });
  return {
    n, sides, angle, vertices,
    triangle: [[0, 0], vertices[0], vertices[1]],
    area: sides * Math.sin(angle) / 2,
  };
}
