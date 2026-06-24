import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

type Worker = {
  id: string;
  name: string;
};

type Profile = {
  id: string;
  role: string;
};

function loginIdToEmail(loginId: string) {
  return `${loginId.trim().toLowerCase()}@paint-app.local`;
}

function emailToDisplayId(email: string | undefined) {
  if (!email) return "不明";

  if (email.endsWith("@paint-app.local")) {
    return email.replace("@paint-app.local", "");
  }

  return email;
}

async function addWorker(formData: FormData) {
  "use server";

  const supabase = await createClient();
  const name = String(formData.get("name") ?? "").trim();

  if (!name) return;

  const { error } = await supabase.from("workers").insert({ name });

  if (error) throw new Error(error.message);

  revalidatePath("/settings");
}

async function deleteWorker(formData: FormData) {
  "use server";

  const supabase = await createClient();
  const workerId = String(formData.get("worker_id") ?? "");

  const { error } = await supabase.from("workers").delete().eq("id", workerId);

  if (error) throw new Error(error.message);

  revalidatePath("/settings");
}

async function createAccount(formData: FormData) {
  "use server";

  const adminSupabase = createAdminClient();

  const loginId = String(formData.get("login_id") ?? "").trim();
  const password = String(formData.get("password") ?? "").trim();
  const role = String(formData.get("role") ?? "staff");

  if (!loginId || !password) return;
  if (role !== "admin" && role !== "staff") throw new Error("権限が不正です。");
  if (password.length < 6) throw new Error("パスワードは6文字以上にしてください。");

  const email = loginIdToEmail(loginId);

  const { data, error: authError } = await adminSupabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) throw new Error(authError.message);

  const userId = data.user?.id;
  if (!userId) throw new Error("ユーザーIDを取得できませんでした。");

  const { error: profileError } = await adminSupabase.from("profiles").insert({
    id: userId,
    role,
  });

  if (profileError) {
    await adminSupabase.auth.admin.deleteUser(userId);
    throw new Error(profileError.message);
  }

  revalidatePath("/settings");
}

async function updateAccountRole(formData: FormData) {
  "use server";

  const adminSupabase = createAdminClient();

  const userId = String(formData.get("user_id") ?? "");
  const role = String(formData.get("role") ?? "staff");

  if (!userId) return;
  if (role !== "admin" && role !== "staff") throw new Error("権限が不正です。");

  const { error } = await adminSupabase
    .from("profiles")
    .update({ role })
    .eq("id", userId);

  if (error) throw new Error(error.message);

  revalidatePath("/settings");
}

async function deleteAccount(formData: FormData) {
  "use server";

  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  const userId = String(formData.get("user_id") ?? "");
  if (!userId) return;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.id === userId) {
    throw new Error("自分自身のアカウントは削除できません。");
  }

  await adminSupabase.from("profiles").delete().eq("id", userId);

  const { error } = await adminSupabase.auth.admin.deleteUser(userId);

  if (error) throw new Error(error.message);

  revalidatePath("/settings");
}

async function updateAccountPassword(formData: FormData) {
  "use server";

  const adminSupabase = createAdminClient();

  const userId = String(formData.get("user_id") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!userId || !password) return;

  if (password.length < 6) {
    throw new Error("パスワードは6文字以上にしてください。");
  }

  const { error } = await adminSupabase.auth.admin.updateUserById(
    userId,
    {
      password,
    }
  );

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/settings");
}

export default async function SettingsPage() {
  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || profile?.role !== "admin") redirect("/");

  const { data: workers, error: workersError } = await supabase
    .from("workers")
    .select("*")
    .order("name", { ascending: true });

  if (workersError) {
    return <main className="p-8">エラー：{workersError.message}</main>;
  }

  const { data: profiles } = await adminSupabase.from("profiles").select("*");

  const { data: usersData, error: usersError } =
    await adminSupabase.auth.admin.listUsers();

  if (usersError) {
    return <main className="p-8">エラー：{usersError.message}</main>;
  }

  const workerList = (workers as Worker[]) ?? [];
  const profileList = (profiles as Profile[]) ?? [];

  const accountList = usersData.users.map((account) => {
    const accountProfile = profileList.find((p) => p.id === account.id);

    return {
      id: account.id,
      loginId: emailToDisplayId(account.email),
      email: account.email ?? "メール不明",
      role: accountProfile?.role ?? "staff",
      createdAt: account.created_at,
    };
  });

  return (
    <main className="min-h-screen bg-gray-100 p-4 sm:p-8">
      <a href="/" className="text-blue-600 underline">
        ← 工事一覧に戻る
      </a>

      <h1 className="mt-4 mb-6 text-3xl font-bold">設定</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border bg-white p-4 shadow-sm">
          <h2 className="mb-4 text-xl font-bold">アカウント登録</h2>

          <form action={createAccount} className="space-y-4">
            <input
              name="login_id"
              type="text"
              placeholder="ログインID"
              className="w-full rounded border p-2"
              required
            />

            <input
              name="password"
              type="text"
              placeholder="初期パスワード（6文字以上）"
              className="w-full rounded border p-2"
              required
            />

            <select name="role" className="w-full rounded border p-2">
              <option value="staff">staff</option>
              <option value="admin">admin</option>
            </select>

            <button className="w-full rounded bg-blue-600 px-4 py-2 font-medium text-white">
              アカウントを作成
            </button>
          </form>
        </section>

        <section className="rounded-lg border bg-white p-4 shadow-sm">
          <h2 className="mb-4 text-xl font-bold">作業者管理</h2>

          <form action={addWorker} className="mb-6 flex flex-col gap-2 sm:flex-row">
            <input
              name="name"
              placeholder="作業者名を入力"
              className="flex-1 rounded border p-2"
              required
            />

            <button className="rounded bg-black px-4 py-2 text-white">
              追加
            </button>
          </form>

          <div className="space-y-2">
            {workerList.map((worker) => (
              <div
                key={worker.id}
                className="flex items-center justify-between rounded border p-3"
              >
                <span>{worker.name}</span>

                <form action={deleteWorker}>
                  <input type="hidden" name="worker_id" value={worker.id} />
                  <button className="rounded bg-red-600 px-3 py-1 text-sm text-white">
                    削除
                  </button>
                </form>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border bg-white p-4 shadow-sm lg:col-span-2">
          <h2 className="mb-4 text-xl font-bold">アカウント一覧</h2>

          <div className="space-y-3">
            {accountList.map((account) => (
              <div
                key={account.id}
                className="flex flex-col gap-3 rounded border p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-bold">ログインID：{account.loginId}</p>
                  <p className="text-xs text-gray-400">{account.email}</p>
                  <p className="text-sm text-gray-500">
                    登録日：
                    {new Date(account.createdAt).toLocaleDateString("ja-JP")}
                  </p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <form action={updateAccountRole} className="flex gap-2">
                    <input type="hidden" name="user_id" value={account.id} />

                    <select
                      name="role"
                      defaultValue={account.role}
                      className="rounded border p-2"
                    >
                      <option value="staff">staff</option>
                      <option value="admin">admin</option>
                    </select>

                    <button className="rounded bg-gray-800 px-3 py-2 text-sm text-white">
                      権限変更
                    </button>
                  </form>

                  <form action={updateAccountPassword} className="flex gap-2">
                    <input
                      type="hidden"
                      name="user_id"
                      value={account.id}
                    />

                    <input
                      type="text"
                      name="password"
                      placeholder="新パスワード"
                      className="rounded border p-2"
                      required
                    />

                    <button className="rounded bg-blue-600 px-3 py-2 text-sm text-white">
                      パスワード変更
                    </button>
                </form>

                  <form action={deleteAccount}>
                    <input type="hidden" name="user_id" value={account.id} />

                    <button
                      className="rounded bg-red-600 px-3 py-2 text-sm text-white disabled:bg-gray-300"
                      disabled={account.id === user.id}
                    >
                      削除
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border bg-white p-4 shadow-sm lg:col-span-2">
          <h2 className="mb-2 text-xl font-bold">バックアップ</h2>

          <p className="mb-4 text-sm text-gray-600">
            工事データ、進捗データ、作業者、アカウント権限をCSV形式でまとめて保存します。
          </p>

          <a
            href="/api/backup"
            className="inline-block rounded bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700"
          >
            CSVバックアップをダウンロード
          </a>
        </section>
      </div>
    </main>
  );
}