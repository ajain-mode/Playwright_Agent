
class BanyanHelper {
    /** 
     * Enable/Disable Auto Rate and Auto Dispatch on Master Customer
     * @author Rohit Singh
     * @created 04/Nov/2025
     * @param page The Playwright page object.
     * @param enable true to enable, false to disable Auto Rate and Auto Dispatch.
     */    
    async enableDisableAutoRate_Dispatch(pages: any, enable: boolean) {
            await pages.viewMasterCustomerPage.clickEditButton();
            const autoRateStatus =  await pages.editMasterCustomerPage.checkAutoRateStatus();
            const autoDispatchStatus =  await pages.editMasterCustomerPage.checkAutoDispatchStatus();
            console.log(`Current Auto Rate Status: ${autoRateStatus}, Auto Dispatch Status: ${autoDispatchStatus}`);
            if(enable) {
                await pages.editMasterCustomerPage.setAutoRateStatus(true);
                await pages.editMasterCustomerPage.setAutoDispatchStatus(true);
            }else {
                await pages.editMasterCustomerPage.setAutoRateStatus(false);
            }
            await pages.editMasterCustomerPage.clickSaveButton();
            await pages.page.reload();
            console.log('Auto Rate and Auto Dispatch settings updated successfully.');
            await pages.viewMasterCustomerPage.clickHomeButton();
        }


}
const banyanHelper = new BanyanHelper();
export default banyanHelper;
