/**
 * ソースからコメントだけを取り除く(架空明示ゲートの前処理)。
 *
 * ゲートが見たいのは「読者に届く文字列」であって、方針を書いたコメントではない。
 * コメントはバンドル時に落ちるので、走査対象から外すのが正しい。
 *
 * 素朴に `//` を落とすと `https://` の後ろが消える。文字列リテラルの中に居るかどうかを
 * 追いながら削る必要があるため、最小の状態機械にしてある。
 * 除去した箇所は改行を温存するので、行番号がずれない。
 */
export function stripComments(source: string): string {
  let out = "";
  let i = 0;
  type State = "code" | "line" | "block" | "single" | "double" | "template";
  let state: State = "code";

  while (i < source.length) {
    const c = source[i];
    const next = source[i + 1];

    switch (state) {
      case "code":
        if (c === "/" && next === "/") {
          state = "line";
          i += 2;
        } else if (c === "/" && next === "*") {
          state = "block";
          i += 2;
        } else if (c === "'") {
          state = "single";
          out += c;
          i++;
        } else if (c === '"') {
          state = "double";
          out += c;
          i++;
        } else if (c === "`") {
          state = "template";
          out += c;
          i++;
        } else {
          out += c;
          i++;
        }
        break;

      case "line":
        if (c === "\n") {
          state = "code";
          out += c;
        }
        i++;
        break;

      case "block":
        if (c === "*" && next === "/") {
          state = "code";
          i += 2;
        } else {
          // 行番号を保つため改行だけ残す
          if (c === "\n") out += c;
          i++;
        }
        break;

      case "single":
      case "double":
      case "template": {
        const quote =
          state === "single" ? "'" : state === "double" ? '"' : "`";
        if (c === "\\") {
          out += c + (next ?? "");
          i += 2;
        } else {
          out += c;
          if (c === quote) state = "code";
          i++;
        }
        break;
      }
    }
  }

  return out;
}
