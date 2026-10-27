sap.ui.define([
    "sap/fe/test/JourneyRunner",
	"mmo/test/integration/pages/MaintenanceOrderList.gen",
	"mmo/test/integration/pages/MaintenanceOrderObjectPage.gen"
], function (JourneyRunner, MaintenanceOrderListGenerated, MaintenanceOrderObjectPageGenerated) {
    'use strict';

    const runner = new JourneyRunner({
        launchUrl: sap.ui.require.toUrl('mmo') + '/test/flp.html#app-preview',
        pages: {
			onTheMaintenanceOrderListGenerated: MaintenanceOrderListGenerated,
			onTheMaintenanceOrderObjectPageGenerated: MaintenanceOrderObjectPageGenerated
        },
        async: true
    });

    return runner;
});

