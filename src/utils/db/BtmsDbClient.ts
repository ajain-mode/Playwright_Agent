import net from "net";
import mysql, { Connection, RowDataPacket } from "mysql2/promise";
import moment from "moment-timezone";
import { Client as SshClient, ConnectConfig } from "ssh2";
import loginSetup from "@loginHelpers/loginSetup";
import { resolveSshPrivateKeyFromEnv } from "@utils/db/sshKeyUtils";
import { REGEX_PATTERNS } from "@utils/regexPatterns";

/** Row shape for loadsh toggle date columns — billing.php UI maps Current → last_finance_contact_date. */
export interface LoadToggleDatesRow {
  id: number;
  initial_billing_toggle_date: Date | null;
  last_finance_contact_date: Date | null;
  agent_to_billing_toggle_date: Date | null;
}

export interface EdiExceptionRow {
  id: number;
  created: Date;
  descrip: string;
  load_number: string;
  carr_id: number;
  invoice_total: string;
  assigned_to_payables: number;
}

export interface EdiExceptionToggleHistoryRow {
  id: number;
  edi_exception_id: number;
  created_by: number;
  role: number;
  message: string;
  created_at: Date;
}

interface SshTunnelHandle {
  sshClient: SshClient;
  localServer: net.Server;
  localPort: number;
}

/**
 * Read-only MySQL client for Stage BTMS (`sunteck_fats.loadsh`).
 * Hosts from loginHelpers/config.json; ports/users/schema/password/key from .env (BTMS_DB_*, BTMS_SSH_*).
 * @author AI Agent
 * @created 2026-06-04
 */
export class BtmsDbClient {
  private connection: Connection | null = null;
  private sshTunnel: SshTunnelHandle | null = null;

  /**
   * Opens connection via SSH bastion (config.json hosts + .env) + MySQL credentials (.env).
   * @author AI Agent
   * @created 2026-06-04
   */
  async connect(): Promise<void> {
    const password = process.env.BTMS_DB_PASSWORD;
    if (!password) {
      throw new Error("BTMS_DB_PASSWORD is required for DB validation tests");
    }

    const remoteHost = loginSetup.dbHost;
    const remotePort = loginSetup.dbPort;
    const user = loginSetup.dbUser;
    const database = loginSetup.dbSchema;
    const sshHost = loginSetup.sshHost;

    if (!remoteHost) {
      throw new Error("database.dbHost is not configured in loginHelpers/config.json");
    }

    let mysqlHost = remoteHost;
    let mysqlPort = remotePort;

    if (sshHost) {
      this.sshTunnel = await this.openSshTunnel(sshHost, remoteHost, remotePort);
      mysqlHost = "127.0.0.1";
      mysqlPort = this.sshTunnel.localPort;
    }

    this.connection = await mysql.createConnection({
      host: mysqlHost,
      port: mysqlPort,
      user,
      password,
      database,
      ...(process.env.BTMS_DB_SSL !== "0"
        ? { ssl: { rejectUnauthorized: false } }
        : {}),
    });
  }

  /**
   * Closes MySQL connection and SSH tunnel if used.
   * @author AI Agent
   * @created 2026-06-04
   */
  async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.end();
      this.connection = null;
    }

    if (this.sshTunnel) {
      await new Promise<void>((resolve) => {
        this.sshTunnel!.localServer.close(() => {
          this.sshTunnel!.sshClient.end();
          this.sshTunnel = null;
          resolve();
        });
      });
    }
  }

  /**
   * Reads toggle date columns for a load from `loadsh`.
   * @author AI Agent
   * @created 2026-06-04
   * @param loadId - loadsh.id
   */
  async getLoadToggleDates(loadId: string | number): Promise<LoadToggleDatesRow> {
    if (!this.connection) {
      throw new Error("BtmsDbClient.connect() must be called before querying");
    }

    const [rows] = await this.connection.execute<RowDataPacket[]>(
      `SELECT id, initial_billing_toggle_date, last_finance_contact_date, agent_to_billing_toggle_date
       FROM loadsh WHERE id = ?`,
      [loadId]
    );

    if (!rows.length) {
      throw new Error(`Load ${loadId} not found in loadsh`);
    }

    const row = rows[0];
    return {
      id: Number(row.id),
      initial_billing_toggle_date: (row.initial_billing_toggle_date as Date | null) ?? null,
      last_finance_contact_date: (row.last_finance_contact_date as Date | null) ?? null,
      agent_to_billing_toggle_date: (row.agent_to_billing_toggle_date as Date | null) ?? null,
    };
  }

  /**
   * Reads one edi_exception row for a load number.
   * @author AI Agent
   * @created 2026-06-16
   * @param loadNumber - load_number from edi_exception
   */
  async getEdiExceptionByLoadNumber(loadNumber: string | number): Promise<EdiExceptionRow | null> {
    if (!this.connection) {
      throw new Error("BtmsDbClient.connect() must be called before querying");
    }

    const [rows] = await this.connection.execute<RowDataPacket[]>(
      `SELECT id, created, descrip, load_number, carr_id, invoice_total, assigned_to_payables
       FROM edi_exception WHERE load_number = ?`,
      [String(loadNumber)]
    );

    if (!rows.length) {
      return null;
    }

    const row = rows[0];
    return {
      id: Number(row.id),
      created: row.created as Date,
      descrip: String(row.descrip ?? ""),
      load_number: String(row.load_number ?? ""),
      carr_id: Number(row.carr_id),
      invoice_total: String(row.invoice_total ?? ""),
      assigned_to_payables: Number(row.assigned_to_payables),
    };
  }

  /**
   * Reads edi_exception_toggle_history rows for an exception id.
   * @author AI Agent
   * @created 2026-06-16
   * @param ediExceptionId - edi_exception.id
   */
  async getEdiExceptionToggleHistory(
    ediExceptionId: number
  ): Promise<EdiExceptionToggleHistoryRow[]> {
    if (!this.connection) {
      throw new Error("BtmsDbClient.connect() must be called before querying");
    }

    const [rows] = await this.connection.execute<RowDataPacket[]>(
      `SELECT id, edi_exception_id, created_by, role, message, created_at
       FROM edi_exception_toggle_history WHERE edi_exception_id = ?`,
      [ediExceptionId]
    );

    return rows.map((row) => ({
      id: Number(row.id),
      edi_exception_id: Number(row.edi_exception_id),
      created_by: Number(row.created_by),
      role: Number(row.role),
      message: String(row.message ?? ""),
      created_at: row.created_at as Date,
    }));
  }

  /**
   * Resolves agent.id by partial display name (e.g. NATASHA TINSLEY).
   * @author AI Agent
   * @created 2026-06-16
   * @param nameFragment - substring matched against agents.name
   */
  async getAgentIdByNameFragment(nameFragment: string): Promise<number | null> {
    if (!this.connection) {
      throw new Error("BtmsDbClient.connect() must be called before querying");
    }

    const [rows] = await this.connection.execute<RowDataPacket[]>(
      `SELECT id FROM agents WHERE name LIKE ? LIMIT 1`,
      [`%${nameFragment}%`]
    );

    if (!rows.length) {
      return null;
    }
    return Number(rows[0].id);
  }

  /**
   * Lightweight connectivity check — `SELECT 1`.
   * @author AI Agent
   * @created 2026-06-04
   */
  async ping(): Promise<boolean> {
    if (!this.connection) {
      throw new Error("BtmsDbClient.connect() must be called before ping");
    }
    const [rows] = await this.connection.execute<RowDataPacket[]>("SELECT 1 AS ok");
    return Number(rows[0]?.ok) === 1;
  }

  /**
   * Opens local TCP forward: localhost:* → remoteHost:remotePort via SSH bastion.
   * Locator source: MySQL Workbench connections.xml — native_sshtun driver.
   * @author AI Agent
   * @created 2026-06-04
   */
  private openSshTunnel(
    sshHost: string,
    remoteHost: string,
    remotePort: number
  ): Promise<SshTunnelHandle> {
    const sshUser = loginSetup.sshUser;
    const sshPort = loginSetup.sshPort;
    const privateKey = resolveSshPrivateKeyFromEnv();

    const sshConfig: ConnectConfig = {
      host: sshHost,
      port: sshPort,
      username: sshUser,
      privateKey,
    };

    const sshPassword = process.env.BTMS_SSH_PASSWORD;
    if (sshPassword) {
      sshConfig.password = sshPassword;
    }

    return new Promise((resolve, reject) => {
      const sshClient = new SshClient();

      sshClient
        .on("ready", () => {
          const localServer = net.createServer((socket) => {
            sshClient.forwardOut(
              socket.remoteAddress || "127.0.0.1",
              socket.remotePort || 0,
              remoteHost,
              remotePort,
              (err: Error | undefined, stream: NodeJS.ReadWriteStream) => {
                if (err) {
                  socket.destroy();
                  return;
                }
                socket.pipe(stream).pipe(socket);
              }
            );
          });

          localServer.listen(0, "127.0.0.1", () => {
            const address = localServer.address();
            const localPort =
              typeof address === "object" && address ? address.port : 0;
            if (!localPort) {
              reject(new Error("Failed to bind local SSH tunnel port"));
              return;
            }
            resolve({ sshClient, localServer, localPort });
          });

          localServer.on("error", reject);
        })
        .on("error", reject)
        .connect(sshConfig);
    });
  }
}

/**
 * True when DB datetime column is NULL (never toggled).
 * @author AI Agent
 * @created 2026-06-04
 */
export function isDbToggleDateEmpty(value: Date | null | undefined): boolean {
  return value == null;
}

/**
 * True when View Billing toggle date text is a populated MM/DD/YYYY HH:mm:ss value (not N/A, blank, or malformed).
 * @author AI Agent
 * @created 2026-06-11
 */
export function isUiToggleDateDisplayPopulated(
  uiDisplay: string,
  notApplicableLabel = "N/A"
): boolean {
  const ui = (uiDisplay || "").trim();
  if (!ui || ui.toUpperCase() === notApplicableLabel.toUpperCase()) {
    return false;
  }
  return REGEX_PATTERNS.DATE.US_BILLING_TOGGLE_DATETIME.test(ui);
}

/**
 * Compares View Billing UI toggle date text (MM/DD/YYYY HH:mm:ss or N/A) to a DB datetime.
 * Current Toggle Date on billing.php uses `last_finance_contact_date`.
 * @author AI Agent
 * @created 2026-06-04
 */
export function uiToggleDateMatchesDb(
  uiDisplay: string,
  dbValue: Date | null | undefined,
  notApplicableLabel = "N/A"
): boolean {
  const ui = (uiDisplay || "").trim();
  if (ui === notApplicableLabel || ui === "") {
    return isDbToggleDateEmpty(dbValue);
  }
  if (!dbValue) {
    return false;
  }

  const uiMoment = moment(ui, "MM/DD/YYYY HH:mm:ss", true);
  if (!uiMoment.isValid()) {
    return false;
  }
  const dbMoment = moment(dbValue);
  return (
    uiMoment.format("YYYY-MM-DD HH:mm:ss") === dbMoment.format("YYYY-MM-DD HH:mm:ss") ||
    uiMoment.format("YYYY-MM-DD HH:mm") === dbMoment.format("YYYY-MM-DD HH:mm")
  );
}

/**
 * @author AI Agent
 * @created 2026-06-04
 */
export function formatDbToggleDateForLog(value: Date | null | undefined): string {
  return value ? moment(value).format("YYYY-MM-DD HH:mm:ss") : "NULL";
}
