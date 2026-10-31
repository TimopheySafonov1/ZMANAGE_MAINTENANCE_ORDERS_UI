sap.ui.define(["sap/ui/core/mvc/ControllerExtension"], function (ControllerExtension) {
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
