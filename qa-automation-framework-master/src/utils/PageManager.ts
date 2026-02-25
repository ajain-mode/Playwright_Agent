/**
 * PageManager - Centralized Page Object Manager for Test Automation Framework
 *
 * @description This class implements the Factory pattern for page objects with on-demand creation.
 * Provides centralized access to all page objects and utility classes, ensuring memory
 * efficiency by creating page instances only when first accessed.
 *
 * @author Deepak Bohra
 */

import { Page } from '@playwright/test';
import BasePage from '@pages/commonPages/basePage';
import OfficePage from '@pages/admin/OfficePage';
import AdminPage from '@pages/admin/AdminPage';
import CustomerPage from '@pages/customers/CustomerPage';
import EditLoadCarrierTabPage from '@pages/loads/editLoadPage/EditLoadCarrierTabPage';
import EditLoadFormPage from '@pages/loads/editLoadPage/EditLoadFormPage';
import EditLoadLoadTabPage from '@pages/loads/editLoadPage/EditLoadLoadTabPage';
import EditLoadPickTabPage from '@pages/loads/editLoadPage/EditLoadPickTabPage';
import PostAutomationRulePage from '@pages/home/PostAutomationRulePage';
import BTMSLoginPage from '@pages/login/BTMSLoginPage';
import TNXLoginPage from '@pages/login/TNXLoginPage';
import DMELoginPage from '@pages/login/DMELoginPage';
import EditLoadPage from '@pages/loads/editLoadPage/EditLoadPage';
import logger from '@utils/loggerUtil';
import commonReusables from '@utils/commonReusables';
import dataConfig from '@config/dataConfig';
import toggleSettings from '@utils/dfbUtils/officeConfig';
import FinancePage from '@pages/finance/FinancePage';
import NonTabularLoadPage from '@pages/loads/editLoadPage/NonTabularLoadPage';
import EditLoadDropTabPage from '@pages/loads/editLoadPage/EditLoadDropTabPage';
import HomePage from '@pages/commonPages/HomePage';
import LoadsPage from '@pages/loads/LoadsPage';
import LoadTender204Page from '@pages/loads/LoadTender204Page';
import EDI204LoadTendersPage from '@pages/loads/EDI204LoadTendersPage';
import ViewLoadDropTabPage from '@pages/loads/viewLoadPage/ViewLoadDropTabPage';
import ViewLoadPickTabPage from '@pages/loads/viewLoadPage/ViewLoadPickTabPage';
import ViewLoadCustomerTabPage from '@pages/loads/viewLoadPage/ViewLoadCustomerTabPage';
import ViewLoadPage from '@pages/loads/viewLoadPage/ViewLoadPage';
import ViewLoadEDITabPage from '@pages/loads/viewLoadPage/ViewLoadEDITabPage';
import EditLoadRailTabPage from '@pages/loads/editLoadPage/EditLoadRailTabPage';
import ViewLoadCarrierTabPage from '@pages/loads/viewLoadPage/ViewLoadCarrierTabPage';
import { EditLoadValidationFieldPage } from '@pages/loads/editLoadPage/EditLoadValidationFieldPage';
import dfbHelpers from './dfbUtils/dfbHelpers';
import requiredFieldAlertValidator from './dfbUtils/requiredFieldAlertValidator';
import EditLoadTabularFieldHelpers from '@pages/loads/editLoadPage/EditLoadTabularFieldHelpers';
import ViewCustomerPage from '@pages/customers/ViewCustomerPage';
import SearchCustomerPage from '@pages/customers/SearchCustomerPage';
import ViewMasterCustomerPage from '@pages/customers/ViewMasterCustomerPage';
import EditCustomerPage from '@pages/customers/EditCustomerPage';
import NewSalesLeadPage from '@pages/salesLead/NewSalesLeadPage';
import AccountClearanceQueuePage from '@pages/salesLead/AccountClearanceQueuePage';
import ViewSalesLeadPage from '@pages/salesLead/ViewSalesLeadPage'
import LoadBillingPage from '@pages/loads/LoadBillingPage';
import TNXLandingPage from '@pages/tnx/TNXLandingPage';
import DFBLoadFormPage from '@pages/loads/DFBLoadFormPage';
import DMELoadPage from '@pages/dme/DMELoadPage';
import DMEDashboardPage from '@pages/dme/DMEDashboradPage';
import TNXCarrierTenderPage from '@pages/tnx/TNXCarrierTender.Page';
import TNXExecutionTenderPage from '@pages/tnx/TNXExecutionNotesPage';
import DuplicateLoadPage from '@pages/loads/DuplicateLoadPage';
import LoadTemplateSearchPage from '@pages/loads/templateLoadPage/LoadTemplateSearchPage';
import EditTemplatePage from '@pages/loads/templateLoadPage/EditTemplatePage';
import LTLQuoteRequestPage from '@pages/loads/ltlQuotePage/LTLQuoteRequestPage';
import EditMasterCustomerPage from '@pages/customers/EditMasterCustomerPage';
import TRITANLoginPage from '@pages/login/TRITANLoginPage';
import CustomerDemoPortalPage from '@pages/tritan/CustomerDemoPortalPage';
import AddQuickQuotePage from '@pages/tritan/AddQuickQuotePage';
import CustomerPortalLogin from '@pages/login/CustomerPortalLogin';
import QuoteLTL from '@pages/customerPortal/QuoteLTL';
import CustomerMasterListPage from '@pages/customers/CustomerMasterListPage';
import TNXRepLoginPage from '@pages/login/TNXRepLoginPage';
import TNXRepLandingPage from '@pages/tnx/TNXRepLandingPage';
import { DFBIncludeCarriersDataModalWaterfall } from '@pages/loads/DFBIncludeCarriersDataModalWaterfall';
import SimulateEDispatchPage from '@pages/admin/SimulateEDispatch';
import ViewOfficeInfoPage from '@pages/admin/ViewOfficeInfoPage';
import EditOfficeInfoPage from '@pages/admin/EditOfficeInfoPage';
import SimulateEDispatchDocumentUploadPage from '@pages/admin/SimulateEDispatchDocument';
import TritanAdmin from '@pages/tritan/TritanAdmin';
import LegacyCustomerPortalLogin from '@pages/login/LegacyCustomerPortalLogin';
import LCPQuoteLTL from '@pages/legacyCustomerPortal/QuoteLTL';
import TritanLoadLinksPage from '@pages/tritan/TritanLoadLinksPage';
import TritanDashboardPage from '@pages/tritan/TritanDashboardPage';
import TritanCompanyPage from '@pages/tritan/TritanCompanyPage';
import CarrierSearch from '@pages/carrier/carrierSearch';
import ViewCarrier from '@pages/carrier/ViewCarrier';
import AccountsPayablePage from '@pages/finance/AccountsPayablePage';
import OfficeCommissionsDetailPage from '@pages/finance/OfficeCommissionsDetailPage';
import OfficeCommissionsSummaryPage from '@pages/finance/OfficeCommissionsSummaryPage';
import TritanListLoadPage from '@pages/tritan/TritanListLoadPage';
import TritanLoadPlanPage from '@pages/tritan/TritanLoadPlanPage';
import TritanLoadDetailsPage from '@pages/tritan/TritanLoadDetailsPage';
import BulkChangeHelper from '@utils/bulkChangeUtils/bulkChangeHelper';
import EditLoadCustomerTabPage from '@pages/loads/editLoadPage/EditLoadCustomerTabPage';
import SelectChangesPage from '@pages/bulkChange/SelectChangesPage';
import AgentSearchPage from '@pages/admin/agent/AgentSearchPage';
import AgentInfoPage from '@pages/admin/agent/AgentInfoPage';
import AgentEditPage from '@pages/admin/agent/AgentEditPage';
import DuplicateAgentPage from '@pages/admin/agent/DuplicateAgentPage';
import MySalesLeadPage from '@pages/salesLead/MySalesLeadPage';
import EditSalesLeadPage from '@pages/salesLead/EditSalesLeadPage';
import LeadsRequestingActivationPage from '@pages/salesLead/LeadsRequestingActivation';
import EmailedDocumentsForLoadPage from '@pages/loads/viewLoadPage/EmailedDocumentsForLoadPage';
import ListShipmentTemplate from '@pages/tritan/ListShipmentTemplate';
import AddShipment from '@pages/tritan/AddShipment';
import ShipmentActivities from '@pages/tritan/ShipmentActivities';
import ShipmentDetailsPage from '@pages/tritan/ShipmentDetailsPage';
import MyBulkLoadsChangesAndImports from '@pages/bulkChange/MyBulkLoadsChangesAndImports';
import AgentAccountsPage from '@pages/commonPages/AgentAccountsPage';
import AllLoadsSearchPage from '@pages/loads/AllLoadsSearchPage';  
import PostAutomationRulePageEditEntryModal from '@pages/home/PostAutomationRulesEditEntryModal';
import CarrierPortalPage from '@pages/carrierPortal/CarrierPortalPage';
import BTMSAcceptTermPage from '@pages/login/BTMSAcceptTermPage';
import BillingAdjustmentsQueue from '@pages/finance/BillingAdjustmentsQueue';

//Type definitions for better type safety
type PageConstructor<T> = new (page: Page) => T;

export class PageManager {
  private _pages = new Map<string, unknown>();

  // Utilities available directly - no imports needed in test files!
  public logger = logger;
  public commonReusables = commonReusables;
  public dataConfig = dataConfig;
  public toggleSettings = toggleSettings;
  public dfbHelpers = dfbHelpers;
  public requiredFieldAlertValidator = requiredFieldAlertValidator;

  /**
   * Constructor to initialize PageManager with Playwright Page instance
   * @author Deepak Bohra
   */
  constructor(public page: Page) {
    // No page objects created here! Only when accessed.
  }

  /**
   * Creates and caches page objects using Factory pattern
   * @author Deepak Bohra
   */
  private createPage<T>(key: string, PageClass: PageConstructor<T>): T {
    if (!this._pages.has(key)) {
      console.log(`Creating ${PageClass.name}...`);
      const pageInstance = new PageClass(this.page);
      this._pages.set(key, pageInstance);
      return pageInstance;
    }
    return this._pages.get(key) as T;
  }

  /**
   * Gets BasePage instance with on-demand creation
   * @author Deepak Bohra
   */
  get basePage(): BasePage {
    return this.createPage('basePage', BasePage);
  }

  /**
   * Gets OfficePage instance with on-demand creation
   * @author Deepak Bohra
   */
  get officePage(): OfficePage {
    return this.createPage('officePage', OfficePage);
  }

  /**
   * Gets AdminPage instance with on-demand creation
   * @author Parth Rastogi
   */
  get adminPage(): AdminPage {
    return this.createPage('adminPage', AdminPage);
  }

  /**
   * Gets CustomerPage instance with on-demand creation
   * @author Parth Rastogi
   */
  get customerPage(): CustomerPage {
    return this.createPage('customerPage', CustomerPage);
  }

  /**
   * Gets SearchCustomerPage instance with on-demand creation
   * @author Deepak Bohra
   */
  get searchCustomerPage(): SearchCustomerPage {
    return this.createPage('searchCustomerPage', SearchCustomerPage);
  }

  /**
   * Gets EditLoadDropTabPage instance with on-demand creation
   * @author Deepak Bohra
   */
  get editLoadDropTabPage(): EditLoadDropTabPage {
    return this.createPage('editLoadDropTabPage', EditLoadDropTabPage);
  }

  /**
   * Gets EditLoadCarrierTabPage instance with on-demand creation
   * @author Deepak Bohra
   */
  get editLoadCarrierTabPage(): EditLoadCarrierTabPage {
    return this.createPage('editLoadCarrierTabPage', EditLoadCarrierTabPage);
  }

  /**
   * Gets EditLoadFormPage instance with on-demand creation
   * @author Deepak Bohra
   */
  get editLoadFormPage(): EditLoadFormPage {
    return this.createPage('editLoadFormPage', EditLoadFormPage);
  }

  /**
   * Gets EditLoadLoadTabPage instance with on-demand creation
   * @author Deepak Bohra
   */
  get editLoadLoadTabPage(): EditLoadLoadTabPage {
    return this.createPage('editLoadLoadTabPage', EditLoadLoadTabPage);
  }

  /**
   * Gets EditLoadPickTabPage instance with on-demand creation
   * @author Deepak Bohra
   */
  get editLoadPickTabPage(): EditLoadPickTabPage {
    return this.createPage('editLoadPickTabPage', EditLoadPickTabPage);
  }

  /**
   * Gets PostAutomationRulePage instance with on-demand creation
   * @author Parth Rastogi
   */
  get postAutomationRulePage(): PostAutomationRulePage {
    return this.createPage('postAutomationRulePage', PostAutomationRulePage);
  }
  get btmsLoginPage(): BTMSLoginPage {
    return this.createPage('btmsLoginPage', BTMSLoginPage);
  }

  /**
   * Customer Portal login Page instance with on-demand creation
   * @author Aniket Nale
   * @created 2025-11-03
   */
  get CustomerPortalLogin(): CustomerPortalLogin {
    return this.createPage('customerPortalLoginPage', CustomerPortalLogin);
  }

  /**
     * TNX login Page instance with on-demand creation
     * @author Deepak Bohra
     * @created 2025-08-29
     */
  get tnxLoginPage(): TNXLoginPage {
    return this.createPage('tnxLoginPage', TNXLoginPage);
  }

  /**
   * DME login Page instance with on-demand creation
   * @author Deepak Bohra
   * @created 2025-08-29
   */
  get dmeLoginPage(): DMELoginPage {
    return this.createPage('dmeLoginPage', DMELoginPage);
  }
  get homePage(): HomePage {
    return this.createPage('homePage', HomePage);
  }
  get loadsPage(): LoadsPage {
    return this.createPage('loadsPage', LoadsPage);
  }
  get loadTender204Page(): LoadTender204Page {
    return this.createPage('loadTender204Page', LoadTender204Page);
  }
  get edi204LoadTendersPage(): EDI204LoadTendersPage {
    return this.createPage('edi204LoadTendersPage', EDI204LoadTendersPage);
  }
  get viewPickDetailsTabPage(): ViewLoadPickTabPage {
    return this.createPage('viewPickDetailsTabPage', ViewLoadPickTabPage);
  }
  get viewDropDetailsTabPage(): ViewLoadDropTabPage {
    return this.createPage('viewDropDetailsTabPage', ViewLoadDropTabPage);
  }
  get viewLoadCustomerTabPage(): ViewLoadCustomerTabPage {
    return this.createPage('viewLoadCustomerTabPage', ViewLoadCustomerTabPage);
  }
  get viewLoadPage(): ViewLoadPage {
    return this.createPage('viewLoadPage', ViewLoadPage);
  }
  get viewLoadEDITabPage(): ViewLoadEDITabPage {
    return this.createPage('viewLoadEDITabPage', ViewLoadEDITabPage);
  }

  get financePage(): FinancePage {
    return this.createPage('financePage', FinancePage);
  }

  get editLoadPage(): EditLoadPage {
    return this.createPage('editLoadPage', EditLoadPage);
  }
  get editLoadRailTabPage(): EditLoadRailTabPage {
    return this.createPage('editLoadRailTabPage', EditLoadRailTabPage);
  }
  get viewLoadCarrierTabPage(): ViewLoadCarrierTabPage {
    return this.createPage('viewLoadCarrierTabPage', ViewLoadCarrierTabPage);
  }

  get nonTabularLoadPage(): NonTabularLoadPage {
    return this.createPage('nonTabularLoadPage', NonTabularLoadPage);
  }

  /**
   * Gets EditLoadValidationFieldPage instance with on-demand creation
   * @author Deepak Bohra
   * @modified  22-08-2025
   */
  get editLoadValidationFieldPage(): EditLoadValidationFieldPage {
    return this.createPage('editLoadValidationFieldPage', EditLoadValidationFieldPage);
  }

  /**
   * Gets EditLoadTabularFieldHelpers instance with on-demand creation
   * @author Deepak Bohra
   */
  get editLoadTabularFieldHelpers(): EditLoadTabularFieldHelpers {
    return this.createPage('editLoadTabularFieldHelpers', EditLoadTabularFieldHelpers);
  }
  /**
   * Gets LoadBillingPage instance with on-demand creation
   * @author Rohit Singh
   * @created 2025-08-08
   */
  get loadBillingPage(): LoadBillingPage {
    return this.createPage('loadBillingPage', LoadBillingPage);
  }
  /**
   * Gets ViewCustomerPage instance with on-demand creation
   * @author Rohit Singh
   * @created 2025-08-19
   */
  get viewCustomerPage(): ViewCustomerPage {
    return this.createPage('viewCustomerPage', ViewCustomerPage);
  }
  /**
   * Gets ViewMasterCustomerPage instance with on-demand creation
   * @author Rohit Singh
   * @created 2025-08-19
   */
  get viewMasterCustomerPage(): ViewMasterCustomerPage {
    return this.createPage('viewMasterCustomerPage', ViewMasterCustomerPage);
  }
  /**
   * Gets EditCustomerPage instance with on-demand creation
   * @author Rohit Singh
   * @created 2025-08-19
   */
  get editCustomerPage(): EditCustomerPage {
    return this.createPage('editCustomerPage', EditCustomerPage);
  }

  /**
   * Gets New Sales Lead Page instance with on-demand creation
   * @author Avanish Srivastava
   * @created 2025-09-05
   */

  get newSalesLeadPage(): NewSalesLeadPage {
    return this.createPage('newSalesLeadPage', NewSalesLeadPage)
  }

  /**
   * Gets My Sales Lead Page instance with on-demand creation
   * @author Avanish Srivastava
   * @created 2025-09-05
   */

  get mySalesLeadPage(): MySalesLeadPage {
    return this.createPage('mySalesLeadPage', MySalesLeadPage)
  }

  /**
   * Gets account Clearance Queue Page instance with on-demand creation
   * @author Avanish Srivastava
   * @created 2025-09-05
   */

  get accountClearanceQueuePage(): AccountClearanceQueuePage {
    return this.createPage('accountClearanceQueuePage', AccountClearanceQueuePage)
  }

  /**
   * Gets View Sales Lead Page instance with on-demand creation
   * @author Avanish Srivastava
   * @created 2025-09-05
   */

  get viewSalesLeadPage(): ViewSalesLeadPage {
    return this.createPage('viewSalesLeadPage', ViewSalesLeadPage)
  }
  /**
  * Gets TNX Landing instance with on-demand creation
  * @author Deepak Bohra
  * @created 2025-08-29
  */

  get tnxLandingPage(): TNXLandingPage {
    return this.createPage('tnxLandingPage', TNXLandingPage);
  }

  /**
  * Gets DFBLoadFormPage instance with on-demand creation
  * @author Deepak Bohra
  * @created 2025-08-29
  */

  get dfbLoadFormPage(): DFBLoadFormPage {
    return this.createPage('dfbLoadFormPage', DFBLoadFormPage);
  }

  /**
  * Gets DMELoadPage instance with on-demand creation
  * @author Deepak Bohra
  * @created 2025-08-29
  */

  get dmeLoadPage(): DMELoadPage {
    return this.createPage('dmeLoadPage', DMELoadPage);
  }

  /**
   * Gets DME DashboardLoadPage instance with on-demand creation
   * @author Deepak Bohra
   * @created 2025-08-29
   */

  get dmeDashboardPage(): DMEDashboardPage {
    return this.createPage('dmeDashboardPage', DMEDashboardPage);
  }

  /**
   * Gets TNX Carrier Page instance with on-demand creation
   * @author Deepak Bohra
   * @created 2025-08-29
   */

  get tnxCarrierTenderPage(): TNXCarrierTenderPage {
    return this.createPage('tnxCarrierTenderPage', TNXCarrierTenderPage);
  }

  /**
   * Gets TNX Carrier Page instance with on-demand creation
   * @author Deepak Bohra
   * @created 2025-08-29
   */

  get tnxExecutionTenderPage(): TNXExecutionTenderPage {
    return this.createPage('tnxExecutionTenderPage', TNXExecutionTenderPage);
  }


  /**
   * Gets TNX Carrier Page instance with on-demand creation
   * @author Deepak Bohra
   * @created 2025-08-29
   */

  get duplicateLoadPage(): DuplicateLoadPage {
    return this.createPage('duplicateLoadPage', DuplicateLoadPage);
  }

  /**
  * Gets LoadTemplateSearchPage instance with on-demand creation
  * @author Parth Rastogi
  */
  get loadTemplateSearchPage(): LoadTemplateSearchPage {
    return this.createPage('loadTemplateSearchPage', LoadTemplateSearchPage);
  }

  /**
  * Gets LoadTemplateSearchPage instance with on-demand creation
  * @author Parth Rastogi
  */
  get editTemplatePage(): EditTemplatePage {
    return this.createPage('editTemplatePage', EditTemplatePage);
  }


  /**
   * Gets LTLQuotePage  instance with on-demand creation
   * @author Aniket Nale
   * @created 2025-10-06
   */

  get ltlQuoteRequestPage(): LTLQuoteRequestPage {
    return this.createPage('ltlQuoteRequestPage', LTLQuoteRequestPage);
  }

  /**
   * Gets quoteLTL instance with on-demand creation
   * @author Aniket Nale
   * @created 2025-11-03
   */
  get quoteLTL(): QuoteLTL {
    return this.createPage('quoteLTL', QuoteLTL);
  }

  /**
   * Gets EditMasterCustomerPage instance with on-demand creation
   * @author Rohit Singh
   * @created 2025-10-13
   */
  get editMasterCustomerPage(): EditMasterCustomerPage {
    return this.createPage('editMasterCustomerPage', EditMasterCustomerPage);
  }
  /**
   * Gets TRITANLoginPage instance with on-demand creation
   * @author Rohit Singh
   * @created 2025-10-24
   */
  get tritanLoginPage(): TRITANLoginPage {
    return this.createPage('tritanLoginPage', TRITANLoginPage);
  }
  /**
   * Gets CustomerDemoPortalPage instance with on-demand creation
   * @author Rohit Singh
   * @created 2025-10-28
   */
  get customerDemoPortalPage(): CustomerDemoPortalPage {
    return this.createPage('customerDemoPortalPage', CustomerDemoPortalPage);
  }
  /**
   * Gets AddQuickQuotePage instance with on-demand creation
   * @author Rohit Singh
   * @created 2025-10-28
   */
  get addQuickQuotePage(): AddQuickQuotePage {
    return this.createPage('addQuickQuotePage', AddQuickQuotePage);
  }
  /**
   * Gets CustomerMasterListPage instance with on-demand creation
   * @author Rohit Singh
   * @created 2025-11-06
   */
  get customerMasterListPage(): CustomerMasterListPage {
    return this.createPage('customerMasterListPage', CustomerMasterListPage);
  }

  /**
    * TNX login Page instance with on-demand creation
    * @author Parth Rastogi
    * @created 2025-11-10
    */
  get tnxRepLoginPage(): TNXRepLoginPage {
    return this.createPage('tnxRepLoginPage', TNXRepLoginPage);
  }

  /**
* Gets TNX Landing instance with on-demand creation
* @author Parth Rastogi
* @created 2025-11-10
*/

  get tnxRepLandingPage(): TNXRepLandingPage {
    return this.createPage('tnxRepLandingPage', TNXRepLandingPage);
  }

  /**
  * Gets EditLoadValidationFieldPage instance with on-demand creation
  * @author Parth Rastogi
  * @modified  13-11-2025
  */
  get dfbIncludeCarriersDataModalWaterfall(): DFBIncludeCarriersDataModalWaterfall {
    return this.createPage('dfbIncludeCarriersDataModalWaterfall', DFBIncludeCarriersDataModalWaterfall);
  }


  /**
   * Gets SimulateEDispatchPage instance with on-demand creation
   * @author Aniket Nale
   * @created 2025-11-11
   */
  get simulateEDispatchPage(): SimulateEDispatchPage {
    return this.createPage('simulateEDispatchPage', SimulateEDispatchPage);
  }

  /* Gets ViewOfficeInfoPage instance with on-demand creation
   * @author Rohit Singh
   * @created 2025-11-12
   */
  get viewOfficeInfoPage(): ViewOfficeInfoPage {
    return this.createPage('viewOfficeInfoPage', ViewOfficeInfoPage);
  }
  /**
   * Gets EditOfficeInfoPage instance with on-demand creation
   * @author Rohit Singh
   * @created 2025-11-12
   */
  get editOfficeInfoPage(): EditOfficeInfoPage {
    return this.createPage('editOfficeInfoPage', EditOfficeInfoPage);
  }

  /**
   * Gets SimulateEDispatchDocumentUploadPage instance with on-demand creation
   * @author Aniket Nale
   * @created 2025-11-14
   */
  get simulateEDispatchDocumentUploadPage(): SimulateEDispatchDocumentUploadPage {
    return this.createPage('simulateEDispatchDocumentUploadPage', SimulateEDispatchDocumentUploadPage);
  }

  /**
   * Gets TritanAdmin instance with on-demand creation
   * @author Aniket Nale
   * @created 2025-11-17
   */
  get tritanAdminPage(): TritanAdmin {
    return this.createPage('tritanAdminPage', TritanAdmin);
  }

  /**
  * Gets LegacyCustomerPortalLogin instance with on-demand creation
  * @author Aniket Nale
  * @created 19-Nov-2025
  */
  get legacyCustomerPortalLogin(): LegacyCustomerPortalLogin {
    return this.createPage('legacyCustomerPortalLogin', LegacyCustomerPortalLogin);
  }

  /**
  * Gets lcpQuoteLTL instance with on-demand creation
  * @author Aniket Nale
  * @created 19-Nov-2025
  */
  get lcpQuoteLTL(): LCPQuoteLTL {
    return this.createPage('lcpQuoteLTL', LCPQuoteLTL);
  }
  /**
   * Gets LoadLinksPage instance with on-demand creation
   * @author Rohit Singh
   * @created 20-Nov-2025
   */
  get tritanLoadLinksPage(): TritanLoadLinksPage {
    return this.createPage('tritanLoadLinksPage', TritanLoadLinksPage);
  }
  /**
   * Gets TritanDashboardPage instance with on-demand creation
   * @author Rohit Singh
   * @created 24-Nov-2025
   */
  get tritanDashboardPage(): TritanDashboardPage {
    return this.createPage('tritanDashboardPage', TritanDashboardPage);
  }
  /**
   * Gets TritanCompanyPage instance with on-demand creation
   * @author Rohit Singh
   * @created 24-Nov-2025
   */
  get tritanCompanyPage(): TritanCompanyPage {
    return this.createPage('tritanCompanyPage', TritanCompanyPage);
  }

  /**
* Gets carrierSearch instance with on-demand creation
* @author Aniket Nale
* @created 25-Nov-2025
*/
  get carrierSearchPage(): CarrierSearch {
    return this.createPage('carrierSearchPage', CarrierSearch);
  }

  /**
* Gets viewCarrier instance with on-demand creation
* @author Aniket Nale
* @created 25-Nov-2025
*/

  get viewCarrierPage(): ViewCarrier {
    return this.createPage('viewCarrierPage', ViewCarrier);
  }
  /**
* Gets agentSearchPage instance with on-demand creation
* @author Mukul Khan
* @created 01-Dec-2025
*/
  get agentSearchPage(): AgentSearchPage {
    return this.createPage('agentSearchPage', AgentSearchPage);
  }
  /** Gets AgentInfoPage instance with on-demand creation
  * @author Mukul Khan
  * @created 01-Dec-2025
  */
  get agentInfoPage(): AgentInfoPage {
    return this.createPage('agentInfoPage', AgentInfoPage);
  }
  /**
   * Gets TritanListLoadPage instance with on-demand creation
   * @author Rohit Singh
   * @created 2025-12-17
   */
  get tritanListLoadPage(): TritanListLoadPage {
    return this.createPage('tritanListLoadPage', TritanListLoadPage);
  }
  /**
   * Gets TritanLoadPlanPage instance with on-demand creation
   * @author Rohit Singh
   * @created 2025-12-17
   */
  get tritanLoadPlanPage(): TritanLoadPlanPage {
    return this.createPage('tritanLoadPlanPage', TritanLoadPlanPage);
  }
  /**
   * Gets TritanLoadDetailsPage instance with on-demand creation
   * @author Rohit Singh
   * @created 2025-12-17
   */
  get tritanLoadDetailsPage(): TritanLoadDetailsPage {
    return this.createPage('tritanLoadDetailsPage', TritanLoadDetailsPage);
  }
  /**
   * Gets EditLoadCustomerTabPage instance with on-demand creation
   * @author Rohit Singh
   * @created 2025-12-22
   */
  get editLoadCustomerTabPage(): EditLoadCustomerTabPage {
    return this.createPage('editLoadCustomerTabPage', EditLoadCustomerTabPage);
  }


  /* Gets BulkChangeHelper instance with on-demand creation
  * @author Tejaswini
  * @created 2025-12-24
  */
  get bulkChangeHelper(): BulkChangeHelper {
    return this.createPage('bulkChangeHelper', BulkChangeHelper);
  }

  /**
   * Gets AgentEditPage instance with on-demand creation
   * @author Mukul Khan
   * @created 19-Dec-2025
   */
  get agentEditPage(): AgentEditPage {
    return this.createPage('agentEditPage', AgentEditPage);
  }

  /**
   * Gets DuplicateAgentPage instance with on-demand creation
   * @author Mukul Khan
   * @created 02-Jan-2026
   */
  get duplicateAgentPage(): DuplicateAgentPage {
    return this.createPage('duplicateAgentPage', DuplicateAgentPage);
  }

  /**
   * Gets AccountsPayablePage instance with on-demand creation
   * @author Rohit Singh
   * @created 2025-12-26
   */
  get accountsPayablePage(): AccountsPayablePage {
    return this.createPage('accountsPayablePage', AccountsPayablePage);
  }
  /**
   * Gets OfficeCommissionsDetailPage instance with on-demand creation
   * @author Rohit Singh
   * @created 2025-12-26
   */
  get officeCommissionsDetailPage(): OfficeCommissionsDetailPage {
    return this.createPage('officeCommissionsDetailPage', OfficeCommissionsDetailPage);
  }
  /**
   * Gets OfficeCommissionsSummaryPage instance with on-demand creation
   * @author Rohit Singh
   * @created 2025-12-26
   */
  get officeCommissionsSummaryPage(): OfficeCommissionsSummaryPage {
    return this.createPage('officeCommissionsSummaryPage', OfficeCommissionsSummaryPage);
  }
  /**
   * Gets EmailedDocumentsForLoadPage instance with on-demand creation
   * @author Rohit Singh
   * @created 2025-12-30
   */
  get emailedDocumentsForLoadPage(): EmailedDocumentsForLoadPage {
    return this.createPage('emailedDocumentsForLoadPage', EmailedDocumentsForLoadPage);
  }

  /** Gets TritanLoadDetailsPage instance with on-demand creation
  * @author Rohit Singh
  * @created 2025-12-17
  */
  get editSalesLeadPage(): EditSalesLeadPage {
    return this.createPage('editSalesLeadPage', EditSalesLeadPage);
  }

  get leadsRequestingActivationPage(): LeadsRequestingActivationPage {
    return this.createPage('leadsRequestingActivationPage', LeadsRequestingActivationPage);
  }

  get listShipmentTemplatePage(): ListShipmentTemplate {
    return this.createPage('listShipmentTemplatePage', ListShipmentTemplate);
  }

  get addShipment(): AddShipment {
    return this.createPage('addShipment', AddShipment);
  }

  get shipmentActivitiesPage(): ShipmentActivities {
    return this.createPage('shipmentActivitiesPage', ShipmentActivities);
  }

  get shipmentDetailsPage(): ShipmentDetailsPage {
    return this.createPage('shipmentDetailsPage', ShipmentDetailsPage);
  }
  /**
   * Gets MyBulkLoadsChangesAndImports instance with on-demand creation
   * @author Tejaswini
   * @created 2026-01-14
   */
  get myBulkLoadsChangesAndImports(): MyBulkLoadsChangesAndImports {
    return this.createPage('myBulkLoadsChangesAndImports', MyBulkLoadsChangesAndImports);
  }
  /**
   * Gets SelectChangesPage instance with on-demand creation
   * @author Tejaswini
   * @created 2026-01-14
   */
  get selectChangesPage(): SelectChangesPage {
    return this.createPage('selectChangesPage', SelectChangesPage);
  }
  /**
   * Gets AgentAccountsPage instance with on-demand creation
   * @author Rohit Singh
   * @created 2026-01-09
   */
  get agentAccountsPage(): AgentAccountsPage {
    return this.createPage('agentAccountsPage', AgentAccountsPage);
  }

  /**
   * Gets AllLoadsSearchPage instance with on-demand creation
   * @author Tejaswini
   * @created 2026-01-16
   */
  get allLoadsSearchPage(): AllLoadsSearchPage {
    return this.createPage('allLoadsSearchPage', AllLoadsSearchPage);
  }
  
  /**
   * Gets PostAutomationRulePageEditEntryModal instance with on-demand creation
   * @author Parth Rastogi
   */
  get postAutomationRulePageEditEntryModal(): PostAutomationRulePageEditEntryModal {
    return this.createPage('postAutomationRulePageEditEntryModal', PostAutomationRulePageEditEntryModal);
  }

  /**
   * Gets BTMSAcceptTermPage instance with on-demand creation
   * @author Rohit Singh
   * @created 2026-01-19
   */
  get btmsAcceptTermPage(): BTMSAcceptTermPage {
    return this.createPage('btmsAcceptTermPage', BTMSAcceptTermPage);
  }

  /**
   * Gets CarrierPortalPage instance with on-demand creation
   * @author Rohit Singh
   * @created 08-Jan-2026
   */
  get carrierPortalPage(): CarrierPortalPage {
    return this.createPage('carrierPortalPage', CarrierPortalPage);
  }
  /**
 * Gets BillingAdjustmentsQueue instance with on-demand creation
 * @author Aniket Nale
 * @created 20-Jan-2026
 */

  get billingAdjustmentsQueue(): BillingAdjustmentsQueue {
    return this.createPage('billingAdjustmentsQueue', BillingAdjustmentsQueue);
  }
}