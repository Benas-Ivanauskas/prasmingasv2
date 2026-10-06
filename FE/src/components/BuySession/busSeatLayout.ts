import type { Seat } from "../../types/trip";

interface BusMapRow {
  rowNumber: number;
  left: Seat[];
  // Bonus seat(s) squeezed into the aisle on the row that ends up absorbing
  // the remainder — e.g. a 53-seat bus is 12 normal rows of 4 (with 2 of
  // those rows missing a side to an amenity) + this row's own 4 + 1 extra.
  middle: Seat[];
  right: Seat[];
  leftLabel?: string;
  rightLabel?: string;
}

interface BusAmenity {
  row: number;
  side: "left" | "right";
  label: string;
}

// Fixed for now — every bus template gets a restroom and a mid-bus exit at
// the same two rows, regardless of overall size, for a consistent look
// across the 48/49/52/53 seat configurations. Revisit if a future bus size
// needs these placed differently.
const DEFAULT_AMENITIES: BusAmenity[] = [
  { row: 7, side: "right", label: "TUALETAS" },
  { row: 8, side: "right", label: "VIDURINIS IŠĖJIMAS" },
];

function getRowCapacity(rowNumber: number) {
  const leftAmenity = DEFAULT_AMENITIES.find((a) => a.row === rowNumber && a.side === "left");
  const rightAmenity = DEFAULT_AMENITIES.find((a) => a.row === rowNumber && a.side === "right");

  return {
    leftCap: leftAmenity ? 0 : 2,
    rightCap: rightAmenity ? 0 : 2,
    leftLabel: leftAmenity?.label,
    rightLabel: rightAmenity?.label,
  };
}

// Builds a standard coach-bus seat map for ANY seat count, numbering seats
// sequentially row by row (left pair, then right pair), with a restroom and
// a mid-bus exit occupying the right side of rows 7 and 8. Whichever row
// ends up holding the tail end of the count (after accounting for the two
// amenity rows having only half their normal capacity) absorbs the 1-3
// leftover seats as bonus "middle" seats rather than spinning up a near-
// empty extra row — this is what makes the same function correctly lay out
// a 48-, 49-, 52-, or 53-seat bus with no per-size code.
// A flat "14" told a passenger nothing about where that seat actually is —
// real coach seats are labeled row + letter (left pair A/B, right pair
// C/D, continuing E/F/G for the bonus seats on the row that absorbs the
// remainder). Mirrors buildBusSeatMap's own row/cursor logic exactly, so
// the label always matches whatever row the seat actually renders in.
const SEAT_LETTERS = ["A", "B", "C", "D", "E", "F", "G"];

export function generateBusSeatLabels(totalSeats: number): string[] {
  const labels: string[] = [];
  let cursor = 0;
  let rowNumber = 1;

  while (cursor < totalSeats) {
    const { leftCap, rightCap } = getRowCapacity(rowNumber);
    const rowCapacity = leftCap + rightCap;
    const remainingAfterThisRow = totalSeats - cursor - rowCapacity;
    const isFinalRow = remainingAfterThisRow < 4;
    let letterIndex = 0;

    for (let i = 0; i < leftCap && cursor < totalSeats; i++, cursor++) {
      labels.push(`${rowNumber}${SEAT_LETTERS[letterIndex++]}`);
    }
    for (let i = 0; i < rightCap && cursor < totalSeats; i++, cursor++) {
      labels.push(`${rowNumber}${SEAT_LETTERS[letterIndex++]}`);
    }
    if (isFinalRow) {
      while (cursor < totalSeats) {
        labels.push(`${rowNumber}${SEAT_LETTERS[letterIndex++]}`);
        cursor++;
      }
    }

    rowNumber++;
  }

  return labels;
}

export function buildBusSeatMap(seats: Seat[]): BusMapRow[] {
  const rows: BusMapRow[] = [];
  let cursor = 0;
  let rowNumber = 1;

  while (cursor < seats.length) {
    const { leftCap, rightCap, leftLabel, rightLabel } = getRowCapacity(rowNumber);
    const rowCapacity = leftCap + rightCap;
    const remainingAfterThisRow = seats.length - cursor - rowCapacity;
    const isFinalRow = remainingAfterThisRow < 4;

    const left = leftCap > 0 ? seats.slice(cursor, cursor + leftCap) : [];
    cursor += left.length;

    const right = rightCap > 0 ? seats.slice(cursor, cursor + rightCap) : [];
    cursor += right.length;

    const middle = isFinalRow ? seats.slice(cursor) : [];
    cursor += middle.length;

    rows.push({ rowNumber, left, middle, right, leftLabel, rightLabel });
    rowNumber++;
  }

  return rows;
}
