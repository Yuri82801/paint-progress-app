import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import JSZip from "jszip";

function escapeCsvValue(value: unknown) {
  if (value === null || value === undefined) return "";

  const text = String(value).replace(/"/g, '""');

  if (text.includes(",") || text.includes("\n") || text.includes('"')) {
    return `"${text}"`;
  }

  return text;
}

function toCsv(rows: Record<string, unknown>[]) {
  if (rows.length === 0) return "";

  const headers = Object.keys(rows[0]);

  const csvRows = [
    headers.join(","),
    ...rows.map((row) =>
      headers.map((header) => escapeCsvValue(row[header])).join(",")
    ),
  ];

  return "\uFEFF" + csvRows.join("\n");
}

export async function GET() {
  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [
    projectsResult,
    progressItemsResult,
    workersResult,
    profilesResult,
    usersResult,
  ] = await Promise.all([
    adminSupabase.from("projects").select("*"),
    adminSupabase.from("progress_items").select("*"),
    adminSupabase.from("workers").select("*"),
    adminSupabase.from("profiles").select("*"),
    adminSupabase.auth.admin.listUsers(),
  ]);

  if (projectsResult.error) throw new Error(projectsResult.error.message);
  if (progressItemsResult.error) throw new Error(progressItemsResult.error.message);
  if (workersResult.error) throw new Error(workersResult.error.message);
  if (profilesResult.error) throw new Error(profilesResult.error.message);
  if (usersResult.error) throw new Error(usersResult.error.message);

  const accounts =
    usersResult.data.users.map((account) => {
      const accountProfile = profilesResult.data?.find(
        (profile) => profile.id === account.id
      );

      return {
        id: account.id,
        email: account.email,
        role: accountProfile?.role ?? "",
        created_at: account.created_at,
        last_sign_in_at: account.last_sign_in_at,
      };
    }) ?? [];

  const zip = new JSZip();

  zip.file("projects.csv", toCsv(projectsResult.data ?? []));
  zip.file("progress_items.csv", toCsv(progressItemsResult.data ?? []));
  zip.file("workers.csv", toCsv(workersResult.data ?? []));
  zip.file("profiles.csv", toCsv(profilesResult.data ?? []));
  zip.file("accounts.csv", toCsv(accounts));

  const today = new Date().toISOString().slice(0, 10);

    const zipContent = await zip.generateAsync({
    type: "uint8array",
    });

    return new Response(Buffer.from(zipContent), {
    headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="backup-${today}.zip"`,
    },
    });
}