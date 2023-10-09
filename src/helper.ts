import * as vscode from "vscode";
import Color from "./color";
import * as parse from "parse-css-color";

export interface Match {
  color: vscode.Color;
  length: number;
  range: vscode.Range;
}

export function parseColorString(color: string) {
  try {
    const p = (parse as any)(color);
    if (!p) {
      throw new Error("invalid color string");
    }
    if (p.type === "rgb") {
      const r = p.values[0] as number;
      const g = p.values[1] as number;
      const b = p.values[2] as number;
      const a = p.alpha as number;

      return new vscode.Color(r / 255, g / 255, b / 255, a);
    } else {
      const h = p.values[0] as number;
      const s = p.values[1] as number;
      const l = p.values[2] as number;
      const a = p.alpha as number;
      const { r, g, b } = Color.fromHsl(h, s, l).toRgb();

      return new vscode.Color(r / 255, g / 255, b / 255, a);
    }
  } catch (e) {
    return null;
  }
}

export function getPos(text: string, index: number): vscode.Position {
  const nMatches: any = Array.from(text.slice(0, index).matchAll(/\n/g));

  const lineNumber = nMatches.length;

  const characterIndex = index - nMatches[lineNumber - 1].index;

  return new vscode.Position(lineNumber, characterIndex - 1);
}

export class Matcher {
  static getMatches(text: string, customColors: object): Match[] {
    let colorKeys = [];
    for (const key in customColors) {
      colorKeys.push(`(${key})`);
    }
    const regex = new RegExp(colorKeys.join("|"), "gi");

    const matches = text.matchAll(regex);

    return Array.from(matches).map((match) => {
      const t = match[0]; //key name
      const length = t.length;

      const range = new vscode.Range(
        getPos(text, (match as any).index),
        getPos(text, (match as any).index + t.length)
      );

      const col = parseColorString((customColors as any)[t]);

      if (col) {
        return {
          color: col,
          length,
          range,
        } as Match;
      }
    }) as any;
  }
}

export class Picker {
  customColors;
  constructor(customColors: object) {
    this.customColors = customColors;
    let subscriptions: vscode.Disposable[] = [];
    vscode.workspace.onDidChangeTextDocument(
      this._onDidChangeTextDocument,
      this,
      subscriptions
    );
    vscode.workspace.onDidChangeConfiguration(
      this._onDidChangeConfiguration,
      this,
      subscriptions
    );
    this.register(this.customColors);
  }

  private get languages() {
    return vscode.workspace
      .getConfiguration("ccpreview-vscode")
      .get("languages") as Array<string>;
  }

  private _onDidChangeTextDocument(e: vscode.TextDocumentChangeEvent) {
    const editor = vscode.window.activeTextEditor;
    const document = e.document;
    const text = document.getText();
  }

  private _onDidChangeConfiguration() {}

  private register(customColors: object) {
    // this.languages.forEach((language) => {
    vscode.languages.registerColorProvider(
      [
        { pattern: "**", scheme: "file" },
        { pattern: "**", scheme: "untitled" },
      ],
      {
        provideDocumentColors(
          document: vscode.TextDocument,
          token: vscode.CancellationToken
        ) {
          const matches = Matcher.getMatches(document.getText(), customColors);

          return matches.map(
            (match, i) => new vscode.ColorInformation(match.range, match.color)
          );
        },
        provideColorPresentations(color, context, token) {
          let c = Color.fromRgb(
            color.red * 255,
            color.green * 255,
            color.blue * 255
          );
          c.alpha = color.alpha;
          let hex = c.toString("hex");
          let hsl = c.toString("hsl");
          let colString = context.document.getText(context.range);
          let t = colString;

          const presentationHex = new vscode.ColorPresentation(
            c.toString("hex")
          );
          const presentationHexa = new vscode.ColorPresentation(
            c.toString("hexa")
          );
          const presentationHsl = new vscode.ColorPresentation(
            c.toString("hsl")
          );
          const presentationHsla = new vscode.ColorPresentation(
            c.toString("hsla")
          );
          const presentationRgb = new vscode.ColorPresentation(
            c.toString("rgb")
          );
          const presentationRgba = new vscode.ColorPresentation(
            c.toString("rgba")
          );

          let hasAlpha = false;
          if (t.startsWith("#") && t.length === 9) {
            hasAlpha = true;
          }
          if (t.startsWith("hsla")) {
            hasAlpha = true;
          }
          if (t.startsWith("rgba")) {
            hasAlpha = true;
          }
          if (color.alpha !== 1) {
            hasAlpha = true;
          }

          let withAlpha = [
            presentationHexa,
            presentationHsla,
            presentationRgba,
          ];

          let withoutAlpha = [
            presentationHex,
            presentationHsl,
            presentationRgb,
          ];

          return hasAlpha ? withAlpha : withoutAlpha;
        },
      }
    );
    // });
  }

  dispose() {}
}
