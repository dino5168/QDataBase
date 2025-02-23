import ini from "ini";
import fs from "fs";

export class UtilFiles {
  //讀取 INI 到 map <key,value>
  static ReadIni = (filePath: string): Map<string, string> => {
    const configFile = fs.readFileSync(filePath, "utf-8");
    const config = ini.parse(configFile);
    const mapINI = new Map<string, string>();
    Object.entries(config).forEach(([key, value]) => {
      mapINI.set(key, value as string);
    });
    return mapINI;
  };
}
