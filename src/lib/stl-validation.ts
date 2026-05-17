import "server-only";

import { Box3, BufferAttribute, BufferGeometry, Vector3 } from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";

export type StlValidationResult =
  | {
      ok: true;
      dimensions: { width: number; height: number; depth: number };
      triangles: number;
    }
  | {
      ok: false;
      error: string;
    };

const maxFileMb = Number(process.env.MAX_STL_FILE_MB ?? 50);
const maxTriangles = Number(process.env.MAX_STL_TRIANGLES ?? 800000);
const buildWidth = Number(process.env.PRINTER_BUILD_WIDTH_MM ?? 256);
const buildDepth = Number(process.env.PRINTER_BUILD_DEPTH_MM ?? 256);
const buildHeight = Number(process.env.PRINTER_BUILD_HEIGHT_MM ?? 256);

function round(value: number) {
  return Math.round(value * 10) / 10;
}

export function validateStl(arrayBuffer: ArrayBuffer, fileSize: number): StlValidationResult {
  if (fileSize > maxFileMb * 1024 * 1024) {
    return { ok: false, error: `STL file is too large. Maximum allowed size is ${maxFileMb} MB.` };
  }

  let geometry: BufferGeometry;
  try {
    geometry = new STLLoader().parse(arrayBuffer);
  } catch {
    return { ok: false, error: "This STL could not be parsed. Please export a valid binary or ASCII STL." };
  }

  const position = geometry.getAttribute("position") as BufferAttribute | undefined;
  if (!position || position.count < 3) {
    return { ok: false, error: "This STL does not contain printable geometry." };
  }

  const triangles = Math.floor(position.count / 3);
  if (triangles > maxTriangles) {
    return {
      ok: false,
      error: `This STL is too complex (${triangles.toLocaleString("en-IN")} triangles). Please simplify it below ${maxTriangles.toLocaleString("en-IN")} triangles.`,
    };
  }

  geometry.computeBoundingBox();
  const box = geometry.boundingBox;
  if (!box) return { ok: false, error: "Unable to read STL dimensions." };

  const size = new Box3(box.min, box.max).getSize(new Vector3());
  const dimensions = {
    width: round(size.x),
    height: round(size.z),
    depth: round(size.y),
  };

  if (dimensions.width > buildWidth || dimensions.depth > buildDepth || dimensions.height > buildHeight) {
    return {
      ok: false,
      error: `This model is ${dimensions.width} x ${dimensions.depth} x ${dimensions.height} mm, which exceeds the configured printer volume of ${buildWidth} x ${buildDepth} x ${buildHeight} mm.`,
    };
  }

  return { ok: true, dimensions, triangles };
}
