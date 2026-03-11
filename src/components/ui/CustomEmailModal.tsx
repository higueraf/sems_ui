/**
 * CustomEmailModal — Modal reutilizable para redactar correos personalizados
 * con editor WYSIWYG (Quill). Se usa tanto en SubmissionDetail como en
 * el envío masivo (BulkEmailModal).
 * 
 * Ahora soporta adjuntos Word (.doc/.docx)
 */

import { useState, useRef } from 'react';
import { Mail, X, Send, Loader2, CheckCircle, AlertTriangle, Upload, FileText, Trash2 } from 'lucide-react';
import RichTextEditor from './RichTextEditor';

interface Props {
  toName: string;
  toEmail: string;
  onSend: (subject: string, body: string, attachment?: File) => Promise<void>;
  onClose: () => void;
  title?: string;
}

export default function CustomEmailModal({
  toName,
  toEmail,
  onSend,
  onClose,
  title = 'Correo Personalizado',
}: Props) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = async () => {
    if (!subject.trim()) { setError('El asunto es obligatorio.'); return; }
    if (!body.trim() || body === '<p><br></p>') { setError('El mensaje no puede estar vacío.'); return; }
    setError('');
    setSending(true);
    try {
      await onSend(subject, body, attachment || undefined);
      setSent(true);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Error al enviar el correo.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary-100 flex items-center justify-center">
              <Mail size={18} className="text-primary-600" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-gray-900">{title}</h2>
              <p className="text-xs text-gray-400">Para: <span className="font-medium text-gray-600">{toName}</span> · {toEmail}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {sent ? (
            <div className="text-center py-10 space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <CheckCircle size={32} className="text-green-600" />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-lg">Correo enviado</p>
                <p className="text-gray-500 text-sm mt-1">
                  El mensaje fue despachado a <strong>{toEmail}</strong>
                </p>
              </div>
              <button onClick={onClose} className="btn-primary mt-4">Cerrar</button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Asunto */}
              <div>
                <label className="form-label">
                  Asunto <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Asunto del correo..."
                  className="form-input py-2.5 text-sm"
                />
              </div>

              {/* Editor WYSIWYG */}
              <div>
                <label className="form-label">
                  Mensaje <span className="text-red-500">*</span>
                  <span className="ml-2 text-xs font-normal text-gray-400">
                    (negrita, cursiva, listas, alineación, colores, etc.)
                  </span>
                </label>
                <RichTextEditor
                  value={body}
                  onChange={setBody}
                  placeholder="Redacta el mensaje para el postulante..."
                  minHeight={240}
                />
              </div>

              {/* Adjunto Word (opcional) */}
              <div>
                <label className="form-label">
                  Adjunto Word (opcional)
                  <span className="ml-2 text-xs font-normal text-gray-400">
                    .doc/.docx — máx 10 MB
                  </span>
                </label>
                <div className="space-y-2">
                  {attachment ? (
                    <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2">
                        <FileText size={16} className="text-blue-500" />
                        <span className="text-sm text-gray-700 truncate max-w-[250px]" title={attachment.name}>
                          {attachment.name}
                        </span>
                        <span className="text-xs text-gray-400">
                          ({(attachment.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAttachment(null)}
                        className="text-red-400 hover:text-red-600 p-1"
                        title="Quitar adjunto"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-colors"
                    >
                      <Upload size={20} className="mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">
                        Clic para adjuntar documento Word
                      </p>
                      <p className="text-xs text-gray-400">
                        .doc/.docx — máx 10 MB
                      </p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 10 * 1024 * 1024) {
                          setError('El archivo adjunto no debe superar 10 MB');
                          return;
                        }
                        if (!['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type)) {
                          setError('Solo se permiten documentos Word (.doc/.docx)');
                          return;
                        }
                        setAttachment(file);
                        setError('');
                      }
                      e.target.value = '';
                    }}
                  />
                </div>
              </div>

              {/* Nota informativa */}
              <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl p-3">
                <Mail size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-blue-600">
                  El mensaje se enviará dentro de la plantilla oficial del simposio, incluyendo
                  el encabezado institucional y el pie de página con los datos del evento.
                  El correo se despachará en segundo plano de forma inmediata.
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
                  <AlertTriangle size={15} />
                  {error}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!sent && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0">
            <button onClick={onClose} className="btn-secondary" disabled={sending}>
              Cancelar
            </button>
            <button
              onClick={handleSend}
              disabled={sending}
              className="btn-primary flex items-center gap-2 disabled:opacity-50"
            >
              {sending ? (
                <><Loader2 size={15} className="animate-spin" /> Enviando...</>
              ) : (
                <><Send size={15} /> Enviar correo</>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
