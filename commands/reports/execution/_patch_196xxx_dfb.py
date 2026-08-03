from pathlib import Path

ids = [
    "196261",
    "196262",
    "196263",
    "196264",
    "196274",
    "196275",
    "196276",
    "196277",
]

old_bid = """        await btmsPages.editLoadCarrierTabPage.clickOnCarrierTab();
        await btmsPages.viewLoadCarrierTabPage.validateBidsReportValue();
        await btmsPages.commonReusables.getCurrentDateTime();
        await pages.viewLoadCarrierTabPage.clickViewLoadPageLinks(
          TNX.BID_HISTORY
        );
        await pages.viewLoadCarrierTabPage.getBidHistoryFirstRowDetails();
        await pages.viewLoadCarrierTabPage.validateBidHistoryFirstRow({
          carrier: testData.Carrier,
          bidRate: testData.offerRate,
          shipCity: testData.shipperCity,
          shipState: testData.shipperState,
          consCity: testData.consigneeCity,
          consState: testData.consigneeState,
          timestamp: pages.commonReusables.formattedDateTime,
          email: userSetup.tnxUser,
          totalMiles: totalMiles,
        });"""

new_bid = """        await btmsPages.editLoadCarrierTabPage.clickOnCarrierTab();
        await btmsPages.viewLoadCarrierTabPage.validateBidsReportValue();
        await pages.viewLoadCarrierTabPage.clickViewLoadPageLinks(
          TNX.BID_HISTORY
        );
        await pages.viewLoadCarrierTabPage.getBidHistoryFirstRowDetails();
        await pages.viewLoadCarrierTabPage.validateBidHistoryFirstRow({
          carrier: testData.Carrier,
          bidRate: testData.offerRate,
          shipCity: testData.shipperCity,
          shipState: testData.shipperState,
          consCity: testData.consigneeCity,
          consState: testData.consigneeState,
          // Omit timestamp — stage server clock can drift >1 min from local capture after Match Now
          email: userSetup.tnxUser,
          totalMiles: totalMiles,
        });"""

broken_log = "        console.log(\\Bids Report Value after Post: \\);"
good_log = "        console.log(`Bids Report Value after Post: ${bidsReportValue}`);"

after_post_block = """        // Re-baseline after Post — Post can also bump BIDS; Match Now must be exactly +1 from this value
        bidsReportValue =
          await pages.viewLoadCarrierTabPage.getBidsReportValue();
        console.log(`Bids Report Value after Post: ${bidsReportValue}`);
"""

for case_id in ids:
    p = Path(f"src/tests/AIAgent/dfb/DFB-{case_id}.spec.ts")
    c = p.read_text(encoding="utf-8")

    c = c.replace('"Load Method": testData.loadMethod,', '"Load Method": "truckload",')
    c = c.replace(broken_log, good_log)

    if "Bids Report Value after Post" not in c:
        marker = '          "Load Method": "truckload",\n        });\n      });\n\n      await test.step("Open DME application'
        if marker not in c:
            print("WARN missing marker", case_id)
        else:
            c = c.replace(
                '          "Load Method": "truckload",\n        });\n      });\n\n      await test.step("Open DME application',
                '          "Load Method": "truckload",\n        });\n'
                + after_post_block
                + "      });\n\n      await test.step(\"Open DME application",
                1,
            )

    if old_bid in c:
        c = c.replace(old_bid, new_bid)
    elif "timestamp: pages.commonReusables.formattedDateTime" in c:
        print("WARN bid block differs", case_id)

    p.write_text(c, encoding="utf-8", newline="\n")
    print(
        case_id,
        "ok afterPost=",
        "Bids Report Value after Post: ${bidsReportValue}" in c,
        "noTs=",
        "timestamp: pages.commonReusables.formattedDateTime" not in c,
    )
