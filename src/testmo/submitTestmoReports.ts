/**
 * submitTestmoReports.ts
 *
 * Script to convert HTML reports to XML and submit JUnit XML reports to Testmo for all subfolders in UIPATHReport.
 * Automates the process of reporting test results to Testmo using the CLI.
 *
 * @author Deepak Bohra
 * @created 2025-07-30
 * @modified 2025-08-22
 */
import { execSync } from "child_process";
import { readdirSync, existsSync } from "fs";
import { join } from "path";

// Run the htmltoxml script
execSync("npx ts-node src/testmo/htmltoxml.ts", { stdio: "inherit" });

const reportDir = "UIPATHReport";
const testmoToken = "testmo_api_eyJpdiI6ImVXT1cvYWxZckhDd2FXLzQ4c21FRkE9PSIsInZhbHVlIjoiWURBeHBKcXlTS1dMdjRwK1hwdERmWWlGV0VwU0QxbWZPS0JPZzFUdkh1d2g5UENLU0MwMlpjTnpzb1c4ZHlQSCIsIm1hYyI6IjU1YjBlMjRmNDA4MTFhYTVkNDQ3NTYzMTlkMWM3MjllOTNmZWNiM2E5YzQ5MTFlOWEzYTU1NzA1OTI2YzBhMjIiLCJ0YWciOiIifQ==";
process.env.TESTMO_TOKEN = testmoToken;

const folders = readdirSync(reportDir, { withFileTypes: true })
  .filter(dirent => dirent.isDirectory())
  .map(dirent => dirent.name);

for (const folderName of folders) {
  const xmlPath = join(reportDir, folderName, "junit-report.xml");
  if (existsSync(xmlPath)) {
    console.log(`Submitting report for ${folderName}`);
    execSync(
      `testmo automation:run:submit --instance https://modeglobal.testmo.net/ --project-id 3 --name "${folderName}" --source "UIPATHHTMLREPORT" --results "${xmlPath}" --tags "${folderName}"`,
      { stdio: "inherit" }
    );
  } else {
    console.log(`No junit-report.xml found in ${folderName}`);
  }
}
