sap.ui.define(
    ["sap/ui/core/mvc/ControllerExtension", "mmo/ext/handler/ApplyValidation"],
    function (ControllerExtension, ApplyValidation) {
        "use strict";

        return ControllerExtension.extend("mmo.ext.controller.ItemPageExt", {
            override: {
                routing: {
                    onBeforeNavigation: function (navigation) {
                        return ApplyValidation.blocksNavigation(this.base.getView(), navigation.bindingContext);
                    }
                }
            }
        });
    }
);
