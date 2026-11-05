sap.ui.define([], function () {
    "use strict";

    const STOCK_PATH = /^\/(Prt)?StorageLocationVH/;

    function refreshStock(view) {
        const model = view.getModel();
        (model?.getAllBindings?.() || [])
            .filter((binding) => STOCK_PATH.test(binding.getPath?.() || ""))
            .forEach((binding) => {
                try {
                    binding.refresh();
                } catch {
                    return;
                }
            });
    }

    return {
        keepFresh: function (view) {
            view.addEventDelegate({
                ontap: () => refreshStock(view),
                onsapshow: () => refreshStock(view)
            });
        }
    };
});
