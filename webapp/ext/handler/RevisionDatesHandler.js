sap.ui.define(
    [
        "sap/ui/base/Object",
        "sap/m/MessageBox",
        "sap/ui/core/format/DateFormat",
        "sap/ui/model/Filter",
        "sap/ui/model/FilterOperator"
    ],
    function (BaseObject, MessageBox, DateFormat, Filter, FilterOperator) {
        "use strict";

        const dateFormat = DateFormat.getDateInstance({ style: "medium" });

        return BaseObject.extend("mmo.ext.handler.RevisionDatesHandler", {
            constructor: function (model, resourceBundle) {
                BaseObject.call(this);
                this._model = model;
                this._bundle = resourceBundle;
                model.attachPropertyChange(this.onPropertyChange, this);
            },

            destroy: function () {
                this._model.detachPropertyChange(this.onPropertyChange, this);
                BaseObject.prototype.destroy.apply(this, arguments);
            },

            onPropertyChange: function (event) {
                const { path, context, value, promise } = event.getParameters();
                if (
                    path !== "MaintRevision" ||
                    !value ||
                    !context?.getPath().startsWith("/MaintenanceOrder(") ||
                    context.getProperty("IsActiveEntity") !== false
                ) {
                    return;
                }
                Promise.resolve(promise)
                    .then(() => this.readRevision(context, value))
                    .then((revision) => revision && this.askToCopyDates(context, revision))
                    .catch(() => {});
            },

            readRevision: function (context, revision) {
                const filters = [new Filter("MaintenanceRevision", FilterOperator.EQ, revision)];
                const plant = context.getProperty("PlanningPlant");
                if (plant) {
                    filters.push(new Filter("Plant", FilterOperator.EQ, plant));
                }
                return this._model
                    .bindList("/MaintenanceRevisionVH", null, null, filters, {
                        $select: "MaintenanceRevision,MaintenanceRevisionText,RevisionStartDateTime,RevisionEndDateTime"
                    })
                    .requestContexts(0, 1)
                    .then((contexts) => contexts[0]?.getObject())
                    .then((data) => (data?.RevisionStartDateTime || data?.RevisionEndDateTime ? data : undefined));
            },

            askToCopyDates: function (context, revision) {
                const format = (value) => (value ? dateFormat.format(new Date(value)) : "–");
                MessageBox.confirm(
                    this._bundle.getText("copyRevisionDatesQuestion", [
                        revision.MaintenanceRevisionText || revision.MaintenanceRevision,
                        format(revision.RevisionStartDateTime),
                        format(revision.RevisionEndDateTime)
                    ]),
                    {
                        title: this._bundle.getText("copyRevisionDatesTitle"),
                        actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                        emphasizedAction: MessageBox.Action.YES,
                        onClose: (action) => {
                            if (action === MessageBox.Action.YES) {
                                this.copyDates(context, revision);
                            }
                        }
                    }
                );
            },

            copyDates: function (context, revision) {
                Promise.all([
                    context.setProperty("MaintOrdBasicStartDateTime", revision.RevisionStartDateTime),
                    context.setProperty("MaintOrdBasicFinishDateTime", revision.RevisionEndDateTime)
                ])
                    .then(() => context.requestSideEffects([{ $PropertyPath: "MaintOrdFinalDueDateTime" }]))
                    .catch(() => {});
            }
        });
    }
);
