/**
 * @author Avanish Srivastava
 * @description Finance Page Object - Handles actions related to finance tab
 */

import { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";
import commonReusables from "@utils/commonReusables";
import CustomerPage from "@pages/customers/CustomerPage";
import EditCustomerPage from "@pages/customers/EditCustomerPage";
import ViewCustomerPage from "@pages/customers/ViewCustomerPage";


class FinancePage {
    private readonly financeSiteMenu_LOC: Locator;
    private readonly officeCommissionLink_LOC: Locator;
    private readonly presetLink_LOC: Locator;
    private readonly thisWeekCommissionLink_LOC: Locator;
    private readonly searchCommissionButton_LOC: Locator;
    private readonly holdUnholdButton_LOC: Locator;
    private readonly holdCommTextAreaInput_LOC: Locator;
    private readonly holdUnholdSubmitButton_LOC: Locator;
    private readonly officeCommissionAgentText_LOC: Locator;
    private readonly auditApproveButton_LOC: Locator;
    private readonly commissionRecordsTable_LOC: Locator;
    private readonly commissionHoldStatusValue_LOC: Locator;
    private readonly firstRowCommissionDataValue_LOC: Locator;
    private readonly agentOfficeSearchButton_LOC: Locator;
    private readonly agentOfficeInput_LOC: Locator;
    private readonly commissionAuditDropdownSuggestionValue_LOC: (value: string) => Locator;
    private readonly commissionAuditSearchButton_LOC: Locator;
    private readonly commissionAuditQueueLink_LOC: Locator;
    private readonly commissionAuditStatus_LOC: Locator;
    private readonly customerAuditRowsValue_LOC: Locator;
    private readonly commissionAdjustButton_LOC: Locator
    private readonly commissionAdjustAmountInput_LOC: Locator;
    private readonly adjustCommissionSubmitButton_LOC: Locator;
    private readonly commissionRowValue_LOC: any;
    private readonly commissionIdValue_LOC: Locator;
    private readonly allOfficeAdjustmentValue_LOC: Locator;
    private readonly officeAdjustmentTypeValue_LOC: any;
    private readonly officeAdjustmentAmountValue_LOC: any;
    private readonly officeAdjustmentIdValue_LOC: any;
    private readonly operationalValue_LOC: Locator;
    private readonly commissionCodeCombobox_LOC: any;
    private readonly rowValue_LOC: any;
    private readonly leadsRequestingLink_LOC: any;
    private readonly agentItemValue_LOC: any;

    /**
     * @author Rohit Singh
     * @created 2025-08-19
     * @description Finance Page Object - Handles actions related to finance tab
     */
    private readonly customerIdInput_LOC: Locator;
    private readonly customerNameInput_LOC: Locator;
    private readonly searchButton_LOC: Locator;
    private readonly customerSearchedNameDropdown_LOC: Locator;




    LoadMenuList: (menuname: string) => Locator;

    constructor(private page: Page) {
        this.financeSiteMenu_LOC = page.locator("//a[normalize-space()='Finance']");
        this.officeCommissionLink_LOC = page.locator("//a[normalize-space(text())='Office Commissions Summary']");
        this.presetLink_LOC = page.locator("#commlink");
        this.thisWeekCommissionLink_LOC = page.locator("//a[normalize-space()='Today']");
        this.searchCommissionButton_LOC = page.locator("//input[@class='submit-report-search']");
        this.holdUnholdButton_LOC = page.locator("//input[@data-target='#holdCommission']");
        this.holdCommTextAreaInput_LOC = page.locator("textarea[name='hold_commission_description']");
        this.holdUnholdSubmitButton_LOC = page.locator("//input[@class='process_checked_records_btn hold_commission_submit']");
        this.officeCommissionAgentText_LOC = page.locator("tbody > tr.dnd-moved.odd[role='row']");
        this.auditApproveButton_LOC = page.locator("//input[@class='process_checked_records_btn'][@value='APPROVE']");
        this.commissionRecordsTable_LOC = page.locator('//table[@id="example"]');
        this.commissionHoldStatusValue_LOC = page.locator("//td[contains(text(), 'HOLD')]");
        this.firstRowCommissionDataValue_LOC = this.commissionRecordsTable_LOC.locator("tbody tr:nth-child(1) td:nth-child(9)");
        this.agentOfficeSearchButton_LOC = page.locator('#agent_office_magic .ms-trigger');
        this.commissionAuditSearchButton_LOC = page.locator("#customer_audit_status_magic .ms-trigger");
        this.agentOfficeInput_LOC = page.locator('#agent_office_magic input[type="text"]');
        this.commissionAuditDropdownSuggestionValue_LOC = (value: string) => page.locator('.ms-sel-item', { hasText: value });
        this.commissionAuditQueueLink_LOC = page.locator("//a[normalize-space()='Commission Audit Queue']");
        this.commissionAuditStatus_LOC = page.locator("//td[text()='Commission Audit Status']/following-sibling::td//b");
        this.customerAuditRowsValue_LOC = page.locator('#example tbody tr');
        this.commissionAdjustButton_LOC = page.locator("input[value='ADJUST']");
        this.commissionAdjustAmountInput_LOC = page.locator("input[name='adjust_commission_amount']");
        this.adjustCommissionSubmitButton_LOC = page.locator("//input[@name='adjust_commission_submit']");
        this.commissionRowValue_LOC = ".process_checkbox";
        this.commissionIdValue_LOC = page.locator("input[type='checkbox'].process_checkbox:checked");
        this.allOfficeAdjustmentValue_LOC = page.locator("tr:has(td:nth-child(5):has-text('OFFICE_ADJUSTMENT'))");
        this.officeAdjustmentTypeValue_LOC = "td:nth-child(5)";
        this.officeAdjustmentAmountValue_LOC = "td:nth-child(25)";
        this.officeAdjustmentIdValue_LOC = "td:nth-child(3)"
        this.operationalValue_LOC = page.locator(
            "//*[@id='adjustOfficeCommission']//div[@class='slider-container']/div[@class='slider slider-horizontal']/div[@class='slider-track']/div[@class='slider-selection']");
        this.commissionCodeCombobox_LOC = "select[name='adjust_commission_code']";
        this.rowValue_LOC = 'td';
        this.LoadMenuList = (menuname: string) => {
            return this.page.getByRole('link', { name: menuname })
        }
        this.leadsRequestingLink_LOC = page.locator(
            "//td[@class='maincell']//a[contains(text(), 'Leads Requesting Clearance:')]");
        this.agentItemValue_LOC = '.ms-res-item';

        /**
         * @author Rohit Singh
         * @created 2025-08-19
         * @description Finance Page Object - Handles actions related to finance tab
         * @modified 2015-08-26
         */
        this.customerIdInput_LOC = page.locator('#search_custm_id');
        this.customerNameInput_LOC = page.locator('#cm_search_name');
        this.customerSearchedNameDropdown_LOC = page.locator("#search_names");
        this.searchButton_LOC = page.locator("//form[@name='custsearch']//input[@value='Search']");
    }

    /**
 * Hovers over the 'Finance' menu to trigger any hover-based UI changes.
 * 
 * @throws Error if the Finance menu is not visible within the expected timeout.
 * 
 * @author Avanish Srivastava
 * @created 2025-08-01
 */
    async hoverOverFinanceMenu() {
        const financeMenu = this.financeSiteMenu_LOC;
        await financeMenu.waitFor({ state: 'visible' });
        await financeMenu.hover();
    }

    //     /**
    //  * Hovers over the 'Finance' menu and then clicks it.
    //  * Useful when the menu requires hover before becoming clickable.
    //  * 
    //  * @throws Error if the Finance menu is not visible or fails to respond to interaction.
    //  * 
    //  * @author Avanish Srivastava
    //  * @created 2025-08-01
    //  */
    //     async hoverAndClickFinanceMenu() {
    //         const financeMenu = this.financeSiteMenu_LOC;
    //         await financeMenu.waitFor({ state: 'visible', timeout: WAIT.DEFAULT * 3 });
    //         await financeMenu.hover();
    //         await financeMenu.click();
    //     }

    // /**
    //  * Clicks on the 'Payables' link in the finance menu.
    //  * @author Avanish Srivastava
    //  * @created 2025-08-01
    //  */

    // async clickPayables(): Promise<void> {
    //     await this.payablesLink_LOC.waitFor({ state: 'visible' });
    //     await this.payablesLink_LOC.click();
    // }

    /**
     * Clicks on the 'Commission Audit Queue' link in the finance menu.
     * @author Avanish Srivastava
     * @created 2025-08-01
     */

    async clickCommissionAuditQueue(): Promise<void> {
        await this.commissionAuditQueueLink_LOC.waitFor({ state: 'visible' });
        await this.commissionAuditQueueLink_LOC.click();
    }

    /**
 * Clicks on the 'Commission Summary' or office commission link/button 
 * and waits for the page to fully load after navigation.
 * 
 * @throws Error if the element is not visible or the page fails to load.
 * 
 * @author Avanish Srivastava
 * @created 2025-08-01
 */
    async clickCommsionSummary() {
        await this.officeCommissionLink_LOC.waitFor({ state: 'visible' });
        await this.officeCommissionLink_LOC.click();
        await this.page.waitForLoadState('load');
    }

    /**
 * Clicks on the 'Preset Search' dropdown or filter to open the available options.
 * 
 * @throws Error if the element is not visible within the wait time.
 * 
 * @author Avanish Srivastava
 * @created 2025-08-01
 */
    async clickOnPresetSearch() {
        await this.presetLink_LOC.waitFor({ state: 'visible' });
        await this.presetLink_LOC.click();
    }

    /**
 * Clicks on the 'This Week' preset filter option to apply the date range filter.
 * 
 * @throws Error if the 'This Week' option is not visible before clicking.
 * 
 * @author Avanish Srivastava
 * @created 2025-08-01
 */
    async clickOnThisWeek() {
        await this.thisWeekCommissionLink_LOC.waitFor({ state: 'visible' });
        await this.thisWeekCommissionLink_LOC.click();
    }


    //     /**
    //  * Clicks on the 'Last Week' preset filter option to apply the date range filter.
    //  * 
    //  * @throws Error if the 'Last Week' option is not visible before clicking.
    //  * 
    //  * @author Avanish Srivastava
    //  * @created 2025-08-01
    //  */
    //     async clickOnLastWeek() {
    //         await this.lastWeekCommissionLink_LOC.waitFor({ state: 'visible' });
    //         await this.lastWeekCommissionLink_LOC.click();
    //         await this.page.keyboard.press('Enter');
    //     }

    /**
 * Selects the given agent office from the dropdown using provided value.
 * Assumes the dropdown is open and suggestions are available.
 * @param value - The agent office name (from external data).
 * @author Avanish Srivastava
 * @created 2025-08-01
 */
    async selectAgentOffice(value: string): Promise<void> {
        try {
            console.log(`Selecting agent office: ${value}`);
            await this.agentOfficeSearchButton_LOC.waitFor({ state: 'visible' });
            await this.agentOfficeSearchButton_LOC.click();
            await this.agentOfficeInput_LOC.waitFor({ state: 'visible' });
            await this.agentOfficeInput_LOC.clear();
            await this.agentOfficeInput_LOC.fill(value);
            await this.page.waitForTimeout(1000);
            const strategies = [
                () => this.page.locator(this.agentItemValue_LOC)
                    .filter({ hasText: value })
                    .filter({ hasNotText: 'sub of' })
                    .first(),
                () => this.page.locator(this.agentItemValue_LOC)
                    .filter({ hasText: value })
                    .first(),
                () => this.page.locator(this.agentItemValue_LOC).first()
            ];

            for (let i = 0; i < strategies.length; i++) {
                const locator = strategies[i]();

                if (await locator.count() > 0) {
                    await locator.click();
                    console.log(`Selected using strategy ${i + 1}`);
                    return;
                }
            }

            throw new Error(`No options found for: ${value}`);

        } catch (error) {
            console.error(`Failed to select agent office: ${error}`);
            throw error;
        }
    }


    //     /**
    //  * Selects the given commission Status from the dropdown using provided value.
    //  * Assumes the dropdown is open and suggestions are available.
    //  * @param value - The Status (from external data).
    //  * @author Avanish Srivastava
    //  * @created 2025-08-01
    //  */
    //     async selectCommissionStatus(value: string): Promise<void> {
    //         await this.commissionStatusSearchButton_LOC.waitFor({ state: 'visible' });
    //         await this.commissionStatusSearchButton_LOC.click();
    //         await this.commissionStatusInput_LOC.waitFor({ state: 'visible' });
    //         await this.commissionStatusInput_LOC.fill(value);
    //         await this.commissionStatusDropdownSuggestionValue_LOC(value).click();
    //     }

    /**
 * Clicks the 'Search' button on the commission page and waits for the page to load completely.
 * 
 * @throws Error if the search button is not visible or the page fails to load.
 * 
 * @author Avanish Srivastava
 * @created 2025-08-01
 * @modified 2025-09-12
 */
    async clickOnSearch(): Promise<void> {
        try {
            console.log('Initiating Commission Search ..');
            await this.searchCommissionButton_LOC.waitFor({ state: 'visible' });
            await this.searchCommissionButton_LOC.click();
            await Promise.all([
                this.page.waitForLoadState('load'),
                this.page.waitForLoadState('domcontentloaded'),
                this.page.waitForLoadState('networkidle', { timeout: WAIT.DEFAULT * 3 }).catch(() => {
                    console.log('Network idle timeout - continuing anyway');
                })
            ]);
            await this.waitForSearchResults();
            console.log('Search completed and results loaded');
        } catch (error) {
            console.error('Search failed:', error);
            throw error;
        }
    }

    /**
  * Selects the current commission by clicking on the checkbox or radio button
  * associated with the commission row. Waits for visibility before clicking.
  * 
  * @throws Error if the selection element is not visible.
  * 
  * @author Avanish Srivastava
  * @modified 2025-09-12
  */
    async selectCurrentCommission(): Promise<void> {
        const maxRetries = 3;
        let lastError: Error | null = null;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`Selecting commission (Attempt ${attempt}/${maxRetries})`);
                if (await this.trySelectById()) {
                    console.log('Commission selected using ID selector');
                    return;
                }
                if (await this.trySelectByClass()) {
                    console.log('Commission selected using class selector');
                    return;
                }
                if (await this.trySelectFirstAvailable()) {
                    console.log('Commission selected using first available');
                    return;
                }
                throw new Error('All selection strategies failed');

            } catch (error) {
                lastError = error as Error;
                console.warn(`Attempt ${attempt} failed: ${error}`);

                if (attempt < maxRetries) {
                    console.log('Retrying in 3 seconds...');
                    await new Promise(resolve => setTimeout(resolve, WAIT.DEFAULT * 5));
                }
            }
        }

        console.error(`Failed to select commission after ${maxRetries} attempts`);
        throw new Error(`Commission selection failed: ${lastError?.message}`);
    }

    private async trySelectById(): Promise<boolean> {
        try {
            const checkbox = this.page.locator("#cb1");

            await checkbox.waitFor({ state: 'visible', timeout: WAIT.DEFAULT * 7 });
            await checkbox.waitFor({ state: 'attached', timeout: WAIT.DEFAULT * 2 });

            const isChecked = await checkbox.isChecked();
            if (isChecked) {
                console.log('Commission already selected');
                return true;
            }

            await checkbox.scrollIntoViewIfNeeded();
            await checkbox.check({ force: true });
            const isNowChecked = await checkbox.isChecked();
            return isNowChecked;
        } catch (error) {
            console.log(`ID strategy failed: ${error}`);
            return false;
        }
    }

    private async trySelectByClass(): Promise<boolean> {
        try {
            const checkbox = this.page.locator('input[type="checkbox"].process_checkbox').first();
            await checkbox.waitFor({ state: 'visible', timeout: WAIT.DEFAULT * 3 });
            const isChecked = await checkbox.isChecked();
            if (isChecked) {
                console.log('Commission already selected (class selector)');
                return true;
            }
            await checkbox.scrollIntoViewIfNeeded();
            await checkbox.check({ force: true });
            return await checkbox.isChecked();
        } catch (error) {
            console.log(`Class strategy failed: ${error}`);
            return false;
        }
    }

    private async trySelectFirstAvailable(): Promise<boolean> {
        try {
            await this.page.waitForSelector('input[type="checkbox"]', {
                state: 'visible',
                timeout: WAIT.DEFAULT * 3
            });
            const checkboxes = this.page.locator('input[type="checkbox"]:visible');
            const count = await checkboxes.count();
            if (count === 0) {
                return false;
            }
            console.log(`Found ${count} checkboxes, selecting first available`);
            for (let i = 0; i < count; i++) {
                const checkbox = checkboxes.nth(i);
                try {
                    const isEnabled = await checkbox.isEnabled();
                    if (!isEnabled) continue;
                    const isChecked = await checkbox.isChecked();
                    if (isChecked) {
                        console.log(`Checkbox ${i} already selected`);
                        return true;
                    }
                    await checkbox.scrollIntoViewIfNeeded();
                    await checkbox.check({ force: true });
                    if (await checkbox.isChecked()) {
                        console.log(`Successfully selected checkbox ${i}`);
                        return true;
                    }
                } catch (error) {
                    console.log(`Checkbox ${i} failed: ${error}`);
                    continue;
                }
            }
            return false;
        } catch (error) {
            console.log(`First available strategy failed: ${error}`);
            return false;
        }
    }

    //     /**
    //    * Clicks the first available 'Approve' button for commission approval
    //    * and waits for the page to load after the action.
    //    * 
    //    * @throws Error if the button is not visible or the page does not load in time.
    //    * 
    //    * @author Avanish Srivastava
    //    * @created 2025-08-01
    //    * @modified 2025-08-14
    //    */

    //     async clickOnApprove(): Promise<void> {
    //         try {
    //             console.log('Starting commission approval process...');
    //             await this.approveCommissionButton_LOC.waitFor({ state: 'visible', timeout: WAIT.SMALL });
    //             await this.selectCommissionCheckbox_LOC.waitFor({ state: 'visible', timeout: WAIT.SMALL });
    //             console.log('Clicking approve button...');
    //             await this.approveCommissionButton_LOC.click();
    //             await this.waitForApprovalCompletion();
    //             console.log('Commission approval completed successfully');
    //         } catch (error) {
    //             console.error('Commission approval failed:', error);
    //             throw error;
    //         }
    //     }


    //     async waitForApprovalCompletion(): Promise<void> {
    //         const startTime = Date.now();
    //         try {
    //             console.log('Waiting for approval process to complete...');
    //             await this.waitForLoaderCycle();
    //             await this.waitForSuccessIndicators();
    //             await this.waitForPageStabilization();
    //             const duration = Date.now() - startTime;
    //             console.log(`Approval process completed in ${duration}ms`);
    //         } catch (error) {
    //             const duration = Date.now() - startTime;
    //             console.error(`Approval process failed after ${duration}ms: ${error}`);
    //             throw error;
    //         }
    //     }


    // async waitForLoaderCycle(): Promise<void> {
    //     const loaderSelectors = [
    //         '.loading',
    //         '.loading img[src*="loading3.gif"]',
    //         '.process_checked_records_btn_block .loading',
    //         '[style*="display:none"] img[src*="loading"]',
    //         '.spinner',
    //         '.progress',
    //         '[class*="load"]'
    //     ];

    //     try {
    //         const loaderAppeared = await Promise.race([
    //             this.waitForAnySelector(loaderSelectors, 'visible', 5000),
    //             this.page.waitForTimeout(5000).then(() => false)
    //         ]);
    //         if (loaderAppeared) {
    //             console.log('Loader detected, waiting for completion...');
    //             await this.waitForAllSelectorsToDisappear(loaderSelectors, WAIT.SMALL);
    //             console.log('✓ Loader disappeared');
    //         } else {
    //             console.log('No loader detected, proceeding...');
    //         }
    //     } catch (error) {
    //         console.log('Loader wait failed, continuing with other strategies');
    //     }
    // }

    // async waitForAnySelector(selectors: string[], state: 'visible' | 'hidden', timeout: number): Promise<boolean> {
    //     const promises = selectors.map(selector =>
    //         this.page.waitForSelector(selector, { state, timeout })
    //             .then(() => selector)
    //             .catch(() => null)
    //     );

    //     try {
    //         const result = await Promise.race(promises);
    //         return result !== null;
    //     } catch (error) {
    //         return false;
    //     }
    // }

    // async waitForAllSelectorsToDisappear(selectors: string[], timeout: number): Promise<void> {
    //     const startTime = Date.now();
    //     while (Date.now() - startTime < timeout) {
    //         let anyVisible = false;
    //         for (const selector of selectors) {
    //             try {
    //                 const element = this.page.locator(selector);
    //                 const count = await element.count();
    //                 if (count > 0) {
    //                     const isVisible = await element.first().isVisible();
    //                     if (isVisible) {
    //                         anyVisible = true;
    //                         break;
    //                     }
    //                 }
    //             } catch (error) {
    //                 continue;
    //             }
    //         }
    //         if (!anyVisible) {
    //             return;
    //         }
    //         await new Promise(resolve => setTimeout(resolve, WAIT.DEFAULT));
    //     }
    //     throw new Error('Loaders did not disappear within timeout');
    // }


    // async waitForSuccessIndicators(): Promise<void> {
    //     const successIndicators = [
    //         {
    //             selector: '.checkboxes_processed label',
    //             name: 'Checkboxes Processed Label',
    //         },
    //         {
    //             selector: '.checkboxes_processed ul.success',
    //             name: 'Success List Container'
    //         },
    //         {
    //             selector: '.checkboxes_processed',
    //             name: 'Checkboxes Processed Container'
    //         },
    //         {
    //             selector: '.print-queue-result',
    //             name: 'Print Queue Result'
    //         }
    //     ];
    //     try {
    //         console.log('🔍 Looking for success indicators...');
    //         for (const indicator of successIndicators) {
    //             try {
    //                 const element = this.page.locator(indicator.selector);
    //                 await element.waitFor({ state: 'visible', timeout: WAIT.DEFAULT });
    //                 console.log(`✓ Found success indicator: ${indicator.name}`);
    //                 return;
    //             } catch (error) {
    //                 continue;
    //             }
    //         }
    //         console.log('No explicit success indicators found, checking other signals...');

    //     } catch (error) {
    //         console.log('Success indicator detection failed');
    //     }
    // }

    // async waitForPageStabilization(): Promise<void> {
    //     try {
    //         console.log('Waiting for page stabilization...');
    //         try {
    //             await this.page.waitForLoadState('networkidle', { timeout: WAIT.DEFAULT * 5 }); // 15 seconds max
    //             console.log('✓ Network idle achieved');
    //         } catch (networkError) {
    //             console.log('Network idle timeout, trying DOM content loaded...');
    //         }
    //         try {
    //             await this.page.waitForLoadState('domcontentloaded', { timeout: WAIT.DEFAULT * 3 }); // 10 seconds max
    //             console.log('✓ DOM content loaded');
    //         } catch (domError) {
    //             console.log('DOM content loaded timeout, proceeding...');
    //         }
    //         await this.page.waitForTimeout(WAIT.DEFAULT);
    //         console.log('✓ Page stabilized');
    //     } catch (error) {
    //         console.log('Page stabilization timeout, proceeding anyway...');
    //     }
    // }


    /**
  * Clicks the available 'Approve' button for commission audit approval
  * and waits for the page to load after the action.
  * 
  * @author Avanish Srivastava
  * @created 2025-08-14
  */

    async clickOnCommissionAuditApproveButton() {
        await this.auditApproveButton_LOC.waitFor({ state: 'visible' });
        await Promise.all([
            this.auditApproveButton_LOC.click(),
            this.page.waitForLoadState('networkidle')
        ]);
    }


    //     /**
    //  * Clicks the first available 'Unapprove' button for commission unapproval
    //  * and waits for the page to load after the action.
    //  * 
    //  * @throws Error if the button is not visible or the page does not load in time.
    //  * 
    //  * @author Avanish Srivastava
    //  * @created 2025-08-01
    //  * @modified 2025-09-07
    //  */

    //     async clickOnUnapprove(): Promise<void> {
    //         try {
    //             console.log('Starting commission approval process...');
    //             await this.unapproveCommissionButton_LOC.waitFor({ state: 'visible', timeout: WAIT.SMALL });
    //             await this.selectCommissionCheckbox_LOC.waitFor({ state: 'visible', timeout: WAIT.SMALL });
    //             console.log('Clicking Unapprove button...');
    //             await this.unapproveCommissionButton_LOC.click();
    //             await this.waitForApprovalCompletion();
    //             console.log('Commission approval completed successfully');
    //         } catch (error) {
    //             console.error('Commission approval failed:', error);
    //             throw error;
    //         }
    //     }

    // async clickOnUnapproveButton() {
    //     await this.unapproveCommissionButton_LOC.waitFor({ state: 'visible' });
    //     await this.unapproveCommissionButton_LOC.click();
    // }

    //     /**
    //  * Validates that the success message for approval is displayed with the expected text format.
    //  * Matches text like "Successfully approved commission(s)!" or with count.
    //  * 
    //  * @throws AssertionError if the message does not match within the timeout.
    //  * 
    //  * @author Avanish Srivastava
    //  * @created 2025-08-01
    //  */
    //     async validateApprovalSuccessMessage(): Promise<void> {
    //         await this.approveUnapproveSuccessMessageText_LOC.waitFor({ state: 'visible' });
    //         await expect(this.approveUnapproveSuccessMessageText_LOC).toHaveText(
    //             /Successfully approved(?: \d+)? commission[s]?!/i
    //         );
    //     }

    //     /**
    //  * Validates that the success message for unapproving commission(s) is displayed correctly.
    //  * Accepts variations like "Successfully unapproved commission!" or "Successfully unapproved 2 commissions!"
    //  * 
    //  * @throws AssertionError if the expected message does not appear within the timeout period.
    //  * 
    //  * @author Avanish Srivastava
    //  * @created 2025-08-01
    //  */
    //     async validateUnapprovalSuccessMessage(): Promise<void> {
    //         await this.approveUnapproveSuccessMessageText_LOC.waitFor({ state: 'visible' });
    //         await expect(this.approveUnapproveSuccessMessageText_LOC).toHaveText(
    //             /Successfully unapproved(?: \d+)? commission[s]?!/
    //         );
    //     }

    //     /**
    //  * Clicks on the 'Process Commission' button after waiting for it to become visible.
    //  * 
    //  * @author Avanish Srivastava
    //  * @created 2025-08-01
    //  */
    //     async clickOnProcessCommission() {
    //         await this.processCommissionButton_LOC.waitFor({ state: 'visible' });
    //         await this.processCommissionButton_LOC.click();
    //     }

    //     /**
    //  * Clicks on the 'Submit Commission' button after ensuring it's visible,
    //  * and waits for the network to become idle after the action is triggered.
    //  * 
    //  * @author Avanish Srivastava
    //  * @created 2025-08-01
    //  */
    //     async clickOnSubmitCommission() {
    //         await this.submitCommissionButton_LOC.waitFor({ state: 'visible' });
    //         await this.submitCommissionButton_LOC.click();
    //         await this.page.waitForLoadState('networkidle');
    //     }

    /**
 * Clicks on the 'Commission Office Detail' link or button after it becomes visible.
 * 
 * @author Avanish Srivastava
 * @created 2025-08-01
 */
    async clickOnCommissionOfficeDetail() {
        await this.officeCommissionAgentText_LOC.waitFor({ state: 'visible' });
        await this.officeCommissionAgentText_LOC.click();
    }

    /**
     * Attempts to click the 'Hold/Unhold' button with retry logic.
     * @author Avanish Srivastava
     * @created 2025-08-01
     * @modified 2025-08-10
     */
    async clickOnHoldUnholdBtn() {
        await commonReusables.clickElementWithRetry(this.holdUnholdButton_LOC);
    }

    /**
  * Clicks the 'Hold/Unhold' button after ensuring it's visible on the page.
  * Logs the status and throws an error if the button remains invisible after waiting.
  * 
  * @throws Error if the Hold/Unhold button is not visible after the wait.
  * 
  * @author Avanish Srivastava
  * @created 2025-08-01
  */
    async clickOnHoldUnhold() {
        console.log("Waiting for Hold/Unhold button to become visible...");
        await this.holdUnholdSubmitButton_LOC.waitFor({ state: 'visible' });

        if (await this.holdUnholdSubmitButton_LOC.isVisible()) {
            console.log("Clicking Hold/Unhold button...");
            await this.holdUnholdSubmitButton_LOC.click();
        } else {
            throw new Error("Hold/Unhold button not visible after waiting.");
        }
    }

    /**
 * Enters a value into the 'Hold Comments' text area.
 * Waits for the text area to be visible before filling it with the provided value.
 * 
 * @param value - The text or number to be entered into the hold comment box.
 * 
 * @author Avanish Srivastava
 * @created 2025-08-01
 */
    async enterValueInHoldTextArea(value: string | number): Promise<void> {
        await this.holdCommTextAreaInput_LOC.waitFor({ state: "visible" });
        await this.holdCommTextAreaInput_LOC.fill(String(value));
    }

    /**
 * Retrieves the total commission value from the first row's 9th column in the table.
 * Waits for the element to be visible, extracts and parses the numeric value, and logs it.
 * 
 * @returns The parsed commission value as a number.
 * @throws Error if the value is empty or cannot be parsed.
 * 
 * @author Avanish Srivastava
 * @created 2025-08-01
 */
    async getTotalCommissionValue(): Promise<number> {
        await this.firstRowCommissionDataValue_LOC.waitFor({ state: 'visible' });
        const text = (await this.firstRowCommissionDataValue_LOC.textContent())?.trim();
        if (!text) throw new Error("COMM footer is empty");
        const value = parseFloat(text.replace(/[$,]/g, ''));
        if (isNaN(value)) throw new Error(`Invalid COMM value: "${text}"`);
        console.log(`Total Commission Value: ${value}`);
        return value;
    }

    //     /**
    //  * Selects the checkbox in the first row of the commission table that has 'OPEN' status.
    //  * Waits for table and rows to be visible, then interacts with the first matched row.
    //  * 
    //  * @author Avanish Srivastava
    //  * @created 2025-08-01
    //  */
    //     async selectCommissionWithOpenStatus(): Promise<void> {
    //         await this.commissionRecordsTable_LOC.waitFor({ state: 'visible' });
    //         await this.rowsWithOpenCommissionStatusValue_LOC.first().waitFor({ state: 'attached' });
    //         const rowCount = await this.rowsWithOpenCommissionStatusValue_LOC.count();
    //         console.log(`Found ${rowCount} row(s) with 'OPEN' status.`);
    //         if (rowCount === 0) return;
    //         const selectedRow = this.rowsWithOpenCommissionStatusValue_LOC.nth(0);
    //         await selectedRow.scrollIntoViewIfNeeded();
    //         const checkbox = selectedRow.locator(this.commissionRowValue_LOC);
    //         await checkbox.scrollIntoViewIfNeeded();
    //         await checkbox.waitFor({ state: 'visible', timeout: WAIT.DEFAULT * 2 });
    //         await checkbox.check();
    //         console.log("Checkbox in first 'OPEN' row selected.");
    //     }

    /**
 * Validates and logs all rows in the table that contain the status 'HOLD'.
 * Waits for the table to be visible, counts matching rows, and prints each cell's text.
 * 
 * @author Avanish Srivastava
 * @created 2025-08-01
 */
    async validateHoldStatusRows() {
        await this.commissionRecordsTable_LOC.waitFor({ state: 'visible' });
        const count = await this.commissionHoldStatusValue_LOC.count();
        if (count === 0) {
            console.log("No 'HOLD' status found in the table.");
            return;
        }
        console.log(`Found ${count} rows with 'HOLD' status.`);
        for (let i = 0; i < count; i++) {
            const cell = this.commissionHoldStatusValue_LOC.nth(i);
            await cell.scrollIntoViewIfNeeded();
            const cellText = await cell.innerText();
            console.log(`HOLD cell ${i + 1}: ${cellText}`);
        }
    }

    //     /**
    //  * Clicks the 'Approve' button on the Audit page and waits for the page to load.
    //  * Used to approve the audit task after verification.
    //  * 
    //  * @author Avanish Srivastava
    //  * @created 2025-08-01
    //  */
    //     async clickOnAuditApprove() {
    //         await this.auditApproveButton_LOC.waitFor({ state: 'visible' });
    //         await Promise.all([
    //             this.auditApproveButton_LOC.click(),
    //             this.page.waitForLoadState('domcontentloaded'),
    //         ]);
    //     }

    //     /**
    //  * Clicks the 'Assign Me' button on the Audit page and waits for the page to load.
    //  * Used to assign the audit task to the current user.
    //  * 
    //  * @author Avanish Srivastava
    //  * @created 2025-08-01
    //  */
    //     async clickOnAuditAssignMe() {
    //         await this.auditAssignMeButton_LOC.waitFor({ state: 'visible' });
    //         await Promise.all([
    //             this.auditAssignMeButton_LOC.click(),
    //             this.page.waitForLoadState('domcontentloaded'),
    //         ]);
    //     }

    //     /**
    // * Selects the 'Yes' option from the Operational? toggle
    // * @author Avanish Srivastava
    // * @created 2025-08-01
    // */
    //     async selectOperationalYes(): Promise<void> {
    //         console.log('Attempting to Select Yes for Operational ...');
    //         await this.operationalToggleInput_LOC.waitFor({ state: 'visible' });
    //         await this.operationalToggleInput_LOC.click({ position: { x: 5, y: 5 } });
    //     }

    //     /**
    //  * Selects the 'No' option from the Operational? toggle
    //  * @author Avanish Srivastava
    //  * @created 2025-08-01
    //  */
    //     async selectOperationalNo(): Promise<void> {
    //         await this.operationalToggleInput_LOC.evaluate((input: HTMLInputElement) => {
    //             input.value = '3'; // No
    //             input.dispatchEvent(new Event('change', { bubbles: true }));
    //         });
    //     }

    //     /**
    // * Sets the Operational? toggle to default value (middle position)
    // * @author Avanish Srivastava
    // * @created 2025-08-01
    // */
    //     async selectOperationalDefault(): Promise<void> {
    //         await this.operationalToggleInput_LOC.evaluate((input: HTMLInputElement) => {
    //             input.value = '2'; // Default
    //             input.dispatchEvent(new Event('change', { bubbles: true }));
    //         });
    //     }

    //     /**
    //   * Selects the 'Yes' option in D7 Migrated toggle
    //   * @author Avanish Srivastava
    //   * @created 2025-08-01
    //   */
    //     async selectD7MigratedYes(): Promise<void> {
    //         console.log('Attempting to Select Yes for D7Migrated ...');
    //         await this.migratedToggleInput_LOC.waitFor({ state: 'visible' });
    //         await this.migratedToggleInput_LOC.click({ position: { x: 5, y: 5 } });
    //     }

    // /**
    // * Selects the 'No' option in D7 Migrated toggle
    // * @author Avanish Srivastava
    // * @created 2025-08-01
    // */
    // async selectD7MigratedNo(): Promise<void> {
    //     await this.migratedToggleInput_LOC.evaluate((input: HTMLInputElement) => {
    //         input.setAttribute('data-slider-value', '3');
    //         input.value = '3';
    //         input.dispatchEvent(new Event('change', { bubbles: true }));
    //     });
    // }

    // /**
    // * Sets the D7 Migrated toggle to default value (middle position)
    // * @author Avanish Srivastava
    // * @created 2025-08-01
    // */
    // async selectD7MigratedDefault(): Promise<void> {
    //     await this.migratedToggleInput_LOC.evaluate((input: HTMLInputElement) => {
    //         input.setAttribute('data-slider-value', '2');
    //         input.value = '2';
    //         input.dispatchEvent(new Event('change', { bubbles: true }));
    //     });
    // }

    //     /**
    //   * Validates and asserts records from the Commission Summary table (id='example')
    //   * This checks COMM STATUS, OFFICE, and COMM for each row in the table.
    //   * 
    //   * @author Avanish Srivastava
    //   * @created 2025-08-01
    //   */
    //     async validateCommissionSummaryRecords(): Promise<void> {
    //         await this.commissionRecordSummaryValue_LOC.waitFor({ state: 'visible' });
    //         const rowCount = await this.commissionSummaryRows_LOC.count();
    //         console.log(`Total Commission Records: ${rowCount}`);
    //         for (let i = 0; i < rowCount; i++) {
    //             const row = this.commissionSummaryRows_LOC.nth(i);
    //             const columns = row.locator(this.rowValue_LOC);
    //             const commStatus = (await columns.nth(2).innerText()).trim();
    //             const office = (await columns.nth(4).innerText()).trim();
    //             const commAmountRaw = (await columns.nth(8).innerText()).trim();
    //             const commAmount = parseFloat(commAmountRaw.replace(/,/g, ''));
    //             console.log(`Row ${i + 1}: COMM STATUS = ${commStatus}, OFFICE = ${office}, COMM = ${commAmountRaw}`);
    //             await expect.soft(commStatus, `Row ${i + 1} COMM STATUS should not be empty`).not.toBe('');
    //             await expect.soft(office, `Row ${i + 1} OFFICE should not be empty`).not.toBe('');
    //             await expect.soft(Number.isNaN(commAmount), `Row ${i + 1} COMM should be a valid number`).toBe(false);
    //             await expect.soft(commAmount, `Row ${i + 1} COMM should not be zero`).not.toBe(0);  // Optional: remove if zero is allowed
    //         }
    //     }

    // /**
    //  * Clicks the 'Filter and waits for the page to load.
    //  * 
    //  * @author Avanish Srivastava
    //  * @created 2025-08-01
    //  */
    // async clickOnCommissionReportFilter() {
    //     await this.commissionReportFilter_LOC.waitFor({ state: 'visible' });
    //     await Promise.all([
    //         this.commissionReportFilter_LOC.click(),
    //     ]);
    // }

    // /**
    // * Checks if "No matching records found" message is visible, and clicks filter if so.
    // * @author Avanish Srivastava
    // * @created 2025-08-01
    // */
    // async handleNoRecordsFound(): Promise<void> {
    //     // const noCommissionRecordExistMessage = this.noCommissionRecordExistValue_LOC;
    //     // const isVisible = await noCommissionRecordExistMessage.isVisible();
    //     await this.page.waitForLoadState('networkidle');
    //     const isVisible = await this.noCommissionRecordExistValue_LOC.isVisible();
    //     if (isVisible) {
    //         console.log('No records found. Attempting to click on filter...');
    //         await this.commissionReportFilter_LOC.click(); // Replace with actual locator
    //     } else {
    //         console.log('Records are present. No action taken.');
    //     }
    // }

    // /**
    //  * Master validator to handle both record and no-record cases
    //  * Calls respective functions based on the table state.
    //  * 
    //  * @author Avanish Srivastava
    //  * @created 2025-08-01
    //  */
    // async validateCommissionSummary(): Promise<void> {
    //     const noCommissionRecordExistMessage = this.noCommissionRecordExistValue_LOC;
    //     const commissionRecordSummary = this.commissionRecordSummaryValue_LOC;
    //     if (await noCommissionRecordExistMessage.isVisible()) {
    //         console.log("No matching records found.");
    //         await this.handleNoRecordsFound(); // when no records
    //     } else {
    //         await commissionRecordSummary.waitFor({ state: 'visible' });
    //         console.log("Records are present.");
    //         await this.validateCommissionSummaryRecords(); // when records exist
    //     }
    // }

    //     /**
    //  * Handles Commission Status Actions Based on Approved and Open Counts
    //  *
    //  * Logic:
    //  * - If approvedCount is not equal to 0 : Click 'Process' button
    //  * - If Approved < Open and Open ≠ 0: Click 'Approve' button
    //  * - If Approved == 0 and Open == 0: Create On Load
    //  * - Else: Do nothing
    //  *
    //  * @author Avanish Srivastava
    //  * @created 2025-08-01
    //  */
    //     async validateCommissionStatus(testData: any): Promise<void> {
    //         const commissionStatusLocator = this.commissionStatusValue_LOC.first();
    //         const commissionStatusText = await commissionStatusLocator.innerText();
    //         const approvedMatch = commissionStatusText.match(/\((\d+)\)\s*APPROVED/i);
    //         const openMatch = commissionStatusText.match(/\((\d+)\)\s*OPEN/i);
    //         const approvedCount = approvedMatch ? parseInt(approvedMatch[1], 10) : 0;
    //         const openCount = openMatch ? parseInt(openMatch[1], 10) : 0;
    //         console.log(`Approved: ${approvedCount}, Open: ${openCount}`);
    //         if (approvedCount !== 0) {
    //             console.log(`Condition: "approvedCount !== 0" approvedCount: ${approvedCount}, openCount: ${openCount}`);
    //             await this.selectCurrentCommission();
    //             await this.clickOnProcessCommission();
    //             await this.clickOnSubmitCommission();
    //         } else if (approvedCount < openCount && openCount !== 0) {
    //             console.log(`Condition: "approvedCount < openCount && openCount !== 0" approvedCount: ${approvedCount}, openCount: ${openCount}`);
    //             await this.selectCurrentCommission();
    //             await commonReusables.dialogHandler(this.page);
    //             await this.clickOnApprove();
    //             await this.selectCurrentCommission();
    //             await this.clickOnProcessCommission();
    //             await this.clickOnSubmitCommission();
    //         } else if (approvedCount === 0 && openCount === 0) {
    //             console.log('Condition: approvedCount === 0 && openCount === 0');
    //             await commissionHelper.setupDeliveredLoad(testData, this.page);
    //             await this.hoverOverFinanceMenu();
    //             await this.clickPayables();
    //             await this.clickCommsionSummary();
    //             await this.clickOnPresetSearch();
    //             await this.clickOnThisWeek();
    //             await this.selectAgentOffice(testData.agentOffice);
    //             await this.clickOnSearch();
    //             await this.selectCurrentCommission();
    //             await this.clickOnApprove();
    //             await this.selectCurrentCommission();
    //             await this.clickOnProcessCommission();
    //             await this.clickOnSubmitCommission();
    //         } else {
    //             console.log('No action taken.');
    //         }
    //     }

    /**
 * Handles Commission Audit Status based on its current value.
 * - If PENDING: navigates to commission audit queue.
 * - If APPROVED: edits and updates status to PENDING, then saves.
 * 
 * @author Avanish Srivastava
 * @created 2025-08-01
 */
    async validateCommissionAuditStatus(testData: any): Promise<void> {
        const auditStatusLocator = this.commissionAuditStatus_LOC;
        await auditStatusLocator.waitFor({ state: 'visible' });
        const statusText = (await auditStatusLocator.innerText()).trim().toUpperCase();
        console.log(`Commission Audit Status found: "${statusText}"`);
        const customerPage = new CustomerPage(this.page);
        if (statusText === COMMISSION_AUDIT_STATUS.PENDING) {
            console.log('Status is PENDING → Navigating to Commission Audit Queue...');
            await this.hoverOverFinanceMenu();
            await this.clickCommissionAuditQueue();
            await this.selectAuditStatusDropdown(testData.auditStatus);
            await this.clickOnSearch();
            await this.selectCurrentCommission();
            await commonReusables.dialogHandler(this.page);
            await this.clickOnCommissionAuditApproveButton();
        } else if (statusText === COMMISSION_AUDIT_STATUS.APPROVED) {
            console.log('Status is APPROVED → Changing to PENDING...');
            const editCustomerPage = new EditCustomerPage(this.page);
            const viewCustomerPage = new ViewCustomerPage(this.page);
            await viewCustomerPage.clickEditButton();
            await customerPage.selectPendingCommissionStatus();
            console.log('Status changed to PENDING');
            await editCustomerPage.clickSaveButton();;
            console.log('Saved successfully');
            await this.hoverOverFinanceMenu();
            await this.clickCommissionAuditQueue();
            console.log("testData.auditStatus = ", testData.auditStatus);
            await this.selectAuditStatusDropdown(testData.auditStatus);
            await this.clickOnSearch();
            await this.selectCurrentCommission();
            await commonReusables.dialogHandler(this.page);
            await this.clickOnCommissionAuditApproveButton();
        } else {
            console.log(`Unknown Commission Audit Status: "${statusText}"`);
        }
    }

    async selectAuditStatusDropdown(value: string) {
        await this.commissionAuditSearchButton_LOC.waitFor({ state: 'attached' });
        await this.commissionAuditSearchButton_LOC.click();
        console.log(`[Dropdown] Filling value: "${value}" into input field...`);
        await this.commissionAuditDropdownSuggestionValue_LOC(value).click();
    }

    //     /**
    //  * Enters text into the 'Customer Agent Name' input field.
    //  * 
    //  * @param name - The customer name or partial name to enter
    //  * @author Avanish Srivastava
    //  * @created 2025-08-05
    //  */
    //     async enterCustomerAgentName(name: string): Promise<void> {
    //         const customerAgentNameInput = this.customerAgentNameInput_LOC;
    //         await customerAgentNameInput.waitFor({ state: 'visible' });
    //         await customerAgentNameInput.pressSequentially(name, { delay: WAIT.DEFAULT / 10 });
    //         console.log(`[Input] Filling value: "${name}"`);
    //     }

    /**
* Validate data for the 'Customer Audit Status' field.
* 
* @author Avanish Srivastava
* @created 2025-08-05
*/
    async validateCustomerAuditStatus(): Promise<void> {
        const customerAuditRows = this.customerAuditRowsValue_LOC;
        const rowCount = await customerAuditRows.count();
        console.log(`Total rows found: ${rowCount}`);
        for (let i = 0; i < rowCount; i++) {
            const row = customerAuditRows.nth(i);
            await row.waitFor({ state: 'visible' });
            const customerStatus = (await row.locator(this.rowValue_LOC).nth(8).innerText()).trim();
            const auditStatus = (await row.locator(this.rowValue_LOC).nth(9).innerText()).trim();
            const customerName = (await row.locator(this.rowValue_LOC).nth(10).innerText()).trim();
            console.log(`Row ${i + 1} - Customer: ${customerName}, Status: ${customerStatus}, Audit: ${auditStatus}`);
            const actualValue8 = await row.locator(this.rowValue_LOC).nth(8).textContent();
            console.log(`Column 8 actual value: "${actualValue8}"`);
            const actualValue9 = await row.locator(this.rowValue_LOC).nth(9).textContent();
            console.log(`Column 9 actual value: "${actualValue9}"`);
            console.log(`Row ${i + 1} passed validation.`);
        }
    }

    //     /**
    //  * Validates office commission records in the Customer Audit table.
    //  *
    //  * @remarks
    //  * Uses Playwright's soft assertions to continue validation even if
    //  * one row fails.
    //  *
    //  * @author Avanish Srivastava
    //  * @created 2025-08-12
    //  */

    //     async validateOfficeCommissionRecords(): Promise<void> {
    //         const customerAuditRows = this.customerAuditRowsValue_LOC;
    //         const rowCount = await customerAuditRows.count();
    //         console.log(`Total rows found: ${rowCount}`);
    //         for (let i = 0; i < rowCount; i++) {
    //             const row = customerAuditRows.nth(i);
    //             await row.waitFor({ state: 'visible' });
    //             const commNo = (await row.locator(this.rowValue_LOC).nth(2).innerText()).trim();
    //             const loadNo = (await row.locator(this.rowValue_LOC).nth(5).innerText()).trim();
    //             console.log(`Row ${i + 1} - commNo: ${commNo}, loadNo: ${loadNo}`);
    //             await expect.soft(row.locator(this.rowValue_LOC).nth(2)).toHaveText(commNo);
    //             await expect.soft(row.locator(this.rowValue_LOC).nth(5)).toHaveText(loadNo);
    //             console.log(`Row ${i + 1} passed validation.`);
    //         }
    //     }
    // --------------------------------------------------------------------------------------|

    //     /**
    //  * Enters the Load ID into the load input field.
    //  *
    //  * Fetches the Load ID from the commission helper and fills it into the
    //  * designated input field on the page.
    //  *
    //  * @author Avanish Srivastava
    //  * @created 2025-08-10
    //  */

    //     async enterLoad(): Promise<void> {
    //         const loadId = commissionHelper.getLoadIDfromHeader()
    //         console.log(`Load ID fetched: ${loadId}`);
    //         await this.commissionLoadIdInput_LOC.waitFor({ state: "visible" });
    //         await this.commissionLoadIdInput_LOC.fill(String(loadId));
    //     }
    // /**
    //  * Clicks on the Office Commission Detail link.
    //  *
    //  * @author Avanish Srivastava
    //  * @created 2025-08-14
    //  */

    //     // async clickOfficeCommsionDetail() {
    //     //     await this.officeCommissionDetailLink_LOC.waitFor({ state: 'visible' });
    //     //     await this.officeCommissionDetailLink_LOC.click();
    //     //     await this.page.waitForLoadState('networkidle');
    //     // }
    // --------------------------------------------------------------------------------------|
    //     /**
    //  * Clicks on the Hide button in the Commission section.
    //  *
    //  * @author Avanish Srivastava
    //  * @created 2025-08-12
    //  */

    //     async clickOnHideButton() {
    //         await this.commissionHideButton_LOC.waitFor({ state: 'visible' });
    //         await this.commissionHideButton_LOC.click();
    //         await this.page.waitForLoadState('load');
    //     }

    //     /**
    //  * Ensures that the "Include Hidden" checkbox selection is set to the desired option ('Yes' or 'No').
    //  * @param {('Yes' | 'No')} option - The desired selection for the "Include Hidden" checkbox.
    //  * @author Avanish Srivastava
    //  * @created 2025-08-12
    //  * @throws Error if the locator is not found or interaction fails.
    //  */

    //     async ensureIncludeHiddenSelection(option: 'Yes' | 'No'): Promise<void> {
    //         const checkboxLocator = this.commissionValue_LOC;
    //         const isChecked = await checkboxLocator.isChecked();
    //         if ((option === 'Yes' && !isChecked) || (option === 'No' && isChecked)) {
    //             const labelLocator = this.commissionLabelValue_LOC;
    //             await Promise.all([
    //                 labelLocator.click(),
    //                 this.page.waitForLoadState('networkidle'),
    //                 console.log(`Click succeeded ${labelLocator}`)
    //             ]);
    //             console.log(`Set "Include Hidden" to: ${option}`);
    //         } else {
    //             console.log(`"Include Hidden" is already set to: ${option}`);
    //         }
    //     }

    //     /**
    //  * Validates the visibility of office commission records by enabling the "Include Hidden" option
    //  * and performing a search.
    //  * @author Avanish Srivastava
    //  * @created 2025-08-14
    //  * @throws Error if any step fails (e.g., element not found or not visible).
    //  */

    //     async hideUnhideValidateOfficeCommissionRecords() {
    //         await this.clickOnCommissionReportFilter();
    //         await this.ensureIncludeHiddenSelection('Yes');
    //         await Promise.all([
    //             this.clickOnSearch(),
    //         ]);
    //         await this.commissionRecordsTable_LOC.waitFor({ state: 'visible' })
    //         await this.validateOfficeCommissionRecords();
    //     }

    //     /**
    //  * Validates and logs the Batch ID and Commission Amount displayed in the success message section.
    //  * @author Avanish Srivastava
    //  * @created 2025-08-12
    //  * @throws Error if locators are not found (handled internally by Playwright).
    //  */

    //     async validateBatchIdAndCommission(): Promise<void> {
    //         const actualBatchId = (await this.batchIdLink_LOC.innerText()).trim();
    //         const actualAmountText = (await this.commissionAmount_LOC.innerText()).trim();
    //         const actualAmount = actualAmountText.replace('Total Commissions:', '').trim();
    //         console.log(`Batch ID : ${actualBatchId} Found`);
    //         console.log(`Commission Amount : ${actualAmount} Found`);
    //         await expect.soft(this.batchIdLink_LOC).toHaveText(actualBatchId);
    //     }

    /**
 * Selects the commission row corresponding to a specific load ID and status,
 * and checks its associated checkbox.
 *
 * Steps performed:
 * 1. Wait for the commission records table to be visible.
 * 2. Locate the row that matches the provided load ID and status (OPEN or HOLD).
 * 3. Ensure the row exists; throw an error if no matching row is found.
 * 4. Scroll the row into view.
 * 5. Wait for the checkbox in the row to become visible and check it.
 *
 * @author Avanish Srivastava
 * @created 2025-08-11
 *
 * @param loadId - The load ID for which the commission row should be selected.
 * @param status - The commission status to match (either 'OPEN' or 'HOLD').
 * @throws Error if no matching row is found for the given load ID and status.
 */

    async selectCommissionWithLoadId(loadId: string, status: 'OPEN' | 'HOLD'): Promise<void> {
        await this.commissionRecordsTable_LOC.waitFor({ state: 'visible' });
        const rowLocator = this.page.locator(
            `//tr[td[contains(.,'${status}')]][td[contains(.,'${loadId}')]]`
        );
        await rowLocator.waitFor({ state: 'attached' });
        const rowCount = await rowLocator.count();
        if (rowCount === 0) {
            throw new Error(`No row found with status '${status}' and load '${loadId}'!`);
        }
        const selectedRow = rowLocator.first();
        await selectedRow.scrollIntoViewIfNeeded();
        const checkbox = selectedRow.locator(this.commissionRowValue_LOC);
        await checkbox.waitFor({ state: 'visible', timeout: WAIT.DEFAULT * 2 });
        await checkbox.check();
        console.log(`Set commission ${loadId} to status ${status}`);
    }

    /**
 * Validates that there are rows with 'HOLD' status for the specified load ID
 * and logs the cell text for each matching row.
 *
 * Steps performed:
 * 1. Wait for the commission records table to be visible.
 * 2. Locate rows where the status is 'HOLD' and the load ID matches the given value.
 * 3. Assert that at least one matching row exists; if none, throw an error.
 * 4. For each matching row:
 *    - Scroll into view for visibility.
 *    - Validate that the relevant cell is visible.
 *    - Log the inner text of the cell.
 *
 * @author Avanish Srivastava
 * @created 2025-08-10
 *
 * @param loadId - The load ID for which HOLD status rows need to be validated.
 * @throws Error if no row with 'HOLD' status is found for the given load ID.
 */

    async validateHoldStatusRowsForLoadId(loadId: string): Promise<void> {
        await this.commissionRecordsTable_LOC.waitFor({ state: 'visible' });
        const holdRowLocator = this.page.locator(
            `//tr[td[normalize-space()='HOLD']][td[normalize-space()='${loadId}']]`
        );
        const holdCell = holdRowLocator.locator(this.rowValue_LOC).nth(3);
        await expect(holdCell).toBeVisible();
        const count = await holdRowLocator.count();
        if (count === 0) {
            throw new Error(`No 'HOLD' row found for load '${loadId}'!`);
        }
        console.log(`Found ${count} row(s) with 'HOLD' status for load '${loadId}'`);
        for (let i = 0; i < count; i++) {
            const row = holdRowLocator.nth(i);
            await row.scrollIntoViewIfNeeded();
            const cell = row.locator(this.rowValue_LOC).nth(3);
            await expect(cell).toBeVisible();
            await cell.scrollIntoViewIfNeeded();
            const text = await cell.innerText();
            console.log(`HOLD cell ${i + 1}: ${text}`);
        }
    }

    /**
 * Click on the Adjust Button to modify commission
 * @author Avanish Srivastava
 * @created 2025-08-09
 */

    async clickCommissionAdjustButton(): Promise<void> {
        await this.commissionAdjustButton_LOC.waitFor({ state: 'visible' });
        await this.commissionAdjustButton_LOC.click();
    }

    /**
 * Enter Adjust Amount for Commission
 * @author Avanish Srivastava
 * @created 2025-08-09
 */

    async enterAdjustAmount(value: string | number): Promise<void> {
        await this.commissionAdjustAmountInput_LOC.waitFor({ state: "visible" });
        await this.commissionAdjustAmountInput_LOC.fill(String(value));
    }

    /**
 * Selects an option in the adjust_commission_code dropdown by value, text, or description.
 * @param optionValue The value, text, or description to select
 * @author Avanish Srivastava
 * @created 2025-08-09
 * @modified 2025-08-19
 */
    async selectCommissionCode(optionValue: string): Promise<void> {
        const selector = this.commissionCodeCombobox_LOC;
        await this.page.waitForSelector(selector);
        const byValue = await this.page.locator(`${selector} option[value="${optionValue}"]`).count();
        if (byValue > 0) {
            await this.page.selectOption(selector, { value: optionValue });
            return;
        }
        const byText = await this.page.locator(`${selector} option:text-is("${optionValue}")`).count();
        if (byText > 0) {
            await this.page.selectOption(selector, { label: optionValue });
            return;
        }
        const byDescription = await this.page.locator(`${selector} option[data-description="${optionValue}"]`).count();
        if (byDescription > 0) {
            const element = this.page.locator(`${selector} option[data-description="${optionValue}"]`);
            await element.scrollIntoViewIfNeeded();
            await element.click();
            return;
        }
        throw new Error(`Option "${optionValue}" not found in commission code dropdown.`);
    }

    //     /**
    //  * Click on office Search under Finance Menu
    //  * @author Avanish Srivastava
    //  * @created 2025-08-09
    //  */

    //     async clickOfficeSearch(): Promise<void> {
    //         const officeSearch = this.officeSearchLink_LOC.nth(0);
    //         await officeSearch.waitFor({ state: 'visible' });
    //         await officeSearch.click();
    //     }

    /**
     * @author Rohit Singh
     * @created 2025-08-19
     * @description Search for a customer by name
     * @param {string} customerName - The name of the customer to search for
     */
    async searchCustomerViaFinance(customerName: string) {
        await this.page.waitForLoadState("networkidle");
        await this.customerNameInput_LOC.pressSequentially(customerName);
        await this.customerSearchedNameDropdown_LOC.getByText(customerName).nth(0).click();
        await this.searchButton_LOC.click();
    }
    /**
     * @author Rohit Singh
     * @created 2025-08-26
     * @description Search for a customer by ID
     * @param {string} customerId - The ID of the customer to search for
     */
    async searchCustomerIDViaFinance(customerId: any) {
        await this.page.waitForLoadState("networkidle");
        await this.customerIdInput_LOC.pressSequentially(customerId.toString());
        await this.searchButton_LOC.click();
        await this.page.waitForLoadState("networkidle");
    }
    /**
 * Select Operational Status 
 * @author Avanish Srivastava
 * @created 2025-08-18
 */

    async selectOperationalStatus(): Promise<void> {
        console.log('Attempting to Select Yes for Operational ...');
        const sliderTrack = this.operationalValue_LOC;
        await sliderTrack.waitFor({ state: 'visible' });
        await sliderTrack.click({ position: { x: 10, y: 10 } });
    }

    /**
 * Click on Adjust Commission Button 
 * @author Avanish Srivastava
 * @created 2025-08-18
 */
    async adjustCommissionSubmitButton(): Promise<void> {
        await this.adjustCommissionSubmitButton_LOC.waitFor({ state: "visible" });
        await Promise.all([
            await this.adjustCommissionSubmitButton_LOC.click(),
            this.page.waitForLoadState('networkidle'),
        ]);
    }

    /**
* Get All Office Adjustment Data
* @author Avanish Srivastava
* @created 2025-08-19
*/

    async getAllOfficeAdjustmentAndCommData(): Promise<any[]> {
        console.log('Getting all office adjustment rows data...');
        try {
            const rows = this.allOfficeAdjustmentValue_LOC;
            const rowCount = await rows.count();
            console.log(`Found ${rowCount} office adjustment rows`);
            const allData = [];
            for (let i = 0; i < rowCount; i++) {
                const row = rows.nth(i);
                const data = {
                    type: (await row.locator(this.officeAdjustmentTypeValue_LOC).textContent())?.trim(),
                    commissionAmount: (await row.locator(this.officeAdjustmentAmountValue_LOC).textContent())?.trim(),
                    id: (await row.locator(this.officeAdjustmentIdValue_LOC).textContent())?.trim()
                };
                allData.push(data);
            }
            console.log('All data retrieved:', allData);
            return allData;
        } catch (error) {
            console.error('Error getting data:', error);
            return [];
        }
    }

    /**
* Get the data for Selected Commission Id
* @author Avanish Srivastava
* @created 2025-08-20
*/

    async getSelectedCommissionId(): Promise<string> {
        console.log('Getting selected commission ID...');
        try {
            const checkedCheckbox = this.commissionIdValue_LOC
            await checkedCheckbox.waitFor({ state: 'visible' });
            const commissionId = await checkedCheckbox.getAttribute('value');
            if (!commissionId) {
                throw new Error('No commission ID found for selected row');
            }
            console.log(`Selected commission ID: ${commissionId}`);
            return commissionId;
        } catch (error) {
            console.error('Error getting selected commission ID:', error);
            throw error;
        }
    }

    /**
    * Select New Commission ID after adjustment (either +1 incremented or random new ID)
    * @author Avanish Srivastava
    * @created 2025-08-19
    * @modified 2025-08-20
    */
    async selectNewCommissionAfterAdjustment(originalCommissionId: string, status: 'OPEN' | 'HOLD'): Promise<void> {
        console.log(`Selecting new commission ID after adjustment for original ID: ${originalCommissionId}`);
        await this.page.waitForLoadState('networkidle');
        await this.commissionRecordsTable_LOC.waitFor({ state: 'visible' });
        const incrementedCommissionId = (parseInt(originalCommissionId) + 1).toString();
        console.log(`First attempting to find incremented commission ID: ${incrementedCommissionId}`);
        const incrementedRowLocator = this.page.locator(
            `//tr[td[contains(.,'${status}')]][td[contains(.,'${incrementedCommissionId}')]]`
        );
        let rowCount = await incrementedRowLocator.count();
        if (rowCount > 0) {
            console.log(`Found incremented commission ID: ${incrementedCommissionId}`);
            try {
                const selectedRow = incrementedRowLocator.first();
                await selectedRow.waitFor({ state: 'attached' });
                await selectedRow.scrollIntoViewIfNeeded();
                const checkbox = selectedRow.locator(this.commissionRowValue_LOC);
                await checkbox.waitFor({ state: 'visible', timeout: WAIT.DEFAULT * 2 });
                await checkbox.check();
                console.log(`Selected commission with incremented ID: ${incrementedCommissionId} and status: ${status}`);
                return;
            } catch (error) {
                console.log(`Error selecting incremented ID: ${error}. Trying alternative approach...`);
            }
        }
        console.log(`Incremented ID not found or failed. Looking for any new commission ID with status '${status}' that's not the original...`);
        await this.commissionRecordsTable_LOC.waitFor({ state: 'visible' });
        const newCommissionRowLocator = this.page.locator(
            `//tr[td[contains(.,'${status}')]][td[3][not(normalize-space(.)='${originalCommissionId}')]]`
        );
        const newRowCount = await newCommissionRowLocator.count();
        console.log(`Found ${newRowCount} rows with status '${status}' that are not the original commission`);
        if (newRowCount > 0) {
            try {
                const selectedRow = newCommissionRowLocator.first();
                await selectedRow.waitFor({ state: 'attached' });
                const commissionIdCell = selectedRow.locator(this.rowValue_LOC).nth(2);
                await commissionIdCell.waitFor({ state: 'attached' });
                const newCommissionId = (await commissionIdCell.textContent())?.trim();
                console.log(`Found new commission ID: ${newCommissionId} (different from original: ${originalCommissionId})`);
                await selectedRow.scrollIntoViewIfNeeded();
                const checkbox = selectedRow.locator(this.commissionRowValue_LOC);
                await checkbox.waitFor({ state: 'visible', timeout: WAIT.DEFAULT * 2 });
                await checkbox.check();
                console.log(`Selected commission with new ID: ${newCommissionId} and status: ${status}`);
                return;
            } catch (error) {
                console.error(`Error selecting new commission: ${error}`);
            }
        }
        console.log(`Trying fallback approach: finding the most recent commission with status '${status}'...`);
        try {
            const allStatusRows = this.page.locator(`//tr[td[contains(.,'${status}')]]`);
            const allRowCount = await allStatusRows.count();
            if (allRowCount > 0) {
                const lastRow = allStatusRows.last();
                await lastRow.waitFor({ state: 'attached' });
                const commissionIdCell = lastRow.locator(this.rowValue_LOC).nth(2);
                const lastCommissionId = (await commissionIdCell.textContent())?.trim();
                if (lastCommissionId && lastCommissionId !== originalCommissionId) {
                    console.log(`Using fallback: selecting commission ID: ${lastCommissionId}`);
                    await lastRow.scrollIntoViewIfNeeded();
                    const checkbox = lastRow.locator(this.commissionRowValue_LOC);
                    await checkbox.waitFor({ state: 'visible', timeout: WAIT.DEFAULT * 2 });
                    await checkbox.check();
                    console.log(`Selected commission with fallback ID: ${lastCommissionId} and status: ${status}`);
                    return;
                }
            }
        } catch (error) {
            console.error(`Fallback approach also failed: ${error}`);
        }
        throw new Error(`No new commission ID found with status '${status}' after adjustment for original ID '${originalCommissionId}'!`);
    }

    async clickOnFinanceMenu() {
        await this.financeSiteMenu_LOC.waitFor({ state: 'visible' });
        await this.financeSiteMenu_LOC.click();
        await this.page.waitForLoadState('domcontentloaded');
    }

    async clickOnLeadsRequestingLink() {
        await this.leadsRequestingLink_LOC.waitFor({ state: 'visible' });
        await this.leadsRequestingLink_LOC.click();
        await this.page.waitForLoadState('domcontentloaded');
    }


    async waitForSearchResults(): Promise<void> {

        try {
            const noRecordsMessage = this.page.locator('center h4.no_rows:has-text("No matching records found")');
            const isNoRecordsVisible = await noRecordsMessage.isVisible({ timeout: WAIT.DEFAULT });

            if (isNoRecordsVisible) {
                console.log('No matching records found - search returned no results');
                await noRecordsMessage.scrollIntoViewIfNeeded();
                return;
            }
        } catch (error) {
            console.log('No records message check failed, proceeding with data wait strategies');
        }

        const strategies = [
            {
                name: 'table',
                execute: async () => {
                    await this.page.waitForSelector('table', { state: 'visible', timeout: WAIT.DEFAULT * 3 });
                    console.log('✓ Commission table loaded');
                }
            },
            {
                name: 'checkbox',
                execute: async () => {
                    await this.page.waitForSelector('input[type="checkbox"].process_checkbox', {
                        state: 'visible',
                        timeout: WAIT.DEFAULT * 3
                    });
                    console.log('✓ Commission checkboxes loaded');
                }
            },
            {
                name: 'data',
                execute: async () => {
                    await this.page.waitForFunction(() => {
                        const checkboxes = document.querySelectorAll('input[type="checkbox"].process_checkbox');
                        return checkboxes.length > 0;
                    }, { timeout: WAIT.DEFAULT * 3 });
                    console.log('Commission data populated');
                }
            }
        ];

        let succeeded = false;
        for (const strategy of strategies) {
            try {
                await strategy.execute();
                console.log(`Search results loaded using: ${strategy.name}`);
                succeeded = true;
                break;
            } catch (error) {
                console.log(`Strategy '${strategy.name}' failed: ${error}`);
                continue;
            }
        }
        if (!succeeded) {
            console.warn('All wait strategies failed, proceeding with caution');
        }
        await new Promise(resolve => setTimeout(resolve, WAIT.SMALL));
    }

}
export default FinancePage;