import { describe, expect, it } from "vitest";
import { LINE_VIEWBOX, lineLayout } from "./line";
import { PROCESSES } from "@/data/process";

/*
  SMT ライン図(F-04)。位置を式で決めるので、静的書き出しと再描画で同じ図になる(N-03)。
  ここで検査するのは「順序どおりに通っているか」であって「絵として綺麗か」ではない。
  見た目は harness/shot.mjs で撮って目視する(loop_001 の VERIF-GAP)。
*/

describe("ライン図のレイアウト(T-060〜T-064 / F-04・N-03)", () => {
  it("T-060 2 回呼んで完全に同じ結果になる", () => {
    expect(JSON.stringify(lineLayout())).toBe(JSON.stringify(lineLayout()));
  });

  it("T-061 駅の集合が PROCESSES と一致する", () => {
    const { stations } = lineLayout();
    expect(stations.map((s) => s.id)).toEqual(PROCESSES.map((p) => p.id));
  });

  it("T-062 駅の矩形が互いに重ならない", () => {
    const { stations } = lineLayout();
    for (let i = 0; i < stations.length; i++) {
      for (let j = i + 1; j < stations.length; j++) {
        const a = stations[i];
        const b = stations[j];
        const overlap =
          a.x < b.x + b.w &&
          b.x < a.x + a.w &&
          a.y < b.y + b.h &&
          b.y < a.y + a.h;
        expect(overlap, `${a.id} と ${b.id} が重なっている`).toBe(false);
      }
    }
  });

  it("T-063 駅の矩形が viewBox の内側に収まる", () => {
    for (const s of lineLayout().stations) {
      expect(s.x, s.id).toBeGreaterThanOrEqual(0);
      expect(s.y, s.id).toBeGreaterThanOrEqual(0);
      expect(s.x + s.w, s.id).toBeLessThanOrEqual(LINE_VIEWBOX.w);
      expect(s.y + s.h, s.id).toBeLessThanOrEqual(LINE_VIEWBOX.h);
    }
  });

  it("T-064 搬送路が工程順に各駅の中心を通る", () => {
    const { stations, conveyor } = lineLayout();
    let cursor = 0;
    for (const s of stations) {
      const hit = conveyor.findIndex(
        (p, i) => i >= cursor && p.x === s.cx && p.y === s.cy,
      );
      expect(hit, `${s.id} の中心が搬送路に順番どおり現れない`).toBeGreaterThanOrEqual(
        cursor,
      );
      cursor = hit + 1;
    }
  });

  it("搬送路の d に NaN が混ざらない", () => {
    expect(lineLayout().d).not.toContain("NaN");
  });
});

describe("投入口と出口(T-065 / F-04)", () => {
  /*
    ラベルを viewBox の左下・右下に決め打ちしていたら、蛇行で下段が右から左へ
    流れるため出口が左下になり、図とラベルが矛盾した(loop_002 の GEN-LOGIC)。
    ラベルの位置は搬送路そのものから取る、という約束をここで固定する。
  */
  it("T-065 投入口と出口が搬送路の両端に一致する", () => {
    const { conveyor, entry, exit } = lineLayout();
    expect(entry).toEqual(conveyor[0]);
    expect(exit).toEqual(conveyor[conveyor.length - 1]);
  });

  it("T-065 投入口は最初の工程の高さ、出口は最後の工程の高さにある", () => {
    const { stations, entry, exit } = lineLayout();
    expect(entry.y).toBe(stations[0].cy);
    expect(exit.y).toBe(stations[stations.length - 1].cy);
  });

  it("T-065 出口は行数の偶奇に従って左右が決まる", () => {
    const { stations, exit } = lineLayout();
    const lastRow = stations[stations.length - 1].row;
    // 偶数行は左から右へ流すので右端に出る。奇数行はその逆。
    expect(exit.x).toBe(lastRow % 2 === 0 ? LINE_VIEWBOX.w : 0);
  });
});
