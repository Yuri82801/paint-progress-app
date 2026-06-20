import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function loginIdToEmail(loginId: string) {
  return `${loginId.trim().toLowerCase()}@paint-app.local`;
}

async function login(formData: FormData) {
  "use server";

  const loginId = String(formData.get("login_id") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!loginId || !password) {
    throw new Error("ログインIDとパスワードを入力してください。");
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: loginIdToEmail(loginId),
    password,
  });

  if (error) {
    throw new Error("ログインIDまたはパスワードが違います。");
  }

  redirect("/");
}

export default function LoginPage() {
  return (
    <main className="mx-auto max-w-md p-8">
      <h1 className="mb-6 text-2xl font-bold">ログイン</h1>

      <form action={login} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">ログインID</label>
          <input
            name="login_id"
            type="text"
            required
            autoComplete="username"
            className="w-full rounded border p-3"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">パスワード</label>
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="w-full rounded border p-3"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded bg-black px-4 py-3 text-white"
        >
          ログイン
        </button>
      </form>
    </main>
  );
}