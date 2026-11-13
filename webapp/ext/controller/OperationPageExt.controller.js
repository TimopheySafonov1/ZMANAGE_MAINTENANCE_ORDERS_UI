sap.ui.define([
    "sap/ui/core/mvc/ControllerExtension",
    "mmo/ext/handler/ApplyValidation",
    "mmo/ext/handler/StockValueHelp"
], function (ControllerExtension, ApplyValidation, StockValueHelp) {
    "use strict";

    const READ_ONLY = 1;

    async function prefillActuals(context) {
        if (!context) {
            return;
        }
        const [
            isActive,
            control,
            actualWork,
            actualDuration,
            plannedWork,
            plannedWorkUnit,
            plannedDuration,
            plannedDurationUnit
        ] = await context.requestProperty([
            "IsActiveEntity",
            "__FieldControl/ActualStart",
            "ActualWork",
            "ActualWorkDuration",
            "PlannedWork",
            "PlannedWorkUnit",
            "PlannedWorkDuration",
            "PlannedDurationUnit"
        ]);
        if (isActive !== false || control <= READ_ONLY) {
            return;
        }

        const changes = [];
        if (!Number(actualWork) && Number(plannedWork)) {
            changes.push(["ActualWorkUnit", plannedWorkUnit], ["ActualWork", plannedWork]);
        }
        if (!Number(actualDuration) && Number(plannedDuration)) {
            changes.push(["ActualDurationUnit", plannedDurationUnit], ["ActualWorkDuration", plannedDuration]);
        }
        if (changes.length) {
            await Promise.all(changes.map(([property, value]) => context.setProperty(property, value)));
            await context.requestSideEffects([
                { $PropertyPath: "ActualStart" },
                { $PropertyPath: "ActualFinish" },
                { $NavigationPropertyPath: "_MaintenanceOrder" }
            ]);
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
                    prefillActuals(this.base.getView().getBindingContext());

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
