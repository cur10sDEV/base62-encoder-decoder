/**
 * Base62 Encoder/Decoder
 * High-performance base62 encoding and decoding for JavaScript and Node.js
 */

/**
 * Character set used for base62 encoding
 * Contains: 0-9, a-z, A-Z
 */
const CHARACTERS =
  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

// Fast lookup using Uint8Array for O(1) character-to-value mapping
// Initialize with 255 (invalid marker) for all indices
const CHAR_MAP = new Uint8Array(256);
CHAR_MAP.fill(255);

// Fill in valid character mappings
for (let i = 0; i < 10; i++) CHAR_MAP["0".charCodeAt(0) + i] = i;
for (let i = 0; i < 26; i++) CHAR_MAP["a".charCodeAt(0) + i] = 10 + i;
for (let i = 0; i < 26; i++) CHAR_MAP["A".charCodeAt(0) + i] = 36 + i;

/**
 * Encodes a number to base62 string representation
 *
 * @param value - The number to encode (Number or BigInt). Must be non-negative.
 * @param base - The base to use (default: 62). Must be between 2 and 62.
 * @returns The encoded string in the specified base
 *
 * @throws {TypeError} If value is not a Number or BigInt
 * @throws {RangeError} If value is negative or base is out of range
 *
 * @example
 * ```typescript
 * encode(12345);           // Returns: "3d7"
 * encode(255, 16);         // Returns: "ff"
 * encode(BigInt("999999999999999999"), 62); // Handles large numbers
 * ```
 */
function encode(value: number | bigint, base = 62): string {
  if (!Number.isInteger(base) || base < 2 || base > CHARACTERS.length) {
    throw new RangeError(
      `base must be an integer between 2 and ${CHARACTERS.length}`
    );
  }

  // Support both Number and BigInt inputs. For Numbers, use Math.floor to
  // ensure we operate on integers; for BigInt use BigInt arithmetic.
  if (typeof value !== "number" && typeof value !== "bigint") {
    throw new TypeError("value must be a Number or BigInt");
  }

  if (
    (typeof value === "number" && value < 0) ||
    (typeof value === "bigint" && value < 0n)
  ) {
    throw new RangeError("value must be non-negative");
  }

  // Handle zero explicitly
  if (value === 0 || value === 0n) return CHARACTERS[0] as string;

  const digits = [];

  if (typeof value === "bigint") {
    const b = BigInt(base);
    let n = value;
    while (n > 0n) {
      const rem = Number(n % b); // base <= 62 so rem fits in Number
      digits.push(CHARACTERS[rem]);
      n = n / b;
    }
  } else {
    let n = Math.floor(value);
    while (n > 0) {
      digits.push(CHARACTERS[n % base]);
      n = Math.floor(n / base);
    }
  }

  // We collected least-significant digits first — reverse once and join.
  return digits.reverse().join("");
}

/**
 * Decodes a base62 string to a number
 *
 * @param str - The encoded string to decode
 * @param base - The base of the input string (default: 62). Must be between 2 and 62.
 * @returns The decoded number (Number if safe, BigInt otherwise)
 *
 * @throws {TypeError} If str is not a string
 * @throws {RangeError} If str contains invalid characters for the given base
 *
 * @example
 * ```typescript
 * decode("3d7");           // Returns: 12345
 * decode("ff", 16);        // Returns: 255
 * decode("aZl8N0y58M7", 62); // Returns: 9223372036854775807n (as BigInt)
 * ```
 */
function decode(str: String, base = 62): number | bigint {
  if (typeof str !== "string") throw new TypeError("str must be a string");
  if (!Number.isInteger(base) || base < 2 || base > CHARACTERS.length) {
    throw new RangeError(
      `base must be an integer between 2 and ${CHARACTERS.length}`
    );
  }

  const b = BigInt(base);
  let result = 0n;

  for (let i = 0; i < str.length; i++) {
    const charCode = str.charCodeAt(i);
    const val = CHAR_MAP[charCode] as number;
    if (val === 255 || val >= base) {
      throw new RangeError(`invalid character "${str[i]}" for base ${base}`);
    }
    result = result * b + BigInt(val);
  }

  const maxSafe = BigInt(Number.MAX_SAFE_INTEGER);
  if (result <= maxSafe) return Number(result);
  return result;
}

export { CHARACTERS, decode, encode };
