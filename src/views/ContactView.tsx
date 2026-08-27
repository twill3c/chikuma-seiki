import { COMPANY } from "@/data/company";
import { CONTACT_FIELDS, CONTACT_SUBJECTS } from "@/data/recruit";

/**
 * お問い合わせ(F-08)。**送信できない。**
 *
 * 架空の企業なので、送信できるフォームを置くわけにいかない。
 * かといってページごと無くすと、コーポレートサイトとして形が欠ける。
 * そこで、見た目は普通のフォームのまま、
 * `<form>` に `action` を持たせず、送信ボタンを `disabled` にしてある。
 *
 * 架空である旨の明示 4 箇所のうちの 1 箇所(F-13)で、
 * フォームより**先に**出す。
 */
export function ContactView() {
  return (
    <>
      <section className="border-b border-suji">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <p className="text-xs tracking-[0.3em] text-do">お問い合わせ</p>
          <h1 className="mt-4 max-w-3xl text-3xl leading-snug">
            このフォームは送信できません。
          </h1>
          <p className="mt-6 max-w-2xl text-sm leading-relaxed text-usu">
            {COMPANY.contactNotice}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-16">
        <p
          role="note"
          className="rounded border border-akane/40 bg-ban/60 px-5 py-4 text-sm leading-relaxed text-usu"
        >
          {COMPANY.fictionNotice}
        </p>

        {/*
          action を持たない。onSubmit も持たない(そもそもサーバ関数が無い)。
          送信先を型としても定数としても持たせていないので、
          うっかり繋いでしまうことができない(T-162)。
        */}
        <form className="mt-10 space-y-6" aria-describedby="contact-disabled">
          {CONTACT_FIELDS.map((f) => (
            <div key={f.id}>
              <label
                htmlFor={f.id}
                className="block text-xs tracking-[0.2em] text-do"
              >
                {f.label}
              </label>

              {f.kind === "textarea" ? (
                <textarea
                  id={f.id}
                  rows={5}
                  disabled
                  placeholder={f.placeholder}
                  className="mt-2 w-full rounded-sm border border-suji bg-tetsu px-3 py-2 text-sm text-hakuro placeholder:text-usu/45 disabled:cursor-not-allowed"
                />
              ) : f.kind === "select" ? (
                <select
                  id={f.id}
                  disabled
                  className="mt-2 w-full rounded-sm border border-suji bg-tetsu px-3 py-2 text-sm text-hakuro disabled:cursor-not-allowed"
                >
                  {CONTACT_SUBJECTS.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              ) : (
                <input
                  id={f.id}
                  type={f.kind}
                  disabled
                  placeholder={f.placeholder}
                  className="mt-2 w-full rounded-sm border border-suji bg-tetsu px-3 py-2 text-sm text-hakuro placeholder:text-usu/45 disabled:cursor-not-allowed"
                />
              )}
            </div>
          ))}

          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              disabled
              className="rounded-sm border border-suji px-6 py-2 text-sm text-usu/45"
            >
              送信する
            </button>
            <p id="contact-disabled" className="text-xs text-usu">
              架空の企業のため、すべての項目を無効にしてあります。
            </p>
          </div>
        </form>
      </section>

      <section className="mx-auto max-w-3xl px-5 pb-24">
        <div className="panel p-6">
          <h2 className="text-xs tracking-[0.25em] text-do">
            この作品について
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-usu">
            このサイトはポートフォリオ作品です。
            会社が事業として掲げている技術が、読むだけでなく実際に動くこと——
            それを見せるために作りました。中身は
            <span className="text-hanare">技術</span>のページにあります。
          </p>
          <p className="mt-4 text-sm leading-relaxed text-usu">
            制作についてのご連絡は、フッタの GitHub からお願いします。
          </p>
        </div>
      </section>
    </>
  );
}
