import React from "react";
type FormData = {
  nome: string;
  orgao: string;
  cargo: string;
  banca?: string;
  status: "ativo" | "pausado" | "encerrado";
  data_prova?: string;
  logo_file?: File | null;
  ativo: boolean;
};
const defaults: FormData = {
  nome: "",
  orgao: "",
  cargo: "",
  banca: "",
  status: "ativo",
  data_prova: "",
  logo_file: null,
  ativo: true,
};

export function ModalCriarPlano({
  open,
  onClose,
  initialValues,
  onSubmit,
  title,
  submitText,
}: {
  open: boolean;
  onClose: () => void;
  initialValues?: Partial<FormData>;
  onSubmit: (values: FormData) => Promise<void> | void;
  title: string;
  submitText: string;
}) {
  const [values, setValues] = React.useState<FormData>({ ...defaults, ...initialValues });

  React.useEffect(() => {
    if (open) {
      setValues({ ...defaults, ...initialValues });
    }
  }, [open, initialValues]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-700 dark:bg-neutral-800">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-medium text-neutral-800 dark:text-neutral-100">{title}</h3>
          <button type="button" className="text-sm text-neutral-400 hover:text-neutral-600" onClick={onClose}>
            Fechar
          </button>
        </div>

        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            if (values.nome.trim().length < 3 || values.orgao.trim().length < 2 || values.cargo.trim().length < 2) {
              return;
            }
            await onSubmit(values);
            onClose();
          }}
        >
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-500">Nome do plano *</label>
            <input
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-700"
              value={values.nome}
              onChange={(e) => setValues((s) => ({ ...s, nome: e.target.value }))}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-500">Órgão *</label>
              <input className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-700" value={values.orgao} onChange={(e) => setValues((s) => ({ ...s, orgao: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-500">Cargo *</label>
              <input className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-700" value={values.cargo} onChange={(e) => setValues((s) => ({ ...s, cargo: e.target.value }))} />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-500">Banca</label>
              <input className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-700" value={values.banca ?? ""} onChange={(e) => setValues((s) => ({ ...s, banca: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-500">Status</label>
              <select className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-700" value={values.status} onChange={(e) => setValues((s) => ({ ...s, status: e.target.value as FormData["status"] }))}>
                <option value="ativo">ativo</option>
                <option value="pausado">pausado</option>
                <option value="encerrado">encerrado</option>
              </select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-500">Data prevista da prova</label>
              <input type="date" className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-700" value={values.data_prova ?? ""} onChange={(e) => setValues((s) => ({ ...s, data_prova: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-500">Ativar no dashboard?</label>
              <label className="mt-2 flex items-center gap-2 text-xs text-neutral-500">
                <input type="checkbox" checked={values.ativo} onChange={(e) => setValues((s) => ({ ...s, ativo: e.target.checked }))} />
                Ao ativar, o dashboard exibirá os dados deste plano.
              </label>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-500">Upload da logo do órgão</label>
            <input
              type="file"
              accept="image/*"
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-700"
              onChange={(e) => setValues((s) => ({ ...s, logo_file: e.target.files?.[0] ?? null }))}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="rounded-md border border-neutral-200 px-3 py-2 text-sm" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="rounded-md bg-primary-600 px-3 py-2 text-sm font-medium text-white hover:bg-primary-800">
              {submitText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

