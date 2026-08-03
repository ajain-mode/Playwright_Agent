import { expect, Locator, Page } from "@playwright/test";
import commonReusables from "@utils/commonReusables";

/**
 * Customer Master → MORE EDI PREFS (`cust_edi_prefs.php`).
 * Locators from mono `cust_edi_prefs.php` / `CustomerMaster::EDI204_CHANGE_ORDER_*`.
 * @author AI Agent
 * @created 2026-07-17
 */
export default class CustomerEdiPrefsPage {
  private readonly moreEdiPrefsLink_LOC: Locator;
  private readonly editButton_LOC: Locator;
  private readonly saveButton_LOC: Locator;
  private readonly form_LOC: Locator;
  private readonly applyChangeOrdersSelect_LOC: Locator;

  private readonly placeNewLoadOnHoldLabel_LOC: Locator;
  private readonly placeNewLoadOnHoldSelect_LOC: Locator;

  constructor(private readonly page: Page) {
    // custmastform.php — MORE EDI PREFS anchor
    this.moreEdiPrefsLink_LOC = page.getByRole("link", { name: /MORE EDI PREFS/i });
    // cust_edi_prefs.php header — rendered as buttons (View / Edit / Save)
    this.editButton_LOC = page.getByRole("button", { name: /^Edit$/i });
    this.saveButton_LOC = page.getByRole("button", { name: /^Save$/i });
    this.form_LOC = page.locator("#cust_edi_prefs_form");
    // selectbox1('edi204_apply_change_orders_to_load', ...) — only in edit mode
    this.applyChangeOrdersSelect_LOC = page.locator(
      'select[name="edi204_apply_change_orders_to_load"]',
    );
    // cust_edi_prefs.php — label cell + selectbox1('place_new_load_on_hold_when_204_auto_accepted', ...)
    this.placeNewLoadOnHoldLabel_LOC = page
      .locator("td.fn")
      .filter({ hasText: EDI_PREFS.PLACE_NEW_LOAD_ON_HOLD.LABEL });
    this.placeNewLoadOnHoldSelect_LOC = page.locator(
      'select[name="place_new_load_on_hold_when_204_auto_accepted"]',
    );
  }

  /**
   * Opens MORE EDI PREFS from View Master Customer.
   * @author AI Agent
   * @created 2026-07-17
   * Locator source: custmastform.php `$ht['edi_prefs_link']`
   */
  async clickMoreEdiPrefsLink(): Promise<void> {
    await this.moreEdiPrefsLink_LOC.waitFor({ state: "visible", timeout: WAIT.LARGE });
    await this.moreEdiPrefsLink_LOC.click();
    await commonReusables.waitForPageStable(this.page);
    await this.form_LOC.or(this.editButton_LOC).first().waitFor({
      state: "visible",
      timeout: WAIT.LARGE,
    });
  }

  /**
   * Switches EDI Prefs to edit mode.
   * @author AI Agent
   * @created 2026-07-17
   * Locator source: cust_edi_prefs.php Edit button `value=" Edit "`
   */
  async clickEdit(): Promise<void> {
    // Already in edit mode when Apply Change Orders select is present
    if (await this.applyChangeOrdersSelect_LOC.isVisible().catch(() => false)) {
      return;
    }
    await this.editButton_LOC.first().waitFor({
      state: "visible",
      timeout: WAIT.LARGE,
    });
    await this.editButton_LOC.first().click();
    await commonReusables.waitForPageStable(this.page);
    await this.applyChangeOrdersSelect_LOC.waitFor({
      state: "visible",
      timeout: WAIT.LARGE,
    });
  }

  /**
   * Sets Apply 204 Change Orders To Load (YES/NO via option value 1/0).
   * @author AI Agent
   * @created 2026-07-17
   * @param enabled When true selects YES (value 1)
   * Locator source: cust_edi_prefs.php `name="edi204_apply_change_orders_to_load"`
   */
  async setApplyChangeOrdersToLoad(enabled: boolean): Promise<void> {
    await this.applyChangeOrdersSelect_LOC.waitFor({
      state: "visible",
      timeout: WAIT.DEFAULT,
    });
    // Prefer label YES/NO; fall back to 1/0 values used by selectbox1
    try {
      await this.applyChangeOrdersSelect_LOC.selectOption({
        label: enabled ? /YES/i : /NO/i,
      });
    } catch {
      await this.applyChangeOrdersSelect_LOC.selectOption(enabled ? "1" : "0");
    }
    const selected = await this.applyChangeOrdersSelect_LOC.inputValue();
    console.log(`Apply 204 Change Orders To Load selected value: ${selected}`);
  }

  /**
   * Checks or unchecks a 204 Change Order Types option.
   * @author AI Agent
   * @created 2026-07-17
   * @param optionValue One of replace|reissue|change
   * @param checked Desired checked state
   * Locator source: CustomerMaster::EDI204_CHANGE_ORDER_TYPES → `edi204_change_order_types[]`
   */
  async setChangeOrderType(
    optionValue: string,
    checked: boolean,
  ): Promise<void> {
    const box = this.page.locator(
      `input[name="edi204_change_order_types[]"][value="${optionValue}"]`,
    );
    await box.waitFor({ state: "visible", timeout: WAIT.DEFAULT });
    if (checked) {
      await box.check();
    } else {
      await box.uncheck();
    }
  }

  /**
   * Checks or unchecks a Load Statuses to Update option.
   * @author AI Agent
   * @created 2026-07-17
   * Locator source: `edi204_change_order_load_statuses[]`
   */
  async setLoadStatusToUpdate(
    optionValue: string,
    checked: boolean,
  ): Promise<void> {
    const box = this.page.locator(
      `input[name="edi204_change_order_load_statuses[]"][value="${optionValue}"]`,
    );
    await box.waitFor({ state: "visible", timeout: WAIT.DEFAULT });
    if (checked) {
      await box.check();
    } else {
      await box.uncheck();
    }
  }

  /**
   * Checks or unchecks a Stop Details change-order option.
   * @author AI Agent
   * @created 2026-07-17
   * @param optionValue stops|datetimes|items|ref|loc|fees|replace_stops
   * Locator source: CustomerMaster::EDI204_CHANGE_ORDER_STOP_DETAILS
   */
  async setStopDetailOption(
    optionValue: string,
    checked: boolean,
  ): Promise<void> {
    const box = this.page.locator(
      `input[name="edi204_change_order_stop_details[]"][value="${optionValue}"]`,
    );
    await box.waitFor({ state: "visible", timeout: WAIT.DEFAULT });
    if (checked) {
      await box.check();
    } else {
      await box.uncheck();
    }
  }

  /**
   * Unchecks all Stop Details options, then applies the provided checked set.
   * @author AI Agent
   * @created 2026-07-17
   * @param enabledValues Values that should remain checked
   */
  async setStopDetailsExclusive(enabledValues: string[]): Promise<void> {
    const all = this.page.locator(
      'input[name="edi204_change_order_stop_details[]"]',
    );
    const count = await all.count();
    // Uncheck first so enabling "stops" does not leave sibling boxes stuck disabled+checked
    for (let i = 0; i < count; i++) {
      const box = all.nth(i);
      if (await box.isDisabled().catch(() => true)) {
        continue;
      }
      if (await box.isChecked()) {
        await box.uncheck();
      }
    }
    for (const value of enabledValues) {
      const box = this.page.locator(
        `input[name="edi204_change_order_stop_details[]"][value="${value}"]`,
      );
      if (await box.isDisabled().catch(() => true)) {
        console.log(`Skipping disabled Stop Details option: ${value}`);
        continue;
      }
      await box.check();
    }
  }

  /**
   * Saves EDI Prefs form.
   * @author AI Agent
   * @created 2026-07-17
   * Locator source: cust_edi_prefs.php submit `value=" Save "`, hidden `p=update`
   */
  async clickSave(): Promise<void> {
    const saveInForm = this.form_LOC.locator(
      'input[type="submit"][name="button"][value*="Save"]',
    );
    const saveBtn = (await saveInForm.count()) > 0
      ? saveInForm.first()
      : this.saveButton_LOC.first();
    await saveBtn.waitFor({ state: "visible", timeout: WAIT.DEFAULT });
    await saveBtn.click();
    await commonReusables.waitForPageStable(this.page);
  }

  /**
   * Asserts the "Place new load on hold when 204 auto-accepted" label is visible
   * on More EDI Prefs (view or edit).
   * @author AI Agent
   * @created 2026-07-29
   * Locator source: cust_edi_prefs.php `td.fn` label text
   */
  async assertPlaceNewLoadOnHoldFieldVisible(): Promise<void> {
    await this.placeNewLoadOnHoldLabel_LOC.first().scrollIntoViewIfNeeded();
    await expect(this.placeNewLoadOnHoldLabel_LOC.first()).toBeVisible({
      timeout: WAIT.LARGE,
    });
  }

  /**
   * Returns true when the hold field is a single-select `<select>` (not multi/checkbox/text/radio).
   * @author AI Agent
   * @created 2026-07-29
   * @returns Whether the control is a non-multiple select
   * Locator source: cust_edi_prefs.php `selectbox1('place_new_load_on_hold_when_204_auto_accepted', ...)`
   */
  async isPlaceNewLoadOnHoldSingleSelectDropdown(): Promise<boolean> {
    await this.placeNewLoadOnHoldSelect_LOC.waitFor({
      state: "visible",
      timeout: WAIT.LARGE,
    });
    const tagName = await this.placeNewLoadOnHoldSelect_LOC.evaluate(
      (el) => el.tagName,
    );
    const multiple = await this.placeNewLoadOnHoldSelect_LOC.getAttribute(
      "multiple",
    );
    console.log(
      `Place new load on hold control tag=${tagName}, multiple=${multiple}`,
    );
    return tagName.toUpperCase() === "SELECT" && multiple === null;
  }

  /**
   * Reads option labels from the hold dropdown (edit mode).
   * @author AI Agent
   * @created 2026-07-29
   * @returns Option label texts in display order
   * Locator source: cust_edi_prefs.php selectbox1 options `0=>NO`, `1=>YES`
   */
  async getPlaceNewLoadOnHoldOptionLabels(): Promise<string[]> {
    await this.placeNewLoadOnHoldSelect_LOC.waitFor({
      state: "visible",
      timeout: WAIT.DEFAULT,
    });
    return this.placeNewLoadOnHoldSelect_LOC.locator("option").allTextContents();
  }

  /**
   * Reads the selected option label for the hold dropdown (edit mode).
   * @author AI Agent
   * @created 2026-07-29
   * @returns Selected option label (YES/NO)
   * Locator source: cust_edi_prefs.php `name="place_new_load_on_hold_when_204_auto_accepted"`
   */
  async getPlaceNewLoadOnHoldSelectedLabel(): Promise<string> {
    await this.placeNewLoadOnHoldSelect_LOC.waitFor({
      state: "visible",
      timeout: WAIT.DEFAULT,
    });
    const value = await this.placeNewLoadOnHoldSelect_LOC.inputValue();
    const label = await this.placeNewLoadOnHoldSelect_LOC
      .locator(`option[value="${value}"]`)
      .textContent();
    return (label || "").trim();
  }

  /**
   * Selects YES or NO on the hold dropdown (edit mode).
   * @author AI Agent
   * @created 2026-07-29
   * @param optionLabel YES or NO (use EDI_PREFS.PLACE_NEW_LOAD_ON_HOLD.*)
   * Locator source: cust_edi_prefs.php selectbox1 `0=>NO`, `1=>YES`
   */
  async selectPlaceNewLoadOnHoldOption(optionLabel: string): Promise<void> {
    await this.placeNewLoadOnHoldSelect_LOC.waitFor({
      state: "visible",
      timeout: WAIT.DEFAULT,
    });
    await this.placeNewLoadOnHoldSelect_LOC.selectOption({ label: optionLabel });
    const selected = await this.getPlaceNewLoadOnHoldSelectedLabel();
    console.log(`Place new load on hold selected: ${selected}`);
  }

  /**
   * Configures common auto-204 change-order preconditions for FD-34965 family.
   * @author AI Agent
   * @created 2026-07-17
   * @param stopDetailValues Stop Details checkbox values to enable
   * @param enableReplaceStopsWhenMismatch When false, unchecks replace_stops
   */
  async configureChangeOrderPreconditions(options: {
    stopDetailValues: string[];
    enableReplaceStopsWhenMismatch: boolean;
  }): Promise<void> {
    await this.clickEdit();
    await this.setApplyChangeOrdersToLoad(true);
    for (const type of [
      EDI_PREFS.CHANGE_ORDER_TYPE.REPLACE,
      EDI_PREFS.CHANGE_ORDER_TYPE.REISSUE,
      EDI_PREFS.CHANGE_ORDER_TYPE.CHANGE,
    ]) {
      await this.setChangeOrderType(type, true);
    }
    // Enable every visible Load Statuses to Update option (status after Accept varies)
    const statusBoxes = this.page.locator(
      'input[name="edi204_change_order_load_statuses[]"]',
    );
    const statusCount = await statusBoxes.count();
    for (let i = 0; i < statusCount; i++) {
      const box = statusBoxes.nth(i);
      if (await box.isDisabled().catch(() => true)) {
        continue;
      }
      await box.check();
    }
    const stopValues = [...options.stopDetailValues];
    // UI disables replace_stops when "stops" (full replace) is selected — do not force it
    if (
      options.enableReplaceStopsWhenMismatch &&
      !stopValues.includes(EDI_PREFS.STOP_DETAIL.STOPS_INCLUDING_FEES_ITEMS) &&
      !stopValues.includes(EDI_PREFS.STOP_DETAIL.REPLACE_STOPS)
    ) {
      stopValues.push(EDI_PREFS.STOP_DETAIL.REPLACE_STOPS);
    }
    await this.setStopDetailsExclusive(stopValues);
    if (!options.enableReplaceStopsWhenMismatch) {
      const replaceStops = this.page.locator(
        `input[name="edi204_change_order_stop_details[]"][value="${EDI_PREFS.STOP_DETAIL.REPLACE_STOPS}"]`,
      );
      if (
        (await replaceStops.isVisible().catch(() => false)) &&
        !(await replaceStops.isDisabled().catch(() => true))
      ) {
        await replaceStops.uncheck();
      }
    }
    // Log checked Stop Details before save (diagnose disabled/unchecked "stops")
    const allStops = this.page.locator(
      'input[name="edi204_change_order_stop_details[]"]',
    );
    const stopCount = await allStops.count();
    const checkedStops: string[] = [];
    for (let i = 0; i < stopCount; i++) {
      const box = allStops.nth(i);
      if (await box.isChecked().catch(() => false)) {
        checkedStops.push((await box.getAttribute("value")) || "");
      }
    }
    console.log(`EDI Prefs Stop Details checked before save: ${checkedStops.join(",")}`);
    await this.clickSave();
    await expect.soft(this.form_LOC).toBeVisible({ timeout: WAIT.LARGE });
  }
}
