import { FullResult, Reporter } from "@playwright/test/reporter";
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import commonReusables from "@utils/commonReusables";
import loginSetup from "src/loginHelpers/loginSetup";
class TestmoReporter implements Reporter {
  private results: any[] = [];

  async onEnd(result: FullResult) {
    const outputDir = path.join(__dirname, "../results");

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }

    // Define Project ID 1 for ModeQA & 2 for TestProject
    let projectId: number;
    const testmoProject = process.env.REPORT_INTEGRATION;
    if (testmoProject === "Mode QA") {
      projectId = 1;
    }
    else {
      projectId = 2;
    }

    // Test Run Name Creation
    const dateTime = await commonReusables.getDate("today", "YYYY-MM-DD") + "_" + await commonReusables.getCurrentESTTime("hour") + ":" + await commonReusables.getCurrentESTTime("minute");
    const runNameEnv = process.env.RUN_NAME || "Local_TestRun";
    const runName = `${runNameEnv}_${dateTime}`;

    //Define Source, Environment and Tags
    const source = process.env.source || "Local";
    const executionEnv = loginSetup.Execution_Env;

    //Define All Tags for Testmo
    let moduleNameTag = process.env.TEST_MODULE || 'Local';
    moduleNameTag = moduleNameTag.toLowerCase().replace(/\s+/g, "");
    const yamlTags = process.env.TEST_TAGS || "";
    const multiTags = await yamlTags.match(/@(\w+)/g)?.map(tag => tag.slice(1)) || [];
    if (moduleNameTag != "Local") {
      await multiTags.push(moduleNameTag);
    }
    await multiTags.push(executionEnv);
    await console.log("Tags for Test Run:", multiTags.join(","));

    // Skip Testmo upload for Local runs
    if (source === "Local") {
      projectId = 2; // for Local Execution
      await console.log("Local Execution - Report are not uploaded to testmo");
      return;
    }
    // Set Testmo API Token
    const testmoToken = process.env.TESTMO_TOKEN;
    const env = { ...process.env, TESTMO_API_TOKEN: testmoToken };

    console.log(`Preparing to submit test results to Testmo Project ID: ${projectId} with Run Name: ${runName}`);
    
    // Submit results to Testmo
    try {
      console.log('Submitting test results to Testmo...');
      execSync(
        `npx testmo automation:run:submit ` +
        `--instance=https://modeglobal.testmo.net ` +
        `--project-id=${projectId} ` +
        `--name="${runName}" ` +
        `--source="${source}" ` +
        // `--tags="${tags}" ` +
        // `--tags="${env}" ` +
        multiTags.map(tag => `--tags="${tag}"`).join(" ") + " " +
        `--results=src/reporting/junitResults/test-results.xml `,
        { stdio: 'inherit', env }
      );

      console.log('Test results submitted to Testmo!');
    } catch (error) {
      console.error("Failed to submit results to Testmo:", error);
      if (error instanceof Error && 'stdout' in error && 'stderr' in error) {
        console.error('STDOUT:', (error as any).stdout);
        console.error('STDERR:', (error as any).stderr);
      }
    }
  }
}
export default TestmoReporter;