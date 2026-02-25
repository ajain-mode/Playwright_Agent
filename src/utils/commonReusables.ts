// import * as xlsx from "xlsx";
import { Locator, Page, expect } from "@playwright/test";
import * as fs from "fs";

/***
 * @class CommonReusables
 * @description A class that provides common utility functions.
 */

class CommonReusables {
  /**
   * Extracts the first dollar value from a message string and logs the result.
   * @param message The alert message string.
   * @returns The extracted dollar value as a string, or null if not found.
   */
  public extractAndLogDollarValue(message: string): string | null {
    console.log(`Alert Message: "${message}"`);
    const dollarMatch = message ? message.match(/\$(\d+(?:\.\d{2})?)/) : null;
    const dollarValue = dollarMatch ? dollarMatch[1] : null;
    console.log(`Extracted Dollar Value: ${dollarValue}`);
    return dollarValue;
  }
  // readonly DEFAULT = 3000;
  // readonly smallWait = 10000;
  // readonly midWait = 15000;
  // readonly largeWait = 20000;
  // Date and Time variables
  formattedDateTime: string = "";

  /**
   * @author Deepak Bohra
   * @description Waits for all page load states to ensure page is fully loaded
   * @param page - The page object to wait for
   * @param timeout - Optional timeout for each wait state (default: 30000ms)
   */
  public async waitForAllLoadStates(
    page: Page,
    timeout: number = 60000
  ): Promise<void> {
    console.log("Waiting for page to be fully loaded...");
    await page.waitForLoadState("domcontentloaded", { timeout });
    await page.waitForLoadState("load", { timeout });
    await page.waitForTimeout(WAIT.SMALL);
    console.log("Page fully loaded - all load states completed");
  }

  // Dates
  today: Date = new Date();
  get tomorrow(): Date {
    const tomorrow = new Date(this.today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  }

  /***
   * @function formatDate
   * @method formatDate - Formats a Date object into a string in the format YYYYMMDD.
   */
  public formatDateToYYYYMMDD(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-based
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}${month}${day}`;
  }
  /*
 
 */
  /**
   * @author Deepak Bohra
   * @description Returns formatted strings for tomorrow and the day after tomorrow in MM/DD/YYYY format.
   * @modified 2025-07-31
   */
  public getNextTwoDatesFormatted(): {
    tomorrow: string;
    dayAfterTomorrow: string;
  } {
    const today = new Date();

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const dayAfterTomorrow = new Date(today);
    dayAfterTomorrow.setDate(today.getDate() + 2);

    const format = (date: Date): string => {
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const year = date.getFullYear();
      return `${month}/${day}/${year}`;
    };

    return {
      tomorrow: format(tomorrow),
      dayAfterTomorrow: format(dayAfterTomorrow),
    };
  }

  /**
   * @author Deepak Bohra
   * @created 2025-12-22
   * @description Formats a rate value into US currency format with 2 decimal places
   * @param rateValue - The raw rate value to format (string or number)
   * @returns Formatted currency string (e.g., "$1,234.56")
   */
  public formatToCurrency(rateValue: string | number): string {
    const numericValue = Number(rateValue);
    return `$${numericValue.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  // /**
  //  * @author Rohit Singh
  //  * Reads test data from an Excel file and returns the data for a specific test script ID.
  //  * @param filePath The path to the Excel file.
  //  * @param testScriptId The ID of the test script to filter the data.
  //  * @param sheetName Optional parameter to specify the sheet name, defaults to the first sheet.
  //  * @returns An object containing the row data for the specified test script ID.
  //  */
  // public readTestDataFromExcel(
  //   filePath: string,
  //   testScriptId: string, // This parameter is not used in the function but can be used for filterin
  //   sheetName?: string
  // ): Record<string, string> {
  //   const workbook = xlsx.readFile(filePath);
  //   const selectedSheetName = sheetName ?? workbook.SheetNames[0];
  //   const sheet = workbook.Sheets[selectedSheetName];

  //   const data = xlsx.utils.sheet_to_json<Record<string, string>>(sheet, {
  //     defval: "",
  //   });
  //   const rowNumber = data.findIndex(
  //     (row) => row["Test Script ID"] === testScriptId
  //   );

  //   return data[rowNumber];
  // }

  /**
   * @author Deepak Bohra
   * @description Waits for an alert dialog, validates its message against the expected value, and accepts or rejects accordingly.
   * @modified 2025-08-27
   */
  public async validateAlert(
    page: Page,
    expectedMessage: string | RegExp,
    timeout: number = 10
  ): Promise<string | null> {
    return new Promise((resolve, reject) => {
      let handled = false;
      let dialogHandler: ((dialog: any) => Promise<void>) | null = null;
      let timer: NodeJS.Timeout | null = null;

      const cleanup = () => {
        if (dialogHandler) {
          page.off("dialog", dialogHandler);
          dialogHandler = null;
        }
        if (timer) {
          clearTimeout(timer);
          timer = null;
        }
      };

      // Set up dialog handler first
      dialogHandler = async (dialog) => {
        if (!handled) {
          handled = true;
          cleanup();

          const alertMessage = dialog.message();
          console.log(`Alert message detected: "${alertMessage}"`);

          try {
            expect(alertMessage).toMatch(expectedMessage);
            console.log(
              `✅ Alert validation PASSED: Contains '${expectedMessage}'`
            );
            await dialog.accept();
            resolve(alertMessage);
          } catch (error) {
            console.log(
              `❌ Alert validation FAILED: Does not contain '${expectedMessage}'`
            );
            console.log(`Expected: Message containing '${expectedMessage}'`);
            console.log(`Actual: ${alertMessage}`);
            await dialog.accept();
            reject(error);
          }
        }
      };

      // Add dialog listener
      page.on("dialog", dialogHandler);

      // Set up timeout
      timer = setTimeout(() => {
        if (!handled) {
          handled = true;
          cleanup();
          const timeoutError = new Error(
            `No alert appeared within ${timeout} seconds. Expected message: '${expectedMessage}'`
          );
          console.log(`❌ Alert timeout: ${timeoutError.message}`);
          reject(timeoutError);
        }
      }, timeout * 1000);

      console.log(
        `Waiting for alert with message containing: '${expectedMessage}' (timeout: ${timeout}s)`
      );
    });
  }

  async getElementText(element: Locator): Promise<string> {
    try {
      const actText = await element.textContent();
      const trimmedText = actText?.trim() ?? "";
      console.log(`Element Text: ${trimmedText}`);
      return trimmedText;
    } catch (error) {
      console.error(`Error Getting Text ${element} : ${error}`);
      throw error;
    }
  }

  /**
   * Accepts an alert dialog with the specified text.
   * @author Rohit Singh
   * @modified 2025-07-28
   */
  async alertAcceptWithText(page: Page, text: string) {
    // Set up the dialog handler before the action that triggers it
    const dialogHandler = async (dialog: any) => {
      console.log(`Dialog appeared: ${dialog.message()}`);
      if (dialog.message().includes(text)) {
        console.log(`Accepting dialog with text: ${text}`);
        await dialog.accept();
      } else {
        console.warn(
          `Dialog text "${dialog.message()}" doesn't contain "${text}". Dismissing.`
        );
        await dialog.dismiss();
      }
    };

    // Add the listener
    page.on("dialog", dialogHandler);

    // Wait a bit for the dialog to appear and be handled
    await page.waitForTimeout(WAIT.DEFAULT);

    // Remove the listener to prevent multiple handlers
    page.off("dialog", dialogHandler);
  }
  /**
   * @author Rohit Singh
   * @description Gets the current date in the specified format.
   * @param day - The day to get the date for ("today", "tomorrow", "dayAfterTomorrow").
   * @param format - The format of the date ("MM/DD/YYYY", "YYYY-MM-DD", "YYYYMMDD", "MM/DD/YY").
   * @returns The formatted date string.
   * @modified 2025-07-29
   */
  async getDate(day: string, format: string): Promise<string> {
    const date = new Date();
    if (day === "today") {
      // No change needed for today
    } else if (day === "tomorrow") {
      date.setDate(date.getDate() + 1);
    } else if (day === "dayAfterTomorrow") {
      date.setDate(date.getDate() + 2);
    }
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    };
    const formattedDate = new Intl.DateTimeFormat("en-US", options).format(
      date
    );
    if (format === "MM/DD/YYYY") {
      return formattedDate;
    } else if (format === "YYYY-MM-DD") {
      // Fix: Use ISO string and extract date portion, or format directly
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    } else if (format === "YYYYMMDD") {
      // Fix: Use ISO string and extract date portion, or format directly
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}${month}${day}`;
    } else if (format === "MM/DD/YY") {
      const options: Intl.DateTimeFormatOptions = {
        year: "2-digit",
        month: "2-digit",
        day: "2-digit",
      };
      const formattedDate = new Intl.DateTimeFormat("en-US", options).format(
        date
      );
      return formattedDate;
    } else if (format === "YYYY/MM/DD") {
      const parts = formattedDate.split("/"); // [MM, DD, YYYY]
      return `${parts[2]}/${parts[0]}/${parts[1]}`; // YYYY/MM/DD
    } else if (format === "DD/MM/YYYY") {
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } else {
      throw new Error(`Unsupported format: ${format}`);
    }
  }
  /**
   * @author Rohit Singh
   * @created 2025-08-04
   * @description Reload page and wait for network idle state.
   */
  async reloadPage(page: Page): Promise<void> {
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(WAIT.DEFAULT / 3);
    await page.reload();
    await page.waitForLoadState("networkidle");
  }
  /**
   * Handles browser alert/dialog by auto-accepting it after a short wait.
   * Must be called before triggering an action that opens a dialog.
   *
   * @param page Playwright Page object
   * @param waitTime Optional timeout before accepting dialog
   * @author Avanish Srivastava
   * @created 2025-08-05
   */
  async dialogHandler(page: Page, waitTime: number = WAIT.DEFAULT) {
    page.on("dialog", async (dialog) => {
      console.log(`Alert Message: ${dialog.message()}`);
      await page.waitForTimeout(waitTime);
      await dialog.accept();
      console.log("Alert accepted");
    });
  }

  /**
   * @author Avanish Srivastava
   * @created 2025-08-14
   * Description: Clicks on a given locator with retry mechanism.
   *
   * @param locator - Playwright Locator of the element to click.
   * @param retries - Number of retry attempts (default: 3).
   */
  async clickElementWithRetry(locator: Locator, retries = 3): Promise<void> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        await locator.waitFor({ state: "visible" });
        await locator.click();
        console.log(`Click succeeded on attempt ${attempt}`);
        return;
      } catch (error) {
        console.warn(`Attempt ${attempt} failed: ${error}`);
        if (attempt === retries) {
          throw new Error(`Click failed after ${retries} attempts`);
        }
      }
    }
  }

  /**
   * Reloads the page until element is visible (max 5 attempts, 2s interval).
   * @param element The element to wait for visibility
   * @param maxAttempts Maximum attempts (default: 5)
   * @author Rohit Singh
   * @created 2025-08-08
   */
  async reloadPageUntilElementVisible(
    page: any,
    element: Locator,
    maxAttempts: number = 5
  ): Promise<void> {
    for (let i = 0; i < maxAttempts; i++) {
      if (await element.isVisible()) return;
      if (i === maxAttempts - 1)
        throw new Error(`Element not visible after ${maxAttempts} attempts`);
      await page.waitForLoadState("networkidle");
      await page.reload();
      await page.waitForLoadState("networkidle");
    }
  }

  /**
   * @author Parth Rastogi
   * Properly parses a CSV line handling quoted fields with commas
   * @param line - The CSV line to parse
   * @returns Array of parsed values
   */
  private parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        result.push(current);
        current = "";
      } else {
        current += char;
      }
    }

    // Add the last field
    result.push(current);

    return result;
  }

  /**
   * @author Parth Rastogi
   * Reads test data from a CSV file and returns the data for a specific test script ID.
   * @param filePath The path to the CSV file.
   * @param testScriptId The ID of the test script to filter the data.
   * @returns An object containing the row data for the specified test script ID.
   */
  public readTestDataFromCsv(
    filePath: string,
    testScriptId: string
  ): Record<string, string> {
    const data: Record<string, string>[] = [];
    // Read CSV file synchronously
    const csvContent = fs.readFileSync(filePath, "utf-8");
    // const lines = csvContent.split('\n');
    const lines = csvContent.split(/\r?\n/);
    if (lines.length === 0) {
      throw new Error(`CSV file is empty: ${filePath}`);
    }
    // Parse header
    const headers = this.parseCsvLine(lines[0]);

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      //const line = lines[i].trim();
      const line = lines[i];

      if (line) {
        const values = this.parseCsvLine(line);
        const row: Record<string, string> = {};

        headers.forEach((header, index) => {
          row[header] = values[index] || "";
        });

        data.push(row);
      }
    }

    // Find the row with matching Test Script ID
    const targetRow = data.find(
      (row) => row["Test Script ID"] === testScriptId
    );

    if (!targetRow) {
      throw new Error(
        `Test Script ID "${testScriptId}" not found in CSV file: ${filePath}`
      );
    }

    return targetRow;
  }

  /**
   * @description Verify the tab heading/page title
   * @author Deepak Bohra
   * @created : 2025-08-28
   */
  async verifyTabHeading(page: Page, expectedTitle: string): Promise<void> {
    const actualTitle = await page.title();
    console.log(`Expected Title: "${expectedTitle}"`);
    console.log(`Actual Title: "${actualTitle}"`);

    expect(actualTitle).toBe(expectedTitle);
    console.log("✅ Tab heading verified successfully");
  }
  /**
   * @author Deepak Bohra
   * @created 2025-10-09
   * @description Normalizes a rate string by removing commas and ensuring two decimal places.
   *
   */
  async normalizeRate(rate: string): Promise<string> {
    let cleaned = rate.replace(/,/g, "");
    const match = cleaned.match(/\$(\d+(?:\.\d+)?)/);
    if (match) {
      let num = parseFloat(match[1]);
      cleaned = `$${num.toFixed(2)}`;
    }
    return cleaned;
  }

  /**
   * author Deepak Bohra
   * @created 2025-11-13
   * Converts a formatted currency string (e.g., "$2,000" or "$2,000.00")
   * into a normalized numeric string (e.g., "2000.00").
   */
  async normalizeCurrencyValue(value: string | null): Promise<string> {
    if (!value) return "0.00"; // Handle null or empty input

    // Remove $ and commas
    let cleanedValue = value.replace(/[\$,]/g, "");

    // If no decimal part, add ".00"
    if (!cleanedValue.includes(".")) {
      cleanedValue = `${cleanedValue}.00`;
    }

    return cleanedValue;
  }

  /**
   * @author rohit singh
   * @created 2025-09-05
   * @description Gets the current time in EST timezone with custom format
   * @param format - The format to extract ("minute" or "hour")
   * @returns A string representing the current EST time in specified format
   */
  async getCurrentESTTime(extract: string): Promise<string> {
    const now = new Date();
    const estTime = await new Date(
      now.toLocaleString("en-US", { timeZone: "America/New_York" })
    );
    const hours = await estTime.getHours().toString().padStart(2, "0");
    const minutes = await estTime.getMinutes().toString().padStart(2, "0");
    if ((await extract.toLowerCase()) === "minute") {
      extract = minutes;
    } else if ((await extract.toLowerCase()) === "hour") {
      extract = hours;
    } else {
      throw await new Error(
        `Invalid extract parameter: ${extract}. Expected 'minute' or 'hour'.`
      );
    }
    return extract;
  }

  /**
   * @description Captures the current date and time in MM/DD/YYYY H:MM format
   * @author Parth Rastogi
   * @created 2025-09-12
   * @returns Current date and time as formatted string (e.g., "09/12/2025 9:06")
   */
  getCurrentDateTime(): string {
    const now = new Date();

    const month = String(now.getMonth() + 1).padStart(2, "0"); // Months are 0-based
    const day = String(now.getDate()).padStart(2, "0");
    const year = now.getFullYear();

    const hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, "0");

    this.formattedDateTime = `${month}/${day}/${year} ${hours}:${minutes}`;
    console.log(`Current Date & Time: ${this.formattedDateTime}`);

    return this.formattedDateTime;
  }
  /**
   * @description Generates a random number with specified number of digits
   * @author Rohit Singh
   * @created 2025-09-17
   * @param digits - Number of digits for the random number (default: 10)
   * @returns Random number as string with specified digits
   */
  generateRandomNumber(digits: number = 10): string {
    if (digits <= 0) {
      throw new Error("Number of digits must be greater than 0");
    }
    const min = Math.pow(10, digits - 1); // e.g., for 10 digits: 1000000000
    const max = Math.pow(10, digits) - 1; // e.g., for 10 digits: 9999999999
    const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
    console.log(`Generated ${digits}-digit random number: ${randomNumber}`);
    return randomNumber.toString();
  }
  /**
   * Starts a time counter and logs the elapsed time every second.
   * @author Rohit Singh
   * @created 2025-Oct-28
   */
  public startTimeCounter(label: string = "Test Runtime"): () => void {
    const startTime = Date.now();
    let intervalId: NodeJS.Timeout;

    const updateCounter = () => {
      const elapsed = Date.now() - startTime;
      const seconds = Math.floor(elapsed / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);

      const formattedTime = `${hours.toString().padStart(2, "0")}:${(
        minutes % 60
      )
        .toString()
        .padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;

      // Clear previous line and write new time
      process.stdout.write(`\r${label}: ${formattedTime}`);
    };

    // Update immediately and then every second
    updateCounter();
    intervalId = setInterval(updateCounter, 1000);

    // Return cleanup function
    return () => {
      clearInterval(intervalId);
      console.log(); // Add newline after stopping counter
    };
  }

  /**
   * WAIT for the page to be fully loaded and stable
   * @param page Playwright Page object
   * @param options Optional timeout settings
   * @author Aniket Nale
   * @created 2025-11-06
   */

  async waitForPageStable(page: Page, options?: { timeout?: number }) {
    const timeout = options?.timeout ?? WAIT.LARGE;

    // Step 1: Wait for the DOM to be ready
    await page
      .waitForLoadState("domcontentloaded", { timeout })
      .catch(() => {});

    // Step 2: Wait for network requests to go idle (no ongoing XHR/fetch)
    await page.waitForLoadState("networkidle", { timeout }).catch(() => {});

    // Step 3: Wait for document.readyState === 'complete'
    await page
      .waitForFunction(() => document.readyState === "complete", null, {
        timeout,
      })
      .catch(() => {});

    // Step 4: Wait for layout reflows and animations to settle
    // (Short buffer to ensure transitions, rendering, or hydration are done)
    await page.waitForTimeout(300);

    // Step 5: Validate the page is actually interactable
    const isInteractive = await page
      .evaluate(() => {
        try {
          return (
            Boolean(document.body) &&
            document.visibilityState === "visible" &&
            !document.hidden
          );
        } catch {
          return false;
        }
      })
      .catch(() => false);

    if (!isInteractive) {
      console.warn(
        "[waitForPageStable] Page might not be fully interactive yet."
      );
    }
  }
  /**
   * @author Rohit Singh
   * @created 22-Dec-2025
   * @description Generate random alphanumeric string of specified length
   * @param length Length of the random string (default: 8)
   * @returns Random alphanumeric string
   */
  async generateRandomString(length: number = 4): Promise<string> {
    const characters = "abcdefghijklmnopqrstuvwxyz";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length)
      );
    }
    console.log(`Generated random string [a-z]: ${result}`);
    return result;
  }
  
/** 
*@author Deepak Bohra
*@created 2026-01-13
*@description Gets the current date and time formatted as "YYYY-MM-DD HH:MM:SS" in CST + 1 hour timezone.
*/

  async getCstPlusOneFormatted(): Promise<string> {
    const nowUtcMs = Date.now(); // Current UTC time in milliseconds
    const offsetMs = -5 * 60 * 60 * 1000; // UTC-05:00 (CST + 1 hour)
    const d = new Date(nowUtcMs + offsetMs);

    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    const hour = String(d.getUTCHours()).padStart(2, "0");
    const minute = String(d.getUTCMinutes()).padStart(2, "0");
    const second = String(d.getUTCSeconds()).padStart(2, "0");

    return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
  }

/** 
*@author Deepak Bohra
*@created 2026-01-13
*@description Parses a date string in "YYYY-MM-DD HH:mm:ss" format into a Date object.
*/
  // Parse "YYYY-MM-DD HH:mm:ss" into Date (synchronous)
  parseDate(s: string): Date {
    const trimmed = s.trim();
    console.log(`[parseDate] Input string: "${trimmed}"`);
    
    // Try direct parsing first (for ISO formats)
    let date = new Date(trimmed);
    if (!isNaN(date.getTime())) {
      console.log(`[parseDate] ✅ Successfully parsed as ISO: ${date.toISOString()}`);
      return date;
    }
    
    // Convert "YYYY-MM-DD HH:mm:ss" to ISO "YYYY-MM-DDTHH:mm:ss"
    const isoString = trimmed.replace(" ", "T");
    console.log(`[parseDate] Converted to ISO format: "${isoString}"`);
    
    date = new Date(isoString);
    if (!isNaN(date.getTime())) {
      console.log(`[parseDate] ✅ Successfully parsed: ${date.toISOString()}`);
      return date;
    }
    
    console.error(`[parseDate] ❌ Failed to parse date "${trimmed}"`);
    throw new Error(`Invalid date format: "${trimmed}". Expected format: YYYY-MM-DD HH:mm:ss`);
  }

  /*
  /autohr Deepak Bohra
  @created 2026-01-13
  @description Checks if two date strings differ by 60 seconds or less.
  */

  // Check if two dates differ by <= 60 seconds
  isWithinOneMinute(date1: string, date2: string): boolean {
    const d1 = this.parseDate(date1);
    const d2 = this.parseDate(date2);
    console.log(`Comparing dates: ${d1.toISOString()} and ${d2.toISOString()}`);
    const diffSeconds = Math.abs(d1.getTime() - d2.getTime()) / 1000;
    return diffSeconds <= 60;
  }

  /*
  author Deepak Bohra
  @created 2026-01-13
  @description Checks if two date strings differ by specified number of seconds or less.
  @param date1 - First date string in "YYYY-MM-DD HH:mm:ss" format
  @param date2 - Second date string in "YYYY-MM-DD HH:mm:ss" format
  @param toleranceSeconds - Maximum allowed difference in seconds (default: 60)
  @returns boolean - True if difference is within tolerance, false otherwise
  */
  isWithinTimeRange(date1: string, date2: string, toleranceSeconds: number = 60): boolean {
    try {
      const d1 = this.parseDate(date1);
      const d2 = this.parseDate(date2);
      const diffSeconds = Math.abs(d1.getTime() - d2.getTime()) / 1000;
      console.log(`[isWithinTimeRange] Comparing dates: ${d1.toISOString()} and ${d2.toISOString()}`);
      console.log(`[isWithinTimeRange] Difference: ${diffSeconds} seconds (tolerance: ${toleranceSeconds} seconds)`);
      const isWithinRange = diffSeconds <= toleranceSeconds;
      console.log(`[isWithinTimeRange] Result: ${isWithinRange ? '✅ PASS' : '❌ FAIL'}`);
      return isWithinRange;
    } catch (error) {
      console.error(`[isWithinTimeRange] Error comparing dates: ${error}`);
      return false;
    }
  }
  
  /**
   * @author Rohit Singh
   * @created 2025-12-19
   * Generates a date-time string in the format YYYYMMDDHHMM.
   * @returns A string representing the current date and time.
   */
    async generateUniqueNumber(): Promise<string> {
        const now = new Date();
        const year = now.getFullYear().toString(); // Full year
        const month = (now.getMonth() + 1).toString().padStart(2, '0'); // Month (01-12)
        const day = now.getDate().toString().padStart(2, '0'); // Day (01-31)
        const hours = now.getHours().toString().padStart(2, '0'); // Hours (00-23)
        const minutes = now.getMinutes().toString().padStart(2, '0'); // Minutes (00-59)
        const dateTime = `${year}${month}${day}${hours}${minutes}`;
        return dateTime;
    }
}
const commonReusables = new CommonReusables();
export default commonReusables;
