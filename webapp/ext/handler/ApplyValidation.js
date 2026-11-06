sap.ui.define(["sap/m/MessageBox", "sap/base/Log"], function (MessageBox, Log) {
    "use strict";

    const PREPARE_ACTION = "com.sap.gateway.srvd.zui_ts_maintenance_order.v0001.Prepare";
    const WARNING_SEVERITY = 3;
    const ERROR_SEVERITY = 4;

    function isLeavingUpwards(context, target) {
        return !!target && context.getPath().startsWith(`${target.getPath()}/`);
    }

    async function readPageMessages(context) {
        const model = context.getModel();
        const path = context.getPath();
        const rootPath = path.substring(0, path.indexOf("/", 1));
        const pagePath = path.substring(rootPath.length + 1);

        const root = model.bindContext(rootPath);
        const prepare = model.bindContext(`${PREPARE_ACTION}(...)`, root.getBoundContext());
        const messages = model.bindContext(rootPath, undefined, { $select: "SAP__Messages" });
        try {
            await prepare.invoke("$auto", true);
            const data = await messages.getBoundContext().requestObject();
            const pageMessages = (data.SAP__Messages || []).filter((message) => message.target?.startsWith(pagePath));
            return {
                errors: pageMessages.filter(
                    (message) =>
                        message.numericSeverity >= ERROR_SEVERITY && /_(Components|PRTs)\(/.test(message.target)
                ),
                warnings: pageMessages.filter((message) => message.numericSeverity === WARNING_SEVERITY)
            };
        } finally {
            prepare.destroy();
            messages.destroy();
            root.destroy();
        }
    }

    function uniqueTexts(messages) {
        return [...new Set(messages.map((message) => message.message))].join("\n");
    }

    return {
        blocksNavigation: async function (view, target) {
            const context = view.getBindingContext();
            if (!context || context.getProperty("IsActiveEntity") !== false || !isLeavingUpwards(context, target)) {
                return false;
            }

            try {
                const { errors, warnings } = await readPageMessages(context);
                if (errors.length) {
                    MessageBox.error(uniqueTexts(errors));
                } else if (warnings.length) {
                    MessageBox.warning(uniqueTexts(warnings));
                }
                return errors.length > 0;
            } catch (error) {
                Log.error("Draft validation on apply failed", error);
                return false;
            }
        }
    };
});
