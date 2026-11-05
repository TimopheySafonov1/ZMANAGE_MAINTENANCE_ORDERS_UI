sap.ui.define(
    ["sap/ui/core/mvc/ControllerExtension", "mmo/ext/handler/ApplyValidation", "mmo/ext/handler/StockValueHelp"],
    function (ControllerExtension, ApplyValidation, StockValueHelp) {
        "use strict";

        return ControllerExtension.extend("mmo.ext.controller.ItemPageExt", {
            override: {
                onInit: function () {
                    StockValueHelp.keepFresh(this.base.getView());
                },

                routing: {
                    onBeforeNavigation: function (navigation) {
                        return ApplyValidation.blocksNavigation(this.base.getView(), navigation.bindingContext);
                    }
                }
            }
        });
    }
);
