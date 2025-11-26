import { describe, expect, test } from "vitest";
import { CHARACTERS, decode, encode } from "../index.js";

describe("Base62 Encoder/Decoder", () => {
  describe("encode", () => {
    describe("Basic Functionality", () => {
      test("should encode 0 to '0'", () => {
        expect(encode(0)).toBe("0");
      });

      test("should encode 1 to '1'", () => {
        expect(encode(1)).toBe("1");
      });

      test("should encode 61 to 'Z' (last single digit)", () => {
        expect(encode(61)).toBe("Z");
      });

      test("should encode 62 to '10' (first two digits)", () => {
        expect(encode(62)).toBe("10");
      });

      test("should encode small numbers correctly", () => {
        expect(encode(10)).toBe("a");
        expect(encode(35)).toBe("z");
        expect(encode(36)).toBe("A");
      });

      test("should encode medium numbers correctly", () => {
        expect(encode(12345)).toBe("3d7");
        expect(encode(255)).toBe("47");
        expect(encode(1024)).toBe("gw");
      });

      test("should encode large numbers correctly", () => {
        expect(encode(1000000)).toBe("4c92");
        expect(encode(9999999)).toBe("FXsj");
        expect(encode(99999999)).toBe("6LAzd");
      });

      test("should encode Number.MAX_SAFE_INTEGER", () => {
        const maxSafe = Number.MAX_SAFE_INTEGER; // 9007199254740991
        const encoded = encode(maxSafe);
        expect(typeof encoded).toBe("string");
        expect(encoded.length).toBe(9);
        expect(encoded).toBe("FfGNdXsE7");
      });
    });

    describe("BigInt Support", () => {
      test("should encode BigInt(0)", () => {
        expect(encode(BigInt(0))).toBe("0");
      });

      test("should encode small BigInt values", () => {
        expect(encode(BigInt(123))).toBe("1Z");
        expect(encode(BigInt(999))).toBe("g7");
      });

      test("should encode large BigInt values beyond Number.MAX_SAFE_INTEGER", () => {
        const bigNum = BigInt("123456789012345678901234567890");
        const encoded = encode(bigNum);
        expect(typeof encoded).toBe("string");
        expect(encoded.length).toBeGreaterThan(0);
      });

      test("should encode very large BigInt correctly", () => {
        const bigNum = BigInt("999999999999999999999999999999");
        const encoded = encode(bigNum);
        expect(typeof encoded).toBe("string");
        // Should have more digits than MAX_SAFE_INTEGER encoding
        expect(encoded.length).toBeGreaterThan(11);
      });

      test("should handle BigInt(Number.MAX_SAFE_INTEGER)", () => {
        const bigNum = BigInt(Number.MAX_SAFE_INTEGER);
        expect(encode(bigNum)).toBe("FfGNdXsE7");
      });
    });

    describe("Custom Bases", () => {
      test("should encode in base 2 (binary)", () => {
        expect(encode(8, 2)).toBe("1000");
        expect(encode(15, 2)).toBe("1111");
        expect(encode(0, 2)).toBe("0");
      });

      test("should encode in base 16 (hexadecimal)", () => {
        expect(encode(255, 16)).toBe("ff");
        expect(encode(4095, 16)).toBe("fff");
        expect(encode(256, 16)).toBe("100");
      });

      test("should encode in base 36 (alphanumeric)", () => {
        expect(encode(1295, 36)).toBe("zz");
        expect(encode(1296, 36)).toBe("100");
      });

      test("should encode in base 10 (decimal)", () => {
        expect(encode(12345, 10)).toBe("12345");
        expect(encode(999, 10)).toBe("999");
      });

      test("should encode in all supported bases", () => {
        const num = 1000;
        for (let base = 2; base <= 62; base++) {
          const encoded = encode(num, base);
          expect(typeof encoded).toBe("string");
          expect(encoded.length).toBeGreaterThan(0);
          // Verify all chars are valid for the base
          for (const char of encoded) {
            expect(CHARACTERS.indexOf(char)).toBeLessThan(base);
          }
        }
      });
    });

    describe("Edge Cases", () => {
      test("should handle consecutive powers of 62", () => {
        expect(encode(62)).toBe("10");
        expect(encode(3844)).toBe("100"); // 62^2
        expect(encode(238328)).toBe("1000"); // 62^3
      });

      test("should encode all valid single characters (0-61)", () => {
        for (let i = 0; i < 62; i++) {
          const encoded = encode(i);
          expect(encoded).toBe(CHARACTERS[i]);
        }
      });

      test("should produce different outputs for different inputs", () => {
        const encodings = new Set<string>();
        for (let i = 0; i < 1000; i++) {
          encodings.add(encode(i));
        }
        expect(encodings.size).toBe(1000); // All unique
      });
    });

    describe("Error Handling", () => {
      test("should throw TypeError for non-numeric input", () => {
        expect(() => encode("123" as any)).toThrow(TypeError);
        expect(() => encode(null as any)).toThrow(TypeError);
        expect(() => encode(undefined as any)).toThrow(TypeError);
        expect(() => encode({} as any)).toThrow(TypeError);
      });

      test("should throw RangeError for negative numbers", () => {
        expect(() => encode(-1)).toThrow(RangeError);
        expect(() => encode(-1000)).toThrow(RangeError);
        expect(() => encode(BigInt(-1))).toThrow(RangeError);
      });

      test("should throw RangeError for invalid base", () => {
        expect(() => encode(100, 1)).toThrow(RangeError);
        expect(() => encode(100, 0)).toThrow(RangeError);
        expect(() => encode(100, -1)).toThrow(RangeError);
        expect(() => encode(100, 63)).toThrow(RangeError);
        expect(() => encode(100, 100)).toThrow(RangeError);
      });

      test("should throw RangeError for non-integer base", () => {
        expect(() => encode(100, 2.5)).toThrow(RangeError);
        expect(() => encode(100, 16.7)).toThrow(RangeError);
      });
    });
  });

  describe("decode", () => {
    describe("Basic Functionality", () => {
      test("should decode '0' to 0", () => {
        expect(decode("0")).toBe(0);
      });

      test("should decode '1' to 1", () => {
        expect(decode("1")).toBe(1);
      });

      test("should decode 'Z' to 61", () => {
        expect(decode("Z")).toBe(61);
      });

      test("should decode '10' to 62", () => {
        expect(decode("10")).toBe(62);
      });

      test("should decode single characters correctly", () => {
        expect(decode("a")).toBe(10);
        expect(decode("z")).toBe(35);
        expect(decode("A")).toBe(36);
      });

      test("should decode medium strings correctly", () => {
        expect(decode("3d7")).toBe(12345);
        expect(decode("47")).toBe(255);
        expect(decode("gw")).toBe(1024);
      });

      test("should decode large strings correctly", () => {
        expect(decode("4c92")).toBe(1000000);
        expect(decode("FXsj")).toBe(9999999);
        expect(decode("6LAzd")).toBe(99999999);
      });

      test("should decode Number.MAX_SAFE_INTEGER", () => {
        const decoded = decode("FfGNdXsE7");
        expect(decoded).toBe(Number.MAX_SAFE_INTEGER);
      });
    });

    describe("BigInt Support", () => {
      test("should return number for safe values", () => {
        const result = decode("100");
        expect(typeof result).toBe("number");
        expect(result).toBe(3844);
      });

      test("should return BigInt for values exceeding MAX_SAFE_INTEGER", () => {
        const encoded = encode(BigInt("123456789012345678901234567890"));
        const decoded = decode(encoded);
        expect(typeof decoded).toBe("bigint");
        expect(decoded).toBe(BigInt("123456789012345678901234567890"));
      });

      test("should handle BigInt at MAX_SAFE_INTEGER boundary", () => {
        const result = decode("FfGNdXsE7");
        expect(result).toBe(Number.MAX_SAFE_INTEGER);
      });

      test("should properly return BigInt for larger values", () => {
        const original = BigInt("999999999999999999999999999999");
        const encoded = encode(original);
        const decoded = decode(encoded);
        expect(decoded).toBe(original);
      });
    });

    describe("Custom Bases", () => {
      test("should decode binary (base 2)", () => {
        expect(decode("1000", 2)).toBe(8);
        expect(decode("1111", 2)).toBe(15);
      });

      test("should decode hexadecimal (base 16)", () => {
        expect(decode("ff", 16)).toBe(255);
        expect(decode("fff", 16)).toBe(4095);
        expect(decode("100", 16)).toBe(256);
      });

      test("should decode base 36 (alphanumeric)", () => {
        expect(decode("zz", 36)).toBe(1295);
        expect(decode("10", 36)).toBe(36);
      });

      test("should decode base 10 (decimal)", () => {
        expect(decode("12345", 10)).toBe(12345);
        expect(decode("999", 10)).toBe(999);
      });

      test("should decode in all supported bases", () => {
        for (let base = 2; base <= 62; base++) {
          const original = 1000;
          const encoded = encode(original, base);
          const decoded = decode(encoded, base);
          expect(decoded).toBe(original);
        }
      });
    });

    describe("Edge Cases", () => {
      test("should decode consecutive powers of 62", () => {
        expect(decode("10")).toBe(62);
        expect(decode("100")).toBe(3844); // 62^2
        expect(decode("1000")).toBe(238328); // 62^3
      });

      test("should decode all valid single characters", () => {
        for (let i = 0; i < 62; i++) {
          const decoded = decode(CHARACTERS[i]!);
          expect(decoded).toBe(i);
        }
      });

      test("should handle uppercase and lowercase correctly", () => {
        expect(decode("a")).toBe(10);
        expect(decode("A")).toBe(36);
        expect(decode("z")).toBe(35);
        expect(decode("Z")).toBe(61);
      });
    });

    describe("Error Handling", () => {
      test("should throw TypeError for non-string input", () => {
        expect(() => decode(123 as any)).toThrow(TypeError);
        expect(() => decode(null as any)).toThrow(TypeError);
        expect(() => decode(undefined as any)).toThrow(TypeError);
        expect(() => decode({} as any)).toThrow(TypeError);
      });

      test("should throw RangeError for invalid characters in base62", () => {
        expect(() => decode("!@#")).toThrow(RangeError);
        expect(() => decode("abc@def")).toThrow(RangeError);
        expect(() => decode("123!456")).toThrow(RangeError);
      });

      test("should throw RangeError for characters exceeding base limit", () => {
        expect(() => decode("ff", 15)).toThrow(RangeError); // 'f' is 15, needs base 16+
        expect(() => decode("z", 35)).toThrow(RangeError); // 'z' is 35, needs base 36+
      });

      test("should throw RangeError for invalid base", () => {
        expect(() => decode("100", 1)).toThrow(RangeError);
        expect(() => decode("100", 0)).toThrow(RangeError);
        expect(() => decode("100", -1)).toThrow(RangeError);
        expect(() => decode("100", 63)).toThrow(RangeError);
      });

      test("should throw RangeError for non-integer base", () => {
        expect(() => decode("100", 2.5)).toThrow(RangeError);
        expect(() => decode("100", 16.7)).toThrow(RangeError);
      });

      test("should decode empty string as 0", () => {
        const result = decode("");
        expect(result).toBe(0);
      });
    });
  });

  describe("Round-trip Encoding/Decoding", () => {
    test("should preserve identity for small numbers", () => {
      for (let i = 0; i < 1000; i++) {
        expect(decode(encode(i))).toBe(i);
      }
    });

    test("should preserve identity for large numbers", () => {
      const testNumbers = [
        10000,
        100000,
        1000000,
        10000000,
        100000000,
        Number.MAX_SAFE_INTEGER,
      ];
      for (const num of testNumbers) {
        expect(decode(encode(num))).toBe(num);
      }
    });

    test("should preserve identity for BigInt values", () => {
      const testNumbers = [
        BigInt("999999999999999999"),
        BigInt("123456789012345678901234567890"),
        BigInt("999999999999999999999999999999"),
      ];
      for (const num of testNumbers) {
        expect(decode(encode(num))).toBe(num);
      }
    });

    test("should preserve identity across all bases for same number", () => {
      const num = 12345;
      for (let base = 2; base <= 62; base++) {
        const encoded = encode(num, base);
        const decoded = decode(encoded, base);
        expect(decoded).toBe(num);
      }
    });

    test("should preserve identity with mixed bases", () => {
      const num = 500;
      for (let base1 = 2; base1 <= 62; base1++) {
        for (let base2 = 2; base2 <= 62; base2++) {
          const encoded = encode(num, base1);
          // Re-encode in different base
          const reencoded = encode(decode(encoded, base1), base2);
          expect(decode(reencoded, base2)).toBe(num);
        }
      }
    });
  });

  describe("Constants", () => {
    test("CHARACTERS should contain correct character set", () => {
      expect(CHARACTERS).toBe(
        "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
      );
    });

    test("CHARACTERS should have length 62", () => {
      expect(CHARACTERS.length).toBe(62);
    });

    test("CHARACTERS should have unique characters", () => {
      const uniqueChars = new Set(CHARACTERS);
      expect(uniqueChars.size).toBe(62);
    });
  });

  describe("Performance & Stress Tests", () => {
    test("should encode/decode 10000 random numbers quickly", () => {
      for (let i = 0; i < 10000; i++) {
        const num = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
        const encoded = encode(num);
        const decoded = decode(encoded);
        expect(decoded).toBe(num);
      }
    });

    test("should handle sequential encoding of large range", () => {
      for (let i = 0; i <= 10000; i += 100) {
        const encoded = encode(i);
        expect(decode(encoded)).toBe(i);
      }
    });

    test("should handle very long encoded strings", () => {
      const veryLargeNum = BigInt("9" + "9".repeat(100));
      const encoded = encode(veryLargeNum);
      const decoded = decode(encoded);
      expect(decoded).toBe(veryLargeNum);
    });

    test("should handle encoding/decoding in rapid succession", () => {
      let result = 1;
      for (let i = 0; i < 1000; i++) {
        result = Number(decode(encode(result))) + 1;
      }
      expect(result).toBe(1001);
    });
  });
});
