"use client";

import * as React from "react";
import { FileText, Image as ImageIcon, UploadCloud, X } from "lucide-react";

import { cn } from "@/core/lib/utils/cn";
import { FormDescription, FormError, FormLabel } from "@/core/design-system/primitives/field";

export type FileUploadValue = File | { name: string; size?: number; type?: string; url?: string };
export type FileUploadProps = Omit<React.HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue" | "onError"> & {
  label?: React.ReactNode;
  description?: React.ReactNode;
  error?: React.ReactNode;
  required?: boolean;
  acceptedTypes?: string[];
  accept?: string;
  maxSize?: number;
  multiple?: boolean;
  /** Hide the built-in file list when a domain renders its own preview. */
  showPreview?: boolean;
  value?: FileUploadValue[];
  defaultValue?: FileUploadValue[];
  onChange?: (files: File[]) => void;
  onError?: (message: string) => void;
  /** Optional domain-specific preprocessing (compression, metadata, etc.). */
  processFile?: (file: File) => File | Promise<File>;
  onProcessingChange?: (processing: boolean) => void;
  disabled?: boolean;
  id?: string;
  name?: string;
  labelClassName?: string;
  dropLabel?: React.ReactNode;
};

export function formatFileSize(size: number) {
  if (!Number.isFinite(size) || size <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1);
  return (size / 1024 ** index).toFixed(index === 0 ? 0 : 1) + " " + units[index];
}

function matchesAccepted(file: File, acceptedTypes: string[]) {
  if (acceptedTypes.length === 0) return true;
  return acceptedTypes.some((accepted) => {
    const token = accepted.toLowerCase().trim();
    return token === file.type.toLowerCase() ||
      (token.endsWith("/*") && file.type.toLowerCase().startsWith(token.slice(0, -1))) ||
      token === "." + (file.name.split(".").pop()?.toLowerCase() ?? "");
  });
}

function FilePreviewMedia({ file }: { file: FileUploadValue }) {
  const isImage = Boolean((file.type ?? "").startsWith("image/"));
  const [previewUrl] = React.useState<string | undefined>(() => {
    if ("url" in file) return file.url;
    if (!(file instanceof File) || !isImage || typeof URL.createObjectURL !== "function") return undefined;
    return URL.createObjectURL(file);
  });
  React.useEffect(() => {
    if (!(file instanceof File) || !previewUrl) return;
    return () => { if (typeof URL.revokeObjectURL === "function") URL.revokeObjectURL(previewUrl); };
  }, [file, previewUrl]);
  return isImage && previewUrl
    ? <span aria-hidden="true" className="saut-file-preview__image" style={{ backgroundImage: `url(${previewUrl})` }} />
    : isImage
      ? <ImageIcon size={20} aria-hidden="true" />
      : <FileText size={20} aria-hidden="true" />;
}

export function FilePreview({ file, onRemove, className }: { file: FileUploadValue; onRemove?: () => void; className?: string }) {
  const previewKey = file instanceof File
    ? `${file.name}:${file.size}:${file.lastModified}`
    : file.url ?? `${file.name}:${file.size ?? 0}`;
  return (
    <div className={cn("saut-file-preview", className)}>
      <div className="saut-file-preview__icon">
        <FilePreviewMedia key={previewKey} file={file} />
      </div>
      <div className="saut-file-preview__meta">
        <span className="saut-file-preview__name" title={file.name}>{file.name}</span>
        <span className="saut-file-preview__size">{formatFileSize(file.size ?? 0)}</span>
      </div>
      {onRemove ? <button type="button" className="saut-file-preview__remove" onClick={onRemove} aria-label={"Quitar " + file.name}><X size={16} /></button> : null}
    </div>
  );
}

export function FileUpload({
  label,
  description,
  error,
  required,
  acceptedTypes = [],
  accept,
  maxSize = 10 * 1024 * 1024,
  multiple = false,
  showPreview = true,
  value,
  defaultValue = [],
  onChange,
  onError,
  processFile,
  onProcessingChange,
  disabled = false,
  id,
  name,
  labelClassName,
  dropLabel = "Arrastra archivos aquí o selecciona para explorar",
  className,
  ...props
}: FileUploadProps) {
  const reactId = React.useId();
  const inputId = id ?? ("file-upload-" + reactId);
  const [internal, setInternal] = React.useState<FileUploadValue[]>(defaultValue);
  const [dragging, setDragging] = React.useState(false);
  const [processing, setProcessing] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const operationRef = React.useRef(0);
  const files = value ?? internal;
  const accepted = acceptedTypes.length > 0 ? acceptedTypes : (accept ?? "").split(",").map((item) => item.trim()).filter(Boolean);

  const addFiles = async (incoming: FileList | File[]) => {
    const candidates: File[] = [];
    for (const file of Array.from(incoming)) {
      if (!matchesAccepted(file, accepted)) { onError?.("El archivo " + file.name + " no tiene un formato permitido."); continue; }
      if (file.size > maxSize) { onError?.("El archivo " + file.name + " supera el máximo de " + formatFileSize(maxSize) + "."); continue; }
      candidates.push(file);
    }
    if (candidates.length === 0) return;

    const operation = ++operationRef.current;
    setProcessing(true);
    onProcessingChange?.(true);
    const next: File[] = [];
    try {
      for (const file of candidates) {
        try {
          const processed = processFile ? await processFile(file) : file;
          if (processed instanceof File) next.push(processed);
          else next.push(file);
        } catch (processingError) {
          onError?.(processingError instanceof Error ? processingError.message : "No se pudo procesar el archivo.");
        }
      }
    } finally {
      if (operation === operationRef.current) {
        setProcessing(false);
        onProcessingChange?.(false);
      }
    }
    if (operation !== operationRef.current || next.length === 0) return;

    const merged = multiple ? [...files, ...next] : [next[0]!];
    if (value === undefined) setInternal(merged);
    // Keep native form submission and the controlled callback in sync with
    // the processed files. DataTransfer is unavailable in a few test/legacy
    // browsers; in that case the callback still receives the right value.
    if (inputRef.current && typeof DataTransfer !== "undefined") {
      const transfer = new DataTransfer();
      for (const file of merged) if (file instanceof File) transfer.items.add(file);
      inputRef.current.files = transfer.files;
    }
    onChange?.(merged.filter((file): file is File => file instanceof File));
  };
  const removeAt = (index: number) => {
    const merged = files.filter((_, currentIndex) => currentIndex !== index);
    if (value === undefined) setInternal(merged);
    onChange?.(merged.filter((file): file is File => file instanceof File));
    if (inputRef.current && typeof DataTransfer !== "undefined") {
      const transfer = new DataTransfer();
      for (const file of merged) if (file instanceof File) transfer.items.add(file);
      inputRef.current.files = transfer.files;
    }
  };

  return (
    <div className={cn("saut-field", className)} {...props}>
      {label !== undefined ? <FormLabel className={labelClassName} htmlFor={inputId} required={required}>{label}</FormLabel> : null}
      <label
        htmlFor={inputId}
        className={cn("saut-file-dropzone", dragging && "saut-file-dropzone--dragging", disabled && "saut-file-dropzone--disabled", error && "saut-file-dropzone--error")}
        onDragEnter={(event) => { event.preventDefault(); if (!disabled) setDragging(true); }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => { event.preventDefault(); setDragging(false); if (!disabled) addFiles(event.dataTransfer.files); }}
      >
        <UploadCloud size={24} aria-hidden="true" />
        <span>{dropLabel}</span>
        <small>{accepted.length ? accepted.join(", ") : "Cualquier formato"} · máximo {formatFileSize(maxSize)}</small>
        <input ref={inputRef} id={inputId} name={name} type="file" accept={accept ?? accepted.join(",")} multiple={multiple} disabled={disabled || processing} className="sr-only" onChange={(event) => { if (event.target.files) void addFiles(event.target.files); }} />
      </label>
      {showPreview && files.length > 0 ? <div className="saut-file-list">{files.map((file, index) => <FilePreview key={file.name + "-" + index} file={file} onRemove={() => removeAt(index)} />)}</div> : null}
      {processing ? <FormDescription>Procesando archivo…</FormDescription> : error ? <FormError>{error}</FormError> : description ? <FormDescription>{description}</FormDescription> : null}
    </div>
  );
}

export const FileDropzone = FileUpload;
