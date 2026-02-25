/**
 * Author: Deepak Singh Bohra
 * Created: 2025-07-01
 * Description: Utility to parse HTML test reports and generate JUnit XML.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as cheerio from 'cheerio';

// Escapes special XML characters in a string to ensure safe XML formatting.
function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, c => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}


// Converts a time duration string (HH:MM:SS or MM:SS) into total seconds.
function convertDurationToSeconds(duration: string): number {
  const parts = duration.split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 1) return parts[0];
  return 0;
}


// Extracts test case data from HTML and formats it into JUnit-compatible XML strings.
function extractTestCasesFromHtml(html: string, folderName: string): string[] {
  const testCases: string[] = [];
  const $ = cheerio.load(html);

    const rows = $('#execution-result tbody tr');
    if (rows.length === 0) {
      console.warn(`No test cases found in HTML for folder "${folderName}".`);
    }

    rows.each((_, row) => {
      const cells = $(row).find('td');
      if (cells.length < 5) {
        console.warn(`Skipping row with insufficient data in folder "${folderName}".`);
        return;
      }

      const testId = $(cells[0]).text().trim();
      const testName = $(cells[1]).text().trim();
      const result = $(cells[2]).text().trim().toLowerCase(); // pass, fail, norun
      const comments = $(cells[3]).text().trim();
      const duration = $(cells[4]).text().trim();
      const timeInSeconds = convertDurationToSeconds(duration);
      const fullName = `${testId} - ${testName}`;

      let testCaseXml = `    <testcase classname="${escapeXml(folderName)}" name="${escapeXml(fullName)}" time="${timeInSeconds}">`;

      if (result === 'fail') {
        testCaseXml += `\n      <failure message="Test failed">${escapeXml(comments)}</failure>`;
      } else if (result === 'norun') {
        testCaseXml += `\n      <skipped>${escapeXml(comments || 'Test was not executed')}</skipped>`;
      }

      if (comments) {
        testCaseXml += `\n      <system-out>${escapeXml(comments)}</system-out>`;
      }

      testCaseXml += `\n    </testcase>`;
      testCases.push(testCaseXml);
    });

    return testCases;
}


// Processes all HTML files in a folder and generates a JUnit XML report from extracted test cases.
function processFolder(folderPath: string, folderName: string) {
  try {
    const htmlFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.html'));
    const allTestCases: string[] = [];

    htmlFiles.forEach(file => {
      try {
        const filePath = path.join(folderPath, file);
        const html = fs.readFileSync(filePath, 'utf8');
        const testCases = extractTestCasesFromHtml(html, folderName);
        allTestCases.push(...testCases);
      } catch (fileError) {
        if (fileError && typeof fileError === 'object' && 'message' in fileError) {
          console.error(`Error reading or processing file "${file}" in folder "${folderName}":`, (fileError as { message: string }).message);
        } else {
          console.error(`Error reading or processing file "${file}" in folder "${folderName}":`, fileError);
        }
      }
    });

    if (allTestCases.length > 0) {
      const junitXml = `<?xml version="1.0" encoding="UTF-8"?>
<testsuites>
  <testsuite name="UIPATH Test Suite - ${escapeXml(folderName)}" tests="${allTestCases.length}">
${allTestCases.join('\n')}
  </testsuite>
</testsuites>`;

      const outputXmlPath = path.join(folderPath, 'junit-report.xml');
      fs.writeFileSync(outputXmlPath, junitXml, 'utf8');
      console.log(`✅ JUnit XML report generated at: ${outputXmlPath}`);
    } else {
      console.warn(`⚠️ No test cases found in folder "${folderName}". Skipping XML generation.`);
    }
  } catch (folderError) {
    if (folderError && typeof folderError === 'object' && 'message' in folderError) {
      console.error(`Error processing folder "${folderPath}":`, (folderError as { message: string }).message);
    } else {
      console.error(`Error processing folder "${folderPath}":`, folderError);
    }
  }
}

// Recursively walks through subfolders of a base directory and processes each for test results.
function walkFolders(basePath: string) {
  try {
    fs.readdirSync(basePath, { withFileTypes: true }).forEach(entry => {
      const fullPath = path.join(basePath, entry.name);
      if (entry.isDirectory()) {
        try {
          processFolder(fullPath, entry.name);
        } catch (processError) {
          if (processError && typeof processError === 'object' && 'message' in processError) {
            console.error(`Error processing subfolder "${entry.name}":`, (processError as { message: string }).message);
          } else {
            console.error(`Error processing subfolder "${entry.name}":`, processError);
          }
        }
      }
    });
  } catch (walkError) {
    if (walkError && typeof walkError === 'object' && 'message' in walkError) {
      console.error(`Error walking through base path "${basePath}":`, (walkError as { message: string }).message);
    } else {
      console.error(`Error walking through base path "${basePath}":`, walkError);
    }
  }
}

// Start processing
walkFolders('./UIPATHREPORT');
