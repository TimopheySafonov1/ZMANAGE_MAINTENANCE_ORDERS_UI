sap.ui.define(["sap/ui/core/format/NumberFormat"], function (NumberFormat) {
    "use strict";

    const numberFormat = NumberFormat.getFloatInstance({ minFractionDigits: 0, maxFractionDigits: 2 });
    const amountFormat = NumberFormat.getFloatInstance({ minFractionDigits: 2, maxFractionDigits: 2 });
    const toNumber = (value) => Number(value) || 0;

    return {
        value: toNumber,

        number: (value) => numberFormat.format(toNumber(value)),

        amount: (value, currency) => `${amountFormat.format(toNumber(value))} ${currency || ""}`.trim(),

        delta: (planned, actual) => numberFormat.format(Math.abs(toNumber(actual) - toNumber(planned))),

        actualColor: (planned, actual) => (toNumber(actual) > toNumber(planned) ? "Error" : "Good")
    };
});
