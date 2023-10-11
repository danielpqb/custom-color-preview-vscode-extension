import { Picker } from "./helper";
import { CONFIG_GLOB } from "./lib/constants";
import { ExtensionContext, workspace as Workspace, Uri } from "vscode";

// This method is called when your extension is activated
export async function activate(context: ExtensionContext) {
  setTimeout(async () => {
    const path = await Workspace.findFiles(
      CONFIG_GLOB,
      "**/{node_modules, out, dist}/**",
      1
    ).then((doc) => {
      if (!doc[0]?.path) {
        return;
      }
      return doc[0].path;
    });

    if (!path) {
      console.error("Config file not found!");
      return;
    }

    const uri = Uri.parse(path);

    const customColors = await Workspace.openTextDocument(uri).then((obj) => {
      return JSON.parse(obj.getText());
    });

    const picker = new Picker(customColors);
    context.subscriptions.push(picker);

    console.log(
      'Congratulations, your extension "global-style-colors-vscode-extension" is now active!'
    );
  }, 2000);
}

// This method is called when your extension is deactivated
export function deactivate() {}
