import { PageManager } from "@utils/PageManager";

class DatHelpers {

    /**
       * @author Mukul Khan
       * @description Common setup function for DAT tests - handles office configuration
       * @created 05-Jan-2026
       **/
    async setupOfficePreConditionsDAT(
        pages: PageManager,
        officeName: string
    ) {
        await pages.basePage.hoverOverHeaderByText(HEADERS.ADMIN);
        await pages.basePage.clickSubHeaderByText(ADMIN_SUB_MENU.OFFICE_SEARCH);
        await pages.officePage.configureOfficePreConditionsDAT(officeName);
        console.log("Office Pre-condition set successfully");
    }

}
const datHelpers = new DatHelpers();
export default datHelpers;