sap.ui.define(["sap/ui/core/mvc/ControllerExtension", "mmo/ext/handler/ApplyValidation"], function (ControllerExtension, ApplyValidation) {
    "use strict";

    function hideEmptyRows(innerTable) {
        const rowMode = innerTable.getRowMode?.();
        if (rowMode?.setHideEmptyRows && !rowMode.getHideEmptyRows()) {
            rowMode.setHideEmptyRows(true);
        }
    }

    function hideEmptyRowsIn(control) {
        control
            .findAggregatedObjects(true, (child) => child.isA("sap.ui.table.Table"))
            .forEach((innerTable) => {
                if (!innerTable.data("mmoHideEmptyRows")) {
                    innerTable.data("mmoHideEmptyRows", true);
                    innerTable.addStyleClass("mmoNoEmptyRows");
                    innerTable.attachRowsUpdated(() => hideEmptyRows(innerTable));
                }
                hideEmptyRows(innerTable);
            });
    }

    return ControllerExtension.extend("mmo.ext.controller.OperationPageExt", {
        override: {
            routing: {
                onBeforeNavigation: function (navigation) {
                    return ApplyValidation.blocksNavigation(this.base.getView(), navigation.bindingContext);
                },

                onAfterBinding: function () {
                    if (this._subSectionsObserved) {
                        return;
                    }
                    this._subSectionsObserved = true;
                    this.base
                        .getView()
                        .findAggregatedObjects(true, (control) => control.isA("sap.uxap.ObjectPageSubSection"))
                        .forEach((subSection) => {
                            subSection.addEventDelegate({ onAfterRendering: () => hideEmptyRowsIn(subSection) });
                            hideEmptyRowsIn(subSection);
                        });
                }
            }
        }
    });
});
