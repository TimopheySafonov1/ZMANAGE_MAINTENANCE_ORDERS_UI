sap.ui.define(["sap/m/MessageBox", "sap/base/Log"], function (MessageBox, Log) {
    "use strict";

    const PREPARE_ACTION = "com.sap.gateway.srvd.zui_ts_maintenance_order.v0001.Prepare";
    const ERROR_SEVERITY = 4;

    function isLeavingUpwards(context, target) {
        return !!target && context.getPath().startsWith(`${target.getPath()}/`);
    }

    async function readItemErrors(context) {
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
            return (data.SAP__Messages || []).filter(
                (message) =>
                    message.numericSeverity >= ERROR_SEVERITY &&
                    message.target?.startsWith(pagePath) &&
                    /_(Components|PRTs)\(/.test(message.target)
            );
        } finally {
            prepare.destroy();
            messages.destroy();
            root.destroy();
        }
    }

    return {
        blocksNavigation: async function (view, target) {
            const context = view.getBindingContext();
            if (!context || context.getProperty("IsActiveEntity") !== false || !isLeavingUpwards(context, target)) {
                return false;
            }

            try {
                const errors = await readItemErrors(context);
                if (errors.length) {
                    MessageBox.error(errors.map((error) => error.message).join("\n"));
                }
                return errors.length > 0;
            } catch (error) {
                Log.error("Draft validation on apply failed", error);
                return false;
            }
        }
    };
});
