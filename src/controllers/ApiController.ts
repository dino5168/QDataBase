import {QDB} from "@lib/QDataBase/QDB";
import {QueryResult} from "@lib/QDataBase/types";
export class ApiContriller {
  private qdb: QDB;
  constructor(qdb: QDB) {
    this.qdb = qdb;
  }

  async Get539Data() {
    const queryResult = await this.qdb.query(
      "SELECT top 25 * FROM L539 order by Period desc"
    );
    return queryResult;
  }
}
