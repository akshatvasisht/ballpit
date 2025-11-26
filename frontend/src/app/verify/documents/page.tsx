/* Client-side document selection; mock submit to verification context. */
'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useVerification } from '../../providers/verifyProvider';
import { toast } from 'sonner';
import { NavHeader } from '@/components/nav-header';

const docOptions = ["Driver's License", 'Passport', 'Photo ID'];

export default function DocumentUploadPage() {
  const router = useRouter();
  const { setStage, setStatus, setDocument, submitInfo } = useVerification();
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setStage('documents');
  }, [setStage]);

  function triggerPicker() {
    if (loading) return;
    fileInputRef.current?.click();
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !selected) return;
    try {
      setLoading(true);
      setStatus('in_progress');
      setUploadedFile(file.name);
      const payload = { type: selected, fileName: file.name };
      setDocument(payload);
      await submitInfo({ document: payload });
      setStatus('success');
      toast.success('Document uploaded successfully.');
      router.push('/verify/success');
    } catch (err) {
      console.error('Submit document failed', err);
      setStatus('error');
      toast.error('Upload failed. Please try again.');
    } finally {
      setLoading(false);
      event.target.value = '';
    }
  }

  function handleSelect(label: string) {
    setSelected(label);
  }

  return (
    <>
      <NavHeader showBack={true} backHref="/verify" showHome={true} title="Document Upload" />
      <div className="flex w-full flex-col items-center gap-8 py-12">
        <Card className="w-full max-w-2xl">
          <CardContent className="space-y-6 px-8 py-10">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-[var(--warm-amber)]/10 border border-[var(--warm-amber)]/30">
            <Upload className="h-7 w-7 text-[var(--warm-amber)]" strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Document Upload
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Upload a government-issued ID to verify your identity
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 mt-8">
          {docOptions.map((label) => (
            <Button
              key={label}
              variant={selected === label ? "default" : "secondary"}
              className={`h-12 w-full text-sm font-medium ${selected === label ? 'ring-2 ring-[var(--electric-cyan)]/50' : ''
                }`}
              onClick={() => handleSelect(label)}
              disabled={loading}
            >
              {label}
            </Button>
          ))}
        </div>

        {selected && (
          <div
            className="cursor-pointer rounded-lg border-2 border-dashed border-[var(--slate-blue)]/30 bg-white/50 px-6 py-12 text-center transition hover:border-[var(--electric-cyan)]/50 hover:bg-white/70"
            role="button"
            tabIndex={0}
            onClick={triggerPicker}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                triggerPicker();
              }
            }}
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--electric-cyan)]/10 border border-[var(--electric-cyan)]/30">
              <Upload className="h-6 w-6 text-[var(--electric-cyan)]" strokeWidth={2} />
            </div>
            <div className="mt-4 text-sm font-semibold text-foreground">
              {loading ? "Uploading..." : `Click to upload your ${selected}`}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Supports JPG, PNG, PDF
            </div>
            {uploadedFile && (
              <div className="mt-3 text-xs font-semibold text-[var(--sage-green)]">
                Selected file: {uploadedFile}
              </div>
            )}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf"
          className="hidden"
          onChange={handleFileChange}
        />
      </CardContent>
    </Card>
      </div>
    </>
  );
}
