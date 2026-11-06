sap.ui.define([
    "sap/ui/core/mvc/ControllerExtension",
    "mmo/ext/handler/ApplyValidation",
    "mmo/ext/handler/StockValueHelp"
], function (ControllerExtension, ApplyValidation, StockValueHelp) {
    "use strict";

    const READ_ONLY = 1;

    async function prefillActualStart(context) {
        if (!context) {
            return;
        }
        const [isActive, start, plannedStart, control] = await context.requestProperty([
            "IsActiveEntity",
            "ActualStart",
            "PlannedStart",
            "__FieldControl/ActualStart"
        ]);
        if (isActive === false && !start && plannedStart && control > READ_ONLY) {
            context.setProperty("ActualStart", plannedStart);
        }
    }

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
                    prefillActualStart(this.base.getView().getBindingContext());

                    if (this._subSectionsObserved) {
                        return;
                    }
                    this._subSectionsObserved = true;
                    StockValueHelp.keepFresh(this.base.getView());
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
