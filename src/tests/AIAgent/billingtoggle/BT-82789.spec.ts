import dataConfig from "@config/dataConfig";
import userSetup from "@loginHelpers/userSetup";
import { BrowserContext, expect, Page, test } from "@playwright/test";
import commonReusables from "@utils/commonReusables";
import { PageManager } from "@utils/PageManager";

const testcaseID = "BT-82789";
const testData = dataConfig.getTestDataFromCsv(dataConfig.billingtoggleData, testcaseID);

test.describe.configure({ retries: 1 });
test.describe.serial(
  "Case ID: BT-82789 - Payables toggle when Short Pay Adjustment Payload from SLC (central billing)",
  () => {
    let tritanPage: Page;
    let btmsPage: Page;
    let tritanPages: PageManager;
    let btmsPages: PageManager;
    let context: BrowserContext;
    let shipmentId = "";
    let carrierInvoiceNumber = "";
    let carrierBillTotal = "";
    let btmsOverInvoiceAmount = "";
    let invoiceOverage = 0;

    test.beforeAll(async ({ browser }) => {
      context = await browser.newContext();
      tritanPage = await context.newPage();
      tritanPages = new PageManager(tritanPage);
      await tritanPages.tritanLoginPage.LoginTRITAN(
        userSetup.tritanAdminCustomer,
        userSetup.tritanAdminCustomerPassword,
      );
      await commonReusables.waitForPageStable(tritanPage, { timeout: WAIT.XXLARGE });
    });

    test.afterAll(async () => {
      if (context) await context.close();
    });

    test(
      "Case Id: BT-82789 - Verify payable toggle when load receives Short Pay flagged Adjustment Payload from SLC for central billing",
      { tag: "@AIAgent,@aiteam,@at_billingtoggle,@payabletoggle" },
      async () => {
        test.setTimeout(WAIT.SPEC_TIMEOUT_XXLARGE);

        await test.step("Steps 1-6 [82789 1-6]: Login confirmed — Company → Expand → Goodyear customer", async () => {
          await commonReusables.waitForPageStable(tritanPage, { timeout: WAIT.XXLARGE });
          await tritanPages.tritanDashboardPage.clickOnCompanyButton();
          await tritanPages.tritanCompanyPage.clickOnExpandAllButton();
          await tritanPages.tritanCompanyPage.selectCustomerByName(testData.customerName);
        });

        await test.step(
          "Steps 7-10 [82789 7-10]: Shipment Template LTL TEST SHORT PAY LTL ESTES — Save shipment",
          async () => {
            await tritanPages.tritanDashboardPage.hoverViewAndClickShipmentTemplate();
            await tritanPages.listShipmentTemplatePage.clickOnLtlShipmentTemplateByName(
              testData["Customer Value"],
            );
            await tritanPages.addShipment.clickOnSaveShipmentButton();
            shipmentId = await tritanPages.shipmentDetailsPage.getShipmentIdFromHeader();
            tritanPages.logger.info(`Shipment ID: ${shipmentId}`);
            expect(shipmentId).toBeTruthy();
            await tritanPages.tritanDashboardPage.closeMdiWindowIfPresent("Intermodal");
            await tritanPages.tritanDashboardPage.hoverOnShipmentTemplateFromHeader();
            await tritanPages.tritanDashboardPage.clickOnDetailsTab();
            await commonReusables.waitForPageStable(tritanPage, { timeout: WAIT.LARGE });
          },
        );

        await test.step("Steps 11-13 [82789 11-13]: Open load — add carrier invoice on Tritan", async () => {
          await tritanPages.tritanDashboardPage.closeMdiWindowIfPresent("Intermodal");
          await tritanPages.tritanDashboardPage.activateMdiTabContaining(shipmentId);
          await tritanPages.tritanDashboardPage.hoverOnShipmentTemplateFromHeader();
          await tritanPages.tritanDashboardPage.clickOnDetailsTab();
          await commonReusables.waitForPageStable(tritanPage, { timeout: WAIT.LARGE });
          await tritanPages.shipmentDetailsPage.clickOnLoadNumber(shipmentId);
          await commonReusables.waitForPageStable(tritanPage, { timeout: WAIT.XXLARGE });
          await tritanPages.tritanLoadDetailsPage.clickOnDetailsTab();
          await commonReusables.waitForPageStable(tritanPage, { timeout: WAIT.XXLARGE });
          await expect(async () => {
            await tritanPages.tritanLoadDetailsPage.clickAddCarrierInvoicePlusIcon();
          }).toPass({ timeout: WAIT.XXLARGE });
          ({ invoiceNumber: carrierInvoiceNumber, billTotal: carrierBillTotal } =
            await tritanPages.tritanLoadDetailsPage.getLatestCarrierInvoiceDetails());
          expect(carrierInvoiceNumber).toBeTruthy();
          expect(carrierBillTotal).toBeTruthy();
          tritanPages.logger.info(
            `Carrier invoice ${carrierInvoiceNumber}, bill total ${carrierBillTotal}`,
          );
        });

        await test.step("Steps 14-20 [82789 14-20]: Plan — Pickup PRO, Drop status", async () => {
          await tritanPages.tritanLoadDetailsPage.clickOnPlanTab();
          await tritanPages.tritanAdminPage.clickPlusPickupButton();
          const proNumber = commonReusables.generateRandomNumber(6);
          await tritanPages.tritanAdminPage.enterProNumberValue(proNumber);
          await tritanPages.tritanAdminPage.enterDateAndTime(
            await commonReusables.getDate("today", "MM/DD/YYYY"),
            testData.shipperEarliestTime,
          );
          const pickupAlertMessage = await tritanPages.tritanAdminPage.clickPickupSaveAndValidateAlert(
            /Status message added/i,
          );
          expect(pickupAlertMessage, "Expected pickup Save to fire 'Status message added' alert").toMatch(
            /Status message added/i,
          );
          await commonReusables.waitForPageStable(tritanPage, { timeout: WAIT.LARGE });

          await tritanPages.tritanLoadPlanPage.setDropStatus(
            await commonReusables.getDate("today", "MM/DD/YYYY"),
            testData.consigneeEarliestTime,
          );
          const dropAlertMessage = await tritanPages.tritanLoadPlanPage.clickSaveButton(/Status message added/i);
          expect(dropAlertMessage, "Expected drop Save to fire 'Status message added' alert").toMatch(
            /Status message added/i,
          );
        });

        await test.step("Steps 21-22 [82789 21-22 + Expected]: Shipment Delivered status", async () => {
          await tritanPages.tritanLoadDetailsPage.clickOnLoadNumber(shipmentId);
          await tritanPages.shipmentDetailsPage.verifyStatus(LOAD_STATUS.DELIVERED);
        });

        await test.step("Steps 23-25 [82789 23-25 + Expected]: BTMS Extract — Set Complete", async () => {
          await tritanPages.tritanDashboardPage.hoverOnShipmentTemplateFromHeader();
          await tritanPages.tritanDashboardPage.hoverOnActivitiesTab();
          await tritanPages.tritanDashboardPage.clickOnListActivitiesTab();
          await tritanPages.shipmentActivitiesPage.selectBTMSExtractCheckbox();
          await tritanPages.shipmentActivitiesPage.selectActionFromDropdown(
            LOAD_ACTIVITIES.SET_COMPLETE,
          );
          await tritanPages.shipmentActivitiesPage.clickOnSubmitButton();
          await tritanPages.shipmentActivitiesPage.expectActivityStatusComplete("BTMS Extract");
        });

        await test.step(
          "Steps 26-29 [82789 26-29 + Expected]: BTMS login — poll shipment, validate load fields",
          async () => {
            btmsPage = await context.newPage();
            btmsPages = new PageManager(btmsPage);
            await btmsPages.btmsLoginPage.BTMSLogin(userSetup.globalUser);
            await btmsPages.homePage.clickSwitchAccountButton();
            await btmsPages.agentAccountsPage.clickOnUserNameIfVisible(USER_ROLES.BILLINGTOGGLE_USER);
            await btmsPages.basePage.refreshAndSearchFromMainHeader(shipmentId);

            await btmsPages.viewLoadPage.validateLoadStatus(LOAD_STATUS.DELIVERED);
            expect(await btmsPages.viewLoadPage.getLoadMethod()).toBe(LOAD_METHOD.LTL);
            expect(await btmsPages.viewLoadPage.getCreatedByValue()).toContain(
              LOAD_CREATED_BY.INTELYS_API_PORTAL,
            );
            expect(await btmsPages.viewLoadPage.getSourceSystemValue()).toBe(SOURCE_SYSTEM.TRITAN);
            expect(await btmsPages.viewLoadPage.getSourceSystemIDValue()).toBe(shipmentId);
          },
        );

        await test.step(
          "Steps 30-33 [82789 30-33 + Expected]: View Billing — Add New invoice over bill total",
          async () => {
            await btmsPages.viewLoadPage.clickViewBillingButton();
            await btmsPages.loadBillingPage.scrollBillingIssuesBlockIntoView();

            const overageIncrement = 125;
            btmsOverInvoiceAmount = (parseFloat(carrierBillTotal) + overageIncrement).toFixed(2);
            invoiceOverage = parseFloat(btmsOverInvoiceAmount) - parseFloat(carrierBillTotal);

            await btmsPages.loadBillingPage.clickAddNewCarrierInvoice();
            await btmsPages.loadBillingPage.enterCarrierInvoiceNumber(carrierInvoiceNumber);
            await btmsPages.loadBillingPage.enterCarrierInvoiceAmount(btmsOverInvoiceAmount);
            await btmsPages.loadBillingPage.clickSaveCarrierInvoice();
            await btmsPages.commonReusables.reloadAndAcceptDialogs(btmsPage, WAIT.SMALL);
            await btmsPages.page.reload();
            await commonReusables.waitForPageStable(btmsPage, { timeout: WAIT.XXLARGE });

            const payableToggle = await btmsPages.loadBillingPage.getPayableToggleValue();
            expect(payableToggle, "Expected after 33: Payables toggle moves to Agent").toBe(
              PAYABLES_TOGGLE_VALUE.AGENT,
            );

            const overcharge = invoiceOverage.toFixed(2);
            const expectedOverMsg = `${CARRIER_NAME.CARRIER_ESTES_EXPRESS_LINES} invoiced $${overcharge} ${FINANCE_MESSAGES.CARRIER_OVER_INVOICED}`;
            const overMsg = await btmsPages.loadBillingPage.findPayableMessageContaining(
              FINANCE_MESSAGES.CARRIER_OVER_INVOICED,
            );
            expect(overMsg, `Expected after 33: '${expectedOverMsg}'`).toContain(expectedOverMsg);
          },
        );

        await test.step(
          "Steps 34-41 [82789 34-41]: Tritan — carrier Short Pay Fuel Surcharge settlement",
          async () => {
            await tritanPage.bringToFront();
            await tritanPages.tritanDashboardPage.hoverOnShipmentTemplateFromHeader();
            await tritanPages.tritanDashboardPage.clickOnDetailsTab();
            await tritanPages.shipmentDetailsPage.clickOnLoadNumber(shipmentId);

            const carrierPopup = await tritanPages.tritanLoadDetailsPage.clickOnCarrierInvoiceBillTotalAmount();
            await tritanPages.tritanLoadDetailsPage.applyCarrierShortPaySettlement(
              carrierPopup,
              SELECT_QUEUE_ACTION.FORTY_VALID_APPROVED,
              PAYABLE_SHORT_PAY.FUEL_SURCHARGE_REASON,
              PAYABLE_SHORT_PAY.FUEL_SURCHARGE_COMMENT,
              invoiceOverage.toFixed(2),
            );
          },
        );

        await test.step("Steps 42-44 [82789 42-44]: Plan → Shipment — Customer Invoice print cancel", async () => {
          await tritanPages.tritanAdminPage.clickPlanButton();
          await tritanPages.tritanLoadDetailsPage.clickOnLoadNumber(shipmentId);
          await tritanPages.tritanDashboardPage.hoverOnShipmentTemplateFromHeader();
          await tritanPages.tritanDashboardPage.clickOnDetailsTab();
          await tritanPages.shipmentDetailsPage.clickOnPrintInvoiceIcon();
          await tritanPages.shipmentDetailsPage.selectInvoiceOptionAndValidateDownload(
            INVOICE_OPTIONS.MODE_CUSTINV_NO_QUAL,
          );
          await tritanPages.shipmentDetailsPage.clickOnCancelInvoiceButton();
        });

        await test.step(
          "Steps 45-46 [82789 45-46 + Expected]: Customer Invoice — 40 Extract queue",
          async () => {
            await tritanPages.shipmentDetailsPage.clickOnInvoiceBillTotal();
            await tritanPages.shipmentDetailsPage.clickOnEditChargesButton();
            await tritanPages.shipmentDetailsPage.selectQueue(SELECT_QUEUE_ACTION.FORTY_EXTRACT);
            await tritanPages.shipmentDetailsPage.clickOnSaveQueueButton();

            await commonReusables.waitForPageStable(tritanPage, { timeout: WAIT.XXLARGE });
            const invoiceQueue =
              await tritanPages.shipmentDetailsPage.getCustomerInvoiceQueueDisplayValue();
            expect(invoiceQueue, "Expected after 46: Customer Invoice Queue 50 Complete").toBe(
              SELECT_QUEUE_ACTION.FIFTY_COMPLETE,
            );

            const extractDate = await tritanPages.shipmentDetailsPage.getInvoiceExtractDate();
            const expectedDate = await commonReusables.getDate("today", "MM/DD/YYYY");
            expect(
              extractDate.length,
              "Expected after 46: Invoice Extract Date populated",
            ).toBeGreaterThan(0);
            expect(extractDate.startsWith(expectedDate)).toBeTruthy();
          },
        );

        await test.step(
          "Steps 47 [82789 47 + Expected]: BTMS Extract + Invoice Extract COMPLETE",
          async () => {
            await tritanPages.tritanDashboardPage.hoverOnShipmentTemplateFromHeader();
            await tritanPages.tritanDashboardPage.hoverOnActivitiesTab();
            await tritanPages.tritanDashboardPage.clickOnListActivitiesTab();
            await tritanPages.shipmentActivitiesPage.selectBTMSExtractCheckbox();
            await tritanPages.shipmentActivitiesPage.selectActionFromDropdown(
              LOAD_ACTIVITIES.SET_COMPLETE,
            );
            await tritanPages.shipmentActivitiesPage.clickOnSubmitButton();
            await tritanPages.shipmentActivitiesPage.expectActivityStatusComplete("BTMS Extract");
          },
        );

        await test.step(
          "Steps 48-49 [82789 48-49]: BTMS View Load — ensure INVOICED status",
          async () => {
            await btmsPage.bringToFront();
            await btmsPages.basePage.refreshAndSearchFromMainHeader(shipmentId);
            const currentStatus = await btmsPages.viewLoadPage.getLoadStatusText();
            if (currentStatus !== LOAD_STATUS.INVOICED) {
              await btmsPages.viewLoadPage.clickEditButton();
               await commonReusables.waitForPageStable(btmsPage, { timeout: WAIT.LARGE });
              await btmsPages.editLoadFormPage.capShareAmountIfOver100();
              await btmsPages.editLoadFormPage.selectLoadStatus(LOAD_STATUS.DELIVERED_FINAL);
              await btmsPages.commonReusables.acceptAllDialogsDuringAction(
                btmsPage,
                () => btmsPages.editLoadFormPage.clickOnSaveBtn(),
                WAIT.DEFAULT,
              );
            }
            await btmsPages.viewLoadPage.refreshAndValidateLoadStatus(LOAD_STATUS.INVOICED);
          },
        );

        await test.step(
          "Step 50 [82789 50 + Expected]: View Billing — Payables Fuel Surcharge reason and message",
          async () => {
            await btmsPages.viewLoadPage.clickViewBillingButton();
            await btmsPages.loadBillingPage.scrollBillingIssuesBlockIntoView();

            const payableToggle = await btmsPages.loadBillingPage.getPayableToggleValue();
            expect(payableToggle, "Expected after 50: Payables toggle set to Payables").toBe(
              PAYABLES_TOGGLE_VALUE.PAYABLES,
            );

            const payableReason = await btmsPages.loadBillingPage.getPayableReasonDisplayValue();
            expect(payableReason, "Expected after 50: Payable Reason Short Pay - Fuel Surcharge").toContain(
              PAYABLE_SHORT_PAY.FUEL_SURCHARGE_REASON,
            );

            const payableMsg = await btmsPages.loadBillingPage.findPayableMessageContaining(
              PAYABLE_SHORT_PAY.FUEL_SURCHARGE_MESSAGE,
            );
            expect(payableMsg, "Expected after 50: Fuel Surcharge short pay message").toContain(
              PAYABLE_SHORT_PAY.FUEL_SURCHARGE_MESSAGE,
            );
          },
        );

        await test.step(
          "Steps 51-53 [82789 51-53]: Tritan — second Short Pay Accessorial settlement",
          async () => {
            await tritanPage.bringToFront();
            await tritanPages.tritanDashboardPage.hoverOnShipmentTemplateFromHeader();
            await tritanPages.tritanDashboardPage.clickOnDetailsTab();
            await tritanPages.shipmentDetailsPage.clickOnLoadNumber(shipmentId);

            const carrierPopup = await tritanPages.tritanLoadDetailsPage.clickOnCarrierInvoiceBillTotalAmount();
            await tritanPages.tritanLoadDetailsPage.applyCarrierShortPaySettlement(
              carrierPopup,
              SELECT_QUEUE_ACTION.FORTY_VALID_APPROVED,
              SETTLEMENT_REASONS.SHORT_PAY_ACCESSORIAL,
              PAYABLE_SHORT_PAY.ACCESSORIAL_AGAIN_COMMENT,
              invoiceOverage.toFixed(2),
            );
          },
        );

        await test.step(
          "Step 54 [82789 54 + Expected]: BTMS refresh until Accessorial short pay message appears",
          async () => {
            await btmsPage.bringToFront();
            await btmsPages.loadBillingPage.scrollBillingIssuesBlockIntoView();

            await expect
              .poll(
                async () => {
                  await btmsPages.commonReusables.reloadAndAcceptDialogs(btmsPage, WAIT.SMALL);
                  await btmsPages.loadBillingPage.scrollBillingIssuesBlockIntoView();
                  return btmsPages.loadBillingPage.findPayableMessageContaining(
                    PAYABLE_SHORT_PAY.ACCESSORIAL_AGAIN_MESSAGE,
                  );
                },
                { timeout: WAIT.FIVE_MINUTES, intervals: [15_000] }, 
              )
              .toContain(PAYABLE_SHORT_PAY.ACCESSORIAL_AGAIN_MESSAGE);

            const payableToggle = await btmsPages.loadBillingPage.getPayableToggleValue();
            expect(payableToggle, "Expected after 54: Payables toggle set to Payables").toBe(
              PAYABLES_TOGGLE_VALUE.PAYABLES,
            );

            const payableReason = await btmsPages.loadBillingPage.getPayableReasonDisplayValue();
            expect(
              payableReason,
              "Expected after 54: Payable Reason Short Pay - Accessorial",
            ).toContain(SETTLEMENT_REASONS.SHORT_PAY_ACCESSORIAL);
          },
        );
      },
    );
  },
);
