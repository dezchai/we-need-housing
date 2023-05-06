import { readFileSync, writeFileSync } from "fs";

export const readPrevious = (key: string) => {
  const prevData = JSON.parse(readFileSync("./previous.json", "utf-8"));

  const keyData = prevData[key];
  
  if (keyData) return keyData

  writePrevious(key, []);

  return []
}

export const writePrevious = (key: string, data: any[]) => {
  const prevData = JSON.parse(readFileSync('./previous.json', 'utf-8'))

  prevData[key] = data

  writeFileSync('./previous.json', prevData)
}