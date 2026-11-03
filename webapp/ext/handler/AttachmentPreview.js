sap.ui.define(
    ["sap/m/Dialog", "sap/m/Button", "sap/m/Image", "sap/m/Text", "sap/m/PDFViewer", "sap/ui/core/HTML", "sap/ui/core/Component"],
    function (Dialog, Button, Image, Text, PDFViewer, HTML, Component) {
        "use strict";

        const icons = {
            video: "sap-icon://video",
            audio: "sap-icon://sound-loud",
            pdf: "sap-icon://pdf-attachment",
            other: "sap-icon://document"
        };

        const extensions = {
            image: ["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg"],
            video: ["mp4", "m4v", "webm", "mov"],
            audio: ["mp3", "wav", "ogg", "m4a"],
            pdf: ["pdf"]
        };

        function kindOf(mimeType, fileName) {
            const type = (mimeType || "").toLowerCase();
            if (type === "application/pdf") {
                return "pdf";
            }
            const kind = type.split("/")[0];
            if (type.includes("/") && ["image", "video", "audio"].includes(kind)) {
                return kind;
            }
            const extension = (fileName || "").split(".").pop().toLowerCase();
            return Object.keys(extensions).find((key) => extensions[key].includes(extension)) || "other";
        }

        function appModel() {
            return Component.registry.filter((component) => component.getManifestEntry("/sap.app/id") === "mmo")[0]?.getModel();
        }

        function streamUrl(model, attachmentUuid, isActiveEntity) {
            return `${model.getServiceUrl()}MaintenanceAttachment(AttachmentUuid=${attachmentUuid},IsActiveEntity=${isActiveEntity})/Attachment`;
        }

        function mediaContent(kind, url, bundle) {
            if (kind === "image") {
                return new Image({ src: url, width: "100%", densityAware: false });
            }
            if (kind === "video" || kind === "audio") {
                const style = "display:block;margin:auto;max-width:100%;max-height:70vh";
                return new HTML({ content: `<${kind} src="${encodeURI(url)}" controls style="${style}"></${kind}>` });
            }
            return new Text({ text: bundle.getText("attachmentNoPreview") }).addStyleClass("sapUiSmallMargin");
        }

        return {
            thumbnail: function (mimeType, attachmentUuid, isActiveEntity, fileName) {
                const kind = kindOf(mimeType, fileName);
                const model = appModel();
                if (kind !== "image" || !model || !attachmentUuid) {
                    return icons[kind];
                }
                return streamUrl(model, attachmentUuid, isActiveEntity);
            },

            open: function (event) {
                const source = event.getSource();
                const context = source.getBindingContext();
                const bundle = source.getModel("i18n").getResourceBundle();
                const fileName = context.getProperty("FileName");
                const kind = kindOf(context.getProperty("MimeType"), fileName);
                const url = streamUrl(
                    context.getModel(),
                    context.getProperty("AttachmentUuid"),
                    context.getProperty("IsActiveEntity")
                );

                if (kind === "pdf") {
                    const viewer = new PDFViewer({ source: url, title: fileName, isTrustedSource: true });
                    source.addDependent(viewer);
                    viewer.open();
                    return;
                }

                const dialog = new Dialog({
                    title: fileName,
                    contentWidth: kind === "other" ? "30rem" : "60rem",
                    resizable: true,
                    draggable: true,
                    content: [mediaContent(kind, url, bundle)],
                    beginButton: new Button({
                        text: bundle.getText("attachmentOpenInNewTab"),
                        press: () => window.open(url, "_blank", "noopener")
                    }),
                    endButton: new Button({
                        text: bundle.getText("attachmentClose"),
                        press: () => dialog.close()
                    }),
                    afterClose: () => dialog.destroy()
                });
                source.addDependent(dialog);
                dialog.open();
            }
        };
    }
);
