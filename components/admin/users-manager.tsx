"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Mail,
  Phone,
  Pencil,
  Trash2,
  Send,
  Plus,
  Loader2,
  Shield,
  UserIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { formatDate } from "@/lib/format";

export type ManagedUser = {
  id: string;
  email: string;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  role: "ADMIN" | "CLIENT";
  emailVerified: Date | string | null;
  createdAt: Date | string;
  pendingInvite: boolean;
};

export function UsersManager({
  initialUsers,
  currentUserId,
}: {
  initialUsers: ManagedUser[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState<"ALL" | "ADMIN" | "CLIENT">(
    "ALL",
  );
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<ManagedUser | null>(null);
  const [deleting, setDeleting] = React.useState<ManagedUser | null>(null);

  const filtered = initialUsers.filter((u) => {
    if (roleFilter !== "ALL" && u.role !== roleFilter) return false;
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      u.email.toLowerCase().includes(q) ||
      (u.name?.toLowerCase().includes(q) ?? false) ||
      (u.phone?.toLowerCase().includes(q) ?? false)
    );
  });

  async function sendInvite(userId: string) {
    const res = await fetch(`/api/admin/users/${userId}/invite`, {
      method: "POST",
    });
    if (res.ok) {
      toast.success("Invitation envoyée par email.");
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      toast.error(d.error || "Erreur");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          type="search"
          placeholder="Rechercher (email, nom, téléphone)…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="sm:max-w-xs"
        />
        <Select
          value={roleFilter}
          onChange={(e) =>
            setRoleFilter(e.target.value as typeof roleFilter)
          }
          className="sm:w-44"
        >
          <option value="ALL">Tous les rôles</option>
          <option value="ADMIN">Administrateurs</option>
          <option value="CLIENT">Clients</option>
        </Select>
        <div className="sm:ml-auto">
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nouvel utilisateur
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">
              Aucun utilisateur.
            </p>
          ) : (
            <div className="divide-y divide-border/50">
              {filtered.map((u) => (
                <UserRow
                  key={u.id}
                  user={u}
                  isSelf={u.id === currentUserId}
                  onEdit={() => setEditing(u)}
                  onDelete={() => setDeleting(u)}
                  onInvite={() => sendInvite(u.id)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CreateUserDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => {
          setCreateOpen(false);
          router.refresh();
        }}
      />
      <EditUserDialog
        user={editing}
        isSelf={editing?.id === currentUserId}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          router.refresh();
        }}
      />
      <DeleteUserDialog
        user={deleting}
        onClose={() => setDeleting(null)}
        onDeleted={() => {
          setDeleting(null);
          router.refresh();
        }}
      />
    </div>
  );
}

function UserRow({
  user,
  isSelf,
  onEdit,
  onDelete,
  onInvite,
}: {
  user: ManagedUser;
  isSelf: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onInvite: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
          {(user.name || user.email).charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold">{user.name || "—"}</p>
            <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>
              {user.role === "ADMIN" ? (
                <>
                  <Shield className="mr-1 h-3 w-3" />
                  Admin
                </>
              ) : (
                <>
                  <UserIcon className="mr-1 h-3 w-3" />
                  Client
                </>
              )}
            </Badge>
            {user.pendingInvite && (
              <Badge variant="outline">Invitation en attente</Badge>
            )}
            {!user.emailVerified && !user.pendingInvite && (
              <Badge variant="outline">Email non vérifié</Badge>
            )}
            {isSelf && <Badge variant="outline">Vous</Badge>}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Mail className="h-3 w-3" />
              {user.email}
            </span>
            {user.phone && (
              <span className="inline-flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {user.phone}
              </span>
            )}
            <span>depuis {formatDate(user.createdAt)}</span>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="outline" onClick={onInvite}>
          <Send className="mr-1.5 h-3.5 w-3.5" />
          {user.pendingInvite ? "Renvoyer" : "Inviter"}
        </Button>
        <Button size="sm" variant="outline" onClick={onEdit}>
          <Pencil className="mr-1.5 h-3.5 w-3.5" />
          Modifier
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onDelete}
          disabled={isSelf}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
          Supprimer
        </Button>
      </div>
    </div>
  );
}

function FormShell({
  title,
  description,
  children,
  onClose,
  onSubmit,
  loading,
  submitLabel,
  submitVariant,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  submitLabel: string;
  submitClassName?: string;
}) {
  return (
    <form onSubmit={onSubmit} className="p-6 sm:p-8">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="space-y-3">{children}</div>
      <div className="mt-6 flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Annuler
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className={submitClassName}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

function CreateUserDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [email, setEmail] = React.useState("");
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [role, setRole] = React.useState<"ADMIN" | "CLIENT">("CLIENT");
  const [sendInvite, setSendInvite] = React.useState(true);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setEmail("");
      setName("");
      setPhone("");
      setRole("CLIENT");
      setSendInvite(true);
    }
  }, [open]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email,
        name: name || null,
        phone: phone || null,
        role,
        sendInvite,
      }),
    });
    setLoading(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(data.error || "Erreur");
      return;
    }
    toast.success(
      sendInvite
        ? "Utilisateur créé et invitation envoyée."
        : "Utilisateur créé.",
    );
    onCreated();
  }

  return (
    <Dialog open={open} onClose={onClose} className="max-w-lg">
      <FormShell
        title="Nouvel utilisateur"
        description="Créez un compte et envoyez une invitation par email pour qu'il définisse son mot de passe."
        onClose={onClose}
        onSubmit={submit}
        loading={loading}
        submitLabel="Créer"
      >
        <div>
          <label className="mb-1 block text-sm font-medium">Email *</label>
          <Input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Nom</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Téléphone</label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Rôle *</label>
          <Select
            value={role}
            onChange={(e) => setRole(e.target.value as typeof role)}
          >
            <option value="CLIENT">Client</option>
            <option value="ADMIN">Administrateur</option>
          </Select>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={sendInvite}
            onChange={(e) => setSendInvite(e.target.checked)}
          />
          Envoyer une invitation par email
        </label>
      </FormShell>
    </Dialog>
  );
}

function EditUserDialog({
  user,
  isSelf,
  onClose,
  onSaved,
}: {
  user: ManagedUser | null;
  isSelf?: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [email, setEmail] = React.useState("");
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [role, setRole] = React.useState<"ADMIN" | "CLIENT">("CLIENT");
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (user) {
      setEmail(user.email);
      setName(user.name ?? "");
      setPhone(user.phone ?? "");
      setRole(user.role);
    }
  }, [user]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email,
        name: name || null,
        phone: phone || null,
        role,
      }),
    });
    setLoading(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(data.error || "Erreur");
      return;
    }
    toast.success("Utilisateur mis à jour.");
    onSaved();
  }

  return (
    <Dialog open={!!user} onClose={onClose} className="max-w-lg">
      <FormShell
        title="Modifier l'utilisateur"
        onClose={onClose}
        onSubmit={submit}
        loading={loading}
        submitLabel="Enregistrer"
      >
        <div>
          <label className="mb-1 block text-sm font-medium">Email</label>
          <Input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Nom</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Téléphone</label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Rôle</label>
          <Select
            value={role}
            onChange={(e) => setRole(e.target.value as typeof role)}
            disabled={isSelf}
          >
            <option value="CLIENT">Client</option>
            <option value="ADMIN">Administrateur</option>
          </Select>
          {isSelf && (
            <p className="mt-1 text-xs text-muted-foreground">
              Vous ne pouvez pas modifier votre propre rôle.
            </p>
          )}
        </div>
      </FormShell>
    </Dialog>
  );
}

function DeleteUserDialog({
  user,
  onClose,
  onDeleted,
}: {
  user: ManagedUser | null;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [loading, setLoading] = React.useState(false);

  async function confirmDelete(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "DELETE",
    });
    setLoading(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(data.error || "Erreur");
      return;
    }
    toast.success("Utilisateur supprimé.");
    onDeleted();
  }

  return (
    <Dialog open={!!user} onClose={onClose} className="max-w-md">
      <FormShell
        title="Supprimer l'utilisateur ?"
        description={
          user
            ? `${user.name || user.email} sera définitivement supprimé, ainsi que toutes ses données associées (projets, abonnements, tickets…). Cette action est irréversible.`
            : ""
        }
        onClose={onClose}
        onSubmit={confirmDelete}
        loading={loading}
        submitLabel="Supprimer"
        submitClassName="bg-destructive text-destructive-foreground hover:bg-destructive/90"
      >
        <div />
      </FormShell>
    </Dialog>
  );
}
