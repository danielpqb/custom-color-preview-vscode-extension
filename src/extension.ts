import { Picker } from "./helper";
import { CONFIG_GLOB } from "./lib/constants";
import { ExtensionContext, workspace as Workspace, Uri } from "vscode";

// This method is called when your extension is activated
export async function activate(context: ExtensionContext) {
  const path = await Workspace.findFiles(
    CONFIG_GLOB,
    "**/{node_modules, out, dist}/**",
    1
  ).then((doc) => {
    return doc[0].path;
  });

  const uri = Uri.parse(path);

  const customColors = await Workspace.openTextDocument(uri).then((obj) => {
    return JSON.parse(obj.getText());
  });

  const picker = new Picker(customColors);
  context.subscriptions.push(picker);

  console.log(
    'Congratulations, your extension "custom-color-preview-vscode-extension" is now active!'
  );
}

// This method is called when your extension is deactivated
export function deactivate() {}
