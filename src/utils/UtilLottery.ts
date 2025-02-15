import fs from "fs";

import {GetDB} from "QDBService";

export const Get539Data = () => {
  const sql = "SESLECT * FROM L539 order by Period desc";
  let db = GetDB("Lottery");
  let queryResult = db.query(sql);
  console.log(queryResult);
};
