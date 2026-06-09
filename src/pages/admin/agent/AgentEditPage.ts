import { Locator, Page } from "@playwright/test";

export default class AgentEditPage {
    private readonly saveButton_LOC: Locator;
    private readonly userRolesdropdown_LOC: Locator;
    private readonly selectBulkChangeRole_LOC: (text: string) => Locator;
    private readonly authLevelDropdown_LOC: Locator;
    /** agentform.php: USER ROLES multiselect — id agent_auth_role_ids */
    private readonly userRolesSelect_LOC: Locator;
    /** jQuery UI multiselect trigger button for #agent_auth_role_ids */
    private readonly userRolesMultiselectButton_LOC: Locator;
    private readonly userRolesMultiselectMenu_LOC: Locator;
    private readonly userRoleMultiselectLabel_LOC: (label: string) => Locator;

    constructor(private page: Page) {
        // Edit Agent form has duplicate #save in top/bottom footers — scope to form and use first
        this.saveButton_LOC = this.page.locator("#agent-form input#save").first();
        this.userRolesdropdown_LOC = this.page.locator(
            "#agent_auth_role_ids + button.ui-multiselect span",
        );
        this.selectBulkChangeRole_LOC = (text: string) =>
            this.userRolesMultiselectMenu_LOC.locator("label").filter({ hasText: text });
        this.authLevelDropdown_LOC = page.locator("#agent_auth_level");
        this.userRolesSelect_LOC = page.locator("#agent_auth_role_ids");
        this.userRolesMultiselectButton_LOC = page.locator(
            "#agent_auth_role_ids + button.ui-multiselect.ui-widget.ui-state-default.ui-corner-all",
        );
        // Scope to USER ROLES widget only — page also has #agent_office_ids multiselect
        this.userRolesMultiselectMenu_LOC = page.locator(
            "#agent_auth_role_ids ~ .ui-multiselect-menu",
        );
        this.userRoleMultiselectLabel_LOC = (label: string) =>
            this.userRolesMultiselectMenu_LOC.locator("label").filter({ hasText: label });
    }

    /**
     * @author Tejaswini
     * @param roleName Assign User Role to agent
     */
    async assignRole(roleName: string) {
        await this.userRolesdropdown_LOC.click();
        await this.selectBulkChangeRole_LOC(roleName).click();
        await this.saveButton_LOC.click();
        console.log(`${roleName} role assigned successfully.`);
    }

    /**
     * Waits for the Edit Agent form after clicking Edit on Agent Info.
     * @author AI Agent
     * @created 2026-06-09
     */
    async waitForEditForm(): Promise<void> {
        await this.authLevelDropdown_LOC.waitFor({ state: "visible", timeout: WAIT.LARGE });
        await this.userRolesSelect_LOC.waitFor({ state: "attached", timeout: WAIT.LARGE });
        await this.userRolesMultiselectButton_LOC.waitFor({ state: "visible", timeout: WAIT.LARGE });
    }

    /**
     * Returns true when the Rails Edit Agent form is displayed (not legacy view or login).
     * @author AI Agent
     * @created 2026-06-09
     */
    async isEditFormVisible(): Promise<boolean> {
        return this.authLevelDropdown_LOC.isVisible();
    }

    /**
     * Selects the Auth Level dropdown
     *
     * @param authLevel - The auth level to select (NOACCESS, SALES, DISPATCH, MANAGER, FINANCE, EXECUTIVE, ADMIN)
     *
     * @author Suhaib
     * @created 2025-12-21
     */
    async selectAuthLevel(authLevel: string): Promise<void> {
        await this.authLevelDropdown_LOC.waitFor({ state: 'visible', timeout: WAIT.LARGE });
        await this.authLevelDropdown_LOC.selectOption({ value: authLevel });
    }

    /**
     * Clicks the Save button to save agent changes
     *
     * @author Suhaib
     * @created 2025-12-21
     */
    async clickSaveButton(): Promise<void> {
        await this.saveButton_LOC.waitFor({ state: 'visible', timeout: WAIT.XXLARGE });
        await this.saveButton_LOC.click();
    }

    /**
     * Updates agent auth level - selects auth level and saves (requires edit mode to be active)
     *
     * @param authLevel - The auth level to update to (NOACCESS, SALES, DISPATCH, MANAGER, FINANCE, EXECUTIVE, ADMIN)
     *
     * @author Suhaib
     * @created 2025-12-22
     */
    async updateAuthLevel(authLevel: string): Promise<void> {
        await this.selectAuthLevel(authLevel);
        await this.clickSaveButton();
    }

    /**
     * Normalizes a role key or display label to the option text on #agent_auth_role_ids
     * (e.g. BTMS_USER, PRINCIPAL). Option values are numeric ids (52, 3, …), not role keys.
     * @author AI Agent
     * @created 2026-06-09
     */
    private normalizeRoleKey(role: string): string {
        return role.replace(/[\s-]+/g, "_").toUpperCase();
    }

    /**
     * Resolves checkbox label text for a role key or display label in the ui-multiselect menu.
     * @author AI Agent
     * @created 2026-06-09
     */
    private resolveRoleOptionLabels(role: string): string[] {
        const labels = [role];
        const displayByKey: Record<string, string> = {
            [AGENT_USER_ROLES.BTMS_USER]: AGENT_USER_ROLE_DISPLAY.BTMS_USER,
            [AGENT_USER_ROLES.PRINCIPAL]: AGENT_USER_ROLE_DISPLAY.PRINCIPAL,
            [AGENT_USER_ROLES.ADMIN]: AGENT_USER_ROLE_DISPLAY.ADMIN,
            [AGENT_USER_ROLES.SYSTEM_ADMIN]: AGENT_USER_ROLE_DISPLAY.SYSTEM_ADMIN,
        };
        const normalized = this.normalizeRoleKey(role);
        const display = displayByKey[normalized];
        if (display && !labels.includes(display)) {
            labels.push(display);
        }
        if (!labels.includes(normalized)) {
            labels.unshift(normalized);
        }
        return labels;
    }

    /**
     * Returns currently selected USER ROLES option text keys from #agent_auth_role_ids
     * (e.g. BTMS_USER, LTL_3PL_QUOTERS). Uses option text, not numeric value attributes.
     * @author AI Agent
     * @created 2026-06-09
     */
    async getSelectedUserRoleKeys(): Promise<string[]> {
        return this.userRolesSelect_LOC.evaluate((el) =>
            Array.from((el as HTMLSelectElement).selectedOptions).map((option) =>
                (option.textContent ?? "").trim(),
            ),
        );
    }

    /**
     * Resolves the native option label text for a role key or display label.
     * Option text in #agent_auth_role_ids uses role keys (PRINCIPAL, BTMS_USER), not display labels.
     * @author AI Agent
     * @created 2026-06-09
     */
    private resolveNativeOptionLabel(role: string): string {
        const normalized = this.normalizeRoleKey(role);
        const knownKeys = Object.values(AGENT_USER_ROLES) as string[];
        if (knownKeys.includes(normalized)) {
            return normalized;
        }
        for (const [key, display] of Object.entries(AGENT_USER_ROLE_DISPLAY)) {
            if (role === display || normalized === this.normalizeRoleKey(display)) {
                return key;
            }
        }
        return normalized;
    }

    /**
     * Locator for a USER ROLES checkbox in the ui-multiselect menu (title = role key).
     * agent edit form: input[title="PRINCIPAL"] inside #agent_auth_role_ids ~ .ui-multiselect-menu
     * @author AI Agent
     * @created 2026-06-09
     */
    private userRoleCheckbox_LOC(roleKey: string): Locator {
        return this.userRolesMultiselectMenu_LOC.locator(
            `input[type='checkbox'][title='${roleKey}']`,
        );
    }

    /**
     * Opens the USER ROLES jQuery UI multiselect menu for #agent_auth_role_ids.
     * Trigger: button.ui-multiselect.ui-widget.ui-state-default.ui-corner-all
     * @author AI Agent
     * @created 2026-06-09
     */
    async openUserRolesDropdown(): Promise<void> {
        await this.userRolesMultiselectButton_LOC.waitFor({ state: "visible", timeout: WAIT.LARGE });
        if (!(await this.userRolesMultiselectMenu_LOC.isVisible())) {
            await this.userRolesMultiselectButton_LOC.click();
        }
        await this.userRolesMultiselectMenu_LOC.waitFor({ state: "visible", timeout: WAIT.LARGE });
    }

    /**
     * Finds a visible ui-multiselect checkbox for a role key (matches input title attribute).
     * @author AI Agent
     * @created 2026-06-09
     */
    private async findUserRoleCheckbox(role: string): Promise<Locator> {
        await this.openUserRolesDropdown();
        const roleKey = this.resolveNativeOptionLabel(role);
        const checkbox = this.userRoleCheckbox_LOC(roleKey);
        if ((await checkbox.count()) > 0) {
            return checkbox.first();
        }

        for (const labelText of this.resolveRoleOptionLabels(role)) {
            const menuLabel = this.userRoleMultiselectLabel_LOC(labelText);
            if ((await menuLabel.count()) > 0) {
                return menuLabel.first().locator("input[type='checkbox']");
            }
        }
        throw new Error(`USER ROLES checkbox not found for role: ${role}`);
    }

    /**
     * Returns true when the role checkbox is disabled (e.g. BTMS_USER is always selected).
     * @author AI Agent
     * @created 2026-06-09
     */
    private async isUserRoleCheckboxDisabled(role: string): Promise<boolean> {
        const checkbox = await this.findUserRoleCheckbox(role);
        return checkbox.isDisabled();
    }

    /**
     * Toggles a USER ROLES checkbox in the ui-multiselect menu.
     * @author AI Agent
     * @created 2026-06-09
     */
    private async toggleUserRoleCheckbox(role: string, shouldBeSelected: boolean): Promise<void> {
        const checkbox = await this.findUserRoleCheckbox(role);
        if (await checkbox.isDisabled()) {
            return;
        }
        const isChecked = await checkbox.isChecked();
        if (isChecked !== shouldBeSelected) {
            await checkbox.click();
        }
    }

    /**
     * Selects a USER ROLES option via native select label, falling back to ui-multiselect checkboxes.
     * @author AI Agent
     * @created 2026-06-09
     */
    private async selectUserRoleOption(role: string): Promise<void> {
        const optionLabel = this.resolveNativeOptionLabel(role);
        const selected = await this.getSelectedUserRoleKeys();
        if (selected.includes(optionLabel)) {
            return;
        }

        try {
            await this.userRolesSelect_LOC.selectOption({ label: optionLabel });
            const updated = await this.getSelectedUserRoleKeys();
            if (updated.includes(optionLabel)) {
                return;
            }
        } catch {
            // Hidden multiselect may reject direct selectOption — use ui-multiselect UI
        }

        await this.toggleUserRoleCheckbox(role, true);
    }

    /**
     * Deselects a USER ROLES option via native select label, falling back to ui-multiselect checkboxes.
     * @author AI Agent
     * @created 2026-06-09
     */
    private async deselectUserRoleOption(role: string): Promise<void> {
        const optionLabel = this.resolveNativeOptionLabel(role);
        const selected = await this.getSelectedUserRoleKeys();
        if (!selected.includes(optionLabel)) {
            return;
        }

        if (await this.isUserRoleCheckboxDisabled(role)) {
            return;
        }

        try {
            await this.userRolesSelect_LOC.selectOption(
                selected
                    .filter((key) => key !== optionLabel)
                    .map((label) => ({ label })),
            );
            const updated = await this.getSelectedUserRoleKeys();
            if (!updated.includes(optionLabel)) {
                return;
            }
        } catch {
            // Hidden multiselect may reject direct selectOption — use ui-multiselect UI
        }

        await this.toggleUserRoleCheckbox(role, false);
    }

    /**
     * Ensures a USER ROLES option is selected or deselected on Edit Agent (#agent_auth_role_ids).
     * @author AI Agent
     * @created 2026-06-09
     * @param role - Role key or display label (e.g. BTMS_USER, Principal Admin)
     * @param shouldBeSelected - true to select, false to deselect
     */
    async setUserRoleSelected(role: string, shouldBeSelected: boolean): Promise<void> {
        const optionLabel = this.resolveNativeOptionLabel(role);
        const selected = await this.getSelectedUserRoleKeys();
        const isSelected = selected.some(
            (key) => this.normalizeRoleKey(key) === optionLabel,
        );
        if (isSelected === shouldBeSelected) {
            return;
        }

        if (shouldBeSelected) {
            await this.selectUserRoleOption(role);
            return;
        }
        await this.deselectUserRoleOption(role);
    }

    /**
     * Sets user roles on the Edit Agent form from required/forbidden role key lists.
     * @author AI Agent
     * @created 2026-06-01
     * @param options.requiredRoles - Role keys that must be selected (e.g. BTMS_USER, PRINCIPAL)
     * @param options.forbiddenRoles - Role keys that must be deselected when present
     */
    async configureUserRoles(options: {
        requiredRoles?: string[];
        forbiddenRoles?: string[];
    }): Promise<void> {
        for (const role of options.requiredRoles ?? []) {
            await this.setUserRoleSelected(role, true);
        }
        for (const role of options.forbiddenRoles ?? []) {
            await this.setUserRoleSelected(role, false);
        }
    }
}
