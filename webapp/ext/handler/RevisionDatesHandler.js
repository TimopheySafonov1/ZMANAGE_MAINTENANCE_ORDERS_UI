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
        const dateTimeFormat = DateFormat.getDateTimeInstance({ style: "medium" });

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

            confirmFinishDate: function (context) {
                if (!context || context.getProperty("IsActiveEntity") !== false) {
                    return Promise.resolve();
                }
                return context
                    .requestProperty(["MaintRevision", "MaintOrdBasicFinishDateTime"])
                    .then(([revision, finish]) => {
                        if (!revision || !finish) {
                            return undefined;
                        }
                        return this.latestOperationFinish(context).then((latest) => {
                            if (!latest || new Date(latest).getTime() === new Date(finish).getTime()) {
                                return undefined;
                            }
                            return this.askForFinishDate(context, finish, latest);
                        });
                    });
            },

            latestOperationFinish: function (context) {
                return this._model
                    .bindList("_Operations", context, null, null, { $select: "OperationUuid,PlannedFinish" })
                    .requestContexts(0, Infinity)
                    .then((operations) =>
                        operations
                            .map((operation) => operation.getProperty("PlannedFinish"))
                            .filter(Boolean)
                            .reduce((latest, finish) => (!latest || new Date(finish) > new Date(latest) ? finish : latest), undefined)
                    );
            },

            askForFinishDate: function (context, revisionFinish, operationsFinish) {
                const fromRevision = this._bundle.getText("finishFromRevision");
                const fromOperations = this._bundle.getText("finishFromOperations");
                return new Promise((resolve, reject) => {
                    MessageBox.show(
                        this._bundle.getText("chooseFinishDateQuestion", [
                            dateTimeFormat.format(new Date(revisionFinish)),
                            dateTimeFormat.format(new Date(operationsFinish))
                        ]),
                        {
                            icon: MessageBox.Icon.QUESTION,
                            title: this._bundle.getText("chooseFinishDateTitle"),
                            actions: [fromRevision, fromOperations, MessageBox.Action.CANCEL],
                            emphasizedAction: fromRevision,
                            onClose: (action) => {
                                if (action === fromRevision) {
                                    resolve();
                                } else if (action === fromOperations) {
                                    Promise.resolve(context.setProperty("MaintOrdBasicFinishDateTime", operationsFinish))
                                        .then(() => resolve(), reject);
                                } else {
                                    reject();
                                }
                            }
                        }
                    );
                });
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
