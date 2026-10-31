sap.ui.define(
    ["sap/ui/core/mvc/ControllerExtension", "mmo/ext/handler/RevisionDatesHandler"],
    function (ControllerExtension, RevisionDatesHandler) {
        "use strict";

        return ControllerExtension.extend("mmo.ext.controller.ObjectPageExt", {
            override: {
                routing: {
                    onAfterBinding: function () {
                        const view = this.base.getView();
                        const model = view.getModel();
                        if (model && !this._revisionDates) {
                            this._revisionDates = new RevisionDatesHandler(
                                model,
                                view.getModel("i18n").getResourceBundle()
                            );
                        }
                    }
                },

                onExit: function () {
                    this._revisionDates?.destroy();
                }
            }
        });
    }
);
