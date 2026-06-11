/**
 * Decodes BTMS_SSH_KEY from base64 into a Buffer suitable for ssh2 `privateKey`.
 * Encode your PEM file once (PowerShell):
 *   [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes((Get-Content -Raw "path\to\key.pem")))
 * @author AI Agent
 * @created 2026-06-10
 */
export function resolveSshPrivateKeyFromEnv(envKey = "BTMS_SSH_KEY"): Buffer {
  const encoded = process.env[envKey]?.trim();
  if (!encoded) {
    throw new Error(
      `${envKey} is required — set a base64-encoded SSH private key PEM in .env`
    );
  }

  let decoded: Buffer;
  try {
    decoded = Buffer.from(encoded, "base64");
  } catch {
    throw new Error(`${envKey} is not valid base64`);
  }

  const pem = decoded.toString("utf-8");
  if (!pem.includes("BEGIN") || !pem.includes("PRIVATE KEY")) {
    throw new Error(
      `${envKey} must decode to a PEM private key (BEGIN … PRIVATE KEY)`
    );
  }

  return decoded;
}
