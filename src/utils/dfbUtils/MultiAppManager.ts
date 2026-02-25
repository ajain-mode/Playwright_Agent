import { PageManager } from "@utils/PageManager";
import userSetup from "@loginHelpers/userSetup";

/**
 * Multi-Application Manager for handling multiple browser contexts and page switching
 * @author Deepak Bohra
 * @created 2025-09-07
 * @description Manages BTMS, DME, and TNX applications with seamless switching capabilities
 */
export class MultiAppManager {
  public btmsPage: any;
  public dmePage: any;
  public tnxPage: any;
  public tnxRepPage: any;
  public btmsPageManager: PageManager;
  public dmePageManager: PageManager | undefined;
  public tnxPageManager: PageManager | undefined;
  public tnxRepPageManager: PageManager | undefined;
  private context: any;

  constructor(context: any, initialPage: any) {
    this.context = context;
    this.btmsPage = initialPage;
    this.btmsPageManager = new PageManager(initialPage);
  }

  /**
   * Initializes DME application in a new tab
   * @returns Promise<PageManager> - DME PageManager instance
   */
  async initializeDME(): Promise<PageManager> {
    if (!this.dmePage || this.dmePage.isClosed()) {
      console.log("Initializing DME application...");
      this.dmePage = await this.context.newPage();
      this.dmePageManager = new PageManager(this.dmePage);
      await this.dmePageManager.dmeLoginPage.DMELogin(userSetup.dmeUser);
      console.log("✅ DME application initialized");
    }
    return this.dmePageManager!;
  }

  /**
   * @author Deepak Bohra
   * Initializes TNX application in a new tab
   * @returns Promise<PageManager> - TNX PageManager instance
   */
  async initializeTNX(): Promise<PageManager> {
    if (!this.tnxPage) {
      console.log("Initializing TNX application...");
      this.tnxPage = await this.context.newPage();
      this.tnxPageManager = new PageManager(this.tnxPage);
      await this.tnxPageManager.tnxLoginPage.TNXLogin(userSetup.tnxUser);
      console.log("✅ TNX application initialized");
    }
    return this.tnxPageManager!;
  }

   /**
 * Initializes TNX Rep application in a new tab
 * @returns Promise<PageManager> - TNX Rep PageManager instance
 * @author Parth Rastogi
 * @created 2025-11-10
 * @description Manages TNX Rep application initialization
 */
  async initializeTNXRep(): Promise<PageManager> {
    if (!this.tnxRepPage) {
      console.log("Initializing TNX Rep application...");
      this.tnxRepPage = await this.context.newPage();
      this.tnxRepPageManager = new PageManager(this.tnxRepPage);
      await this.tnxRepPageManager.tnxRepLoginPage.TNXRepLogin(userSetup.tnxRepUser);
      console.log("✅ TNX Rep application initialized");
    }
    return this.tnxRepPageManager!;
  }

  /**
   * Switches to BTMS application tab
   * @returns Promise<PageManager> - BTMS PageManager instance
   */
  async switchToBTMS(): Promise<PageManager> {
    console.log("Switching to BTMS application");
    await this.btmsPage.bringToFront();
    return this.btmsPageManager;
  }

  /**
   * Switches to DME application tab (initializes if needed)
   * @returns Promise<PageManager> - DME PageManager instance
   */
  async switchToDME(): Promise<PageManager> {
    console.log("Switching to DME application");
    if (!this.dmePage || this.dmePage.isClosed()) {
      await this.initializeDME();
    }
    await this.dmePage.bringToFront();
    
    // Wait for page to be ready without hardcoded timeout
    await this.dmePage.waitForLoadState("domcontentloaded");
    await this.dmePage.waitForLoadState("networkidle");
    
    return this.dmePageManager!;
  }

  /**
   * Switches to TNX application tab (initializes if needed)
   * @returns Promise<PageManager> - TNX PageManager instance
   */
  async switchToTNX(): Promise<PageManager> {
    console.log("Switching to TNX application");
    if (!this.tnxPage || this.tnxPage.isClosed()) {
      await this.initializeTNX();
    }
    await this.tnxPage.bringToFront();
    
    // Wait for page to be ready
    await this.tnxPage.waitForLoadState("domcontentloaded");
    
    return this.tnxPageManager!;
  }

 

  /**
   * Closes all secondary application pages (keeps BTMS open)
   */
  async closeAllSecondaryPages(): Promise<void> {
    if (this.dmePage && !this.dmePage.isClosed()) {
      await this.dmePage.close();
      console.log("DME page closed");
    }
    if (this.tnxPage && !this.tnxPage.isClosed()) {
      await this.tnxPage.close();
      console.log("TNX page closed");
    }
  }

  /**
   * Gets the current active application name
   * @returns string - Name of the currently active application
   */
  getCurrentApp(): string {
    // This is a simplified version - in real implementation, 
    // you might want to track which page is currently active
    return "BTMS"; // Default to BTMS as main app
  }

  /**
   * Checks if all applications are properly initialized
   * @returns boolean - True if all apps are ready
   */
  areAllAppsReady(): boolean {
    return (
      this.btmsPageManager !== undefined &&
      (this.dmePage === undefined || !this.dmePage.isClosed()) &&
      (this.tnxPage === undefined || !this.tnxPage.isClosed())
    );
  }


   /**
   * @author Parth Rastogi
   * Switches to TNX application tab (initializes if needed)
   * @returns Promise<PageManager> - TNX PageManager instance
   */
  async switchToTNXRep(): Promise<PageManager> {
    console.log("Switching to TNX Rep application");
    if (!this.tnxRepPage || this.tnxRepPage.isClosed()) {
      await this.initializeTNXRep();
    }
    await this.tnxRepPage.bringToFront();
   
    // Wait for page to be ready
    await this.tnxRepPage.waitForLoadState("domcontentloaded");
 
    return this.tnxRepPageManager!;
  }
}