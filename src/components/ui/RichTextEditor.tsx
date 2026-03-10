/**
 * RichTextEditor — Editor WYSIWYG basado en Quill
 * Soporta: negrita, cursiva, subrayado, tachado, encabezados,
 * listas, alineación, colores, links, citas, código, limpiar formato.
 *
 * Uso:
 *   import RichTextEditor from '../components/ui/RichTextEditor';
 *   <RichTextEditor value={html} onChange={setHtml} placeholder="Redacta aquí..." />
 */

import { useEffect, useRef } from 'react';

// Quill se carga dinámicamente para evitar problemas de SSR
declare global {
  interface Window {
    Quill: any;
  }
}

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}

const TOOLBAR_OPTIONS = [
  [{ header: [1, 2, 3, false] }],
  ['bold', 'italic', 'underline', 'strike'],
  [{ color: [] }, { background: [] }],
  [{ align: [] }],
  [{ list: 'ordered' }, { list: 'bullet' }],
  ['blockquote', 'code-block'],
  ['link'],
  ['clean'],
];

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Redacta aquí el mensaje...',
  minHeight = 260,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef    = useRef<HTMLDivElement>(null);
  const quillRef     = useRef<any>(null);
  const onChangeRef  = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (quillRef.current) return; // ya inicializado

    // Cargar Quill CSS dinámicamente
    if (!document.getElementById('quill-snow-css')) {
      const link = document.createElement('link');
      link.id = 'quill-snow-css';
      link.rel = 'stylesheet';
      link.href = 'https://cdn.quilljs.com/1.3.7/quill.snow.css';
      document.head.appendChild(link);
    }

    // Cargar Quill JS dinámicamente
    const loadQuill = () => {
      if (window.Quill) {
        initQuill();
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://cdn.quilljs.com/1.3.7/quill.min.js';
      script.onload = initQuill;
      document.head.appendChild(script);
    };

    const initQuill = () => {
      if (!editorRef.current || quillRef.current) return;

      const quill = new window.Quill(editorRef.current, {
        theme: 'snow',
        placeholder,
        modules: {
          toolbar: {
            container: TOOLBAR_OPTIONS,
          },
        },
      });

      // Establecer valor inicial
      if (value) {
        quill.clipboard.dangerouslyPasteHTML(value);
      }

      // Escuchar cambios
      quill.on('text-change', () => {
        const html = editorRef.current?.querySelector('.ql-editor')?.innerHTML || '';
        onChangeRef.current(html === '<p><br></p>' ? '' : html);
      });

      quillRef.current = quill;
    };

    loadQuill();
  }, []);

  // Sincronizar valor externo → editor (solo cuando cambia desde afuera)
  useEffect(() => {
    if (!quillRef.current) return;
    const editor = editorRef.current?.querySelector('.ql-editor');
    if (!editor) return;
    if (value === '' && editor.innerHTML !== '<p><br></p>') {
      quillRef.current.setText('');
    }
  }, [value]);

  return (
    <div ref={containerRef} className="rich-editor-wrapper">
      <style>{`
        .rich-editor-wrapper .ql-toolbar {
          border: 1px solid #d1d5db;
          border-bottom: none;
          border-radius: 10px 10px 0 0;
          background: #f9fafb;
          padding: 8px 10px;
          flex-wrap: wrap;
        }
        .rich-editor-wrapper .ql-container {
          border: 1px solid #d1d5db;
          border-top: none;
          border-radius: 0 0 10px 10px;
          font-family: 'Roboto', sans-serif;
          font-size: 14px;
        }
        .rich-editor-wrapper .ql-editor {
          min-height: ${minHeight}px;
          padding: 14px 16px;
          color: #374840;
          line-height: 1.75;
        }
        .rich-editor-wrapper .ql-editor.ql-blank::before {
          color: #9ca3af;
          font-style: normal;
        }
        .rich-editor-wrapper .ql-editor:focus {
          outline: none;
        }
        .rich-editor-wrapper .ql-container:focus-within {
          border-color: #007F3A;
          box-shadow: 0 0 0 3px rgba(0,127,58,0.1);
        }
        .rich-editor-wrapper .ql-toolbar button:hover .ql-stroke,
        .rich-editor-wrapper .ql-toolbar button.ql-active .ql-stroke {
          stroke: #007F3A;
        }
        .rich-editor-wrapper .ql-toolbar button:hover .ql-fill,
        .rich-editor-wrapper .ql-toolbar button.ql-active .ql-fill {
          fill: #007F3A;
        }
        .rich-editor-wrapper .ql-toolbar .ql-picker-label:hover,
        .rich-editor-wrapper .ql-toolbar .ql-picker-label.ql-active {
          color: #007F3A;
        }
        .rich-editor-wrapper .ql-toolbar .ql-picker-label:hover .ql-stroke {
          stroke: #007F3A;
        }
      `}</style>
      <div ref={editorRef} />
    </div>
  );
}
