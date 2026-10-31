sap.ui.define(["sap/ui/core/mvc/ControllerExtension", "sap/ui/core/Fragment"], function (ControllerExtension, Fragment) {
    "use strict";

    return ControllerExtension.extend("mmo.ext.controller.ObjectPageExt", {
        override: {
            onInit: function () {
                const view = this.base.getView();
                const title = view.byId("fe::ObjectPageDynamicHeaderTitle");
                view.byId("fe::ObjectPage").setShowHeaderContent(false);
                title.addStyleClass("mmoTitleContentEnd");
                Fragment.load({
                    id: view.getId(),
                    name: "mmo.ext.fragment.TitleContent",
                    controller: this
                }).then((content) => title.addContent(content));
            }
        }
    });
});
