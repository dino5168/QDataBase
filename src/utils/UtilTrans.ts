// 轉換 資料使用
export class UtilTrans {
  static GetMapKey = (map: Map<string, any>): string[] => {
    return Array.from(map.keys());
  };
}
