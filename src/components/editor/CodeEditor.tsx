import React, { useEffect, useState, useRef } from 'react';
import Editor from '@monaco-editor/react';
import type { Monaco } from '@monaco-editor/react';
import { useEnvironmentStore } from '../../stores';
import { generateBicepCode } from '../../hooks/useTauri';
import { Copy, Check, FileCode } from 'lucide-react';

export const CodeEditor: React.FC<{
  onResourceSelect?: (resourceId: string) => void;
  highlightedResourceId?: string | null;
}> = ({ onResourceSelect, highlightedResourceId }) => {
  const { currentEnvironment } = useEnvironmentStore();
  const [bicepCode, setBicepCode] = useState<string>('// Generating Bicep code...');
  const [sourceMap, setSourceMap] = useState<Record<string, { start: number; end: number }>>({});
  const [copied, setCopied] = useState<boolean>(false);
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const decorationsRef = useRef<string[]>([]);

  useEffect(() => {
    if (!currentEnvironment) return;

    let isMounted = true;
    const timer = setTimeout(() => {
      generateBicepCode(
        currentEnvironment.resources,
        currentEnvironment.resourceGroup,
        currentEnvironment.region
      )
        .then((res) => {
          if (isMounted) {
            setBicepCode(res.code);
            setSourceMap(res.sourceMap);
          }
        })
        .catch((err) => {
          if (isMounted) {
            setBicepCode(`// Error generating Bicep: ${err}`);
          }
        });
    }, 120);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [currentEnvironment]);

  const handleEditorDidMount = (editor: any, monaco: Monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    editor.onDidChangeCursorPosition((e: any) => {
      const line = e.position.lineNumber;
      for (const [resId, range] of Object.entries(sourceMap)) {
        if (line >= range.start && line <= range.end) {
          onResourceSelect?.(resId);
          break;
        }
      }
    });
  };

  useEffect(() => {
    if (!editorRef.current || !monacoRef.current || !highlightedResourceId) {
      if (editorRef.current && decorationsRef.current.length > 0) {
        decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, []);
      }
      return;
    }

    const range = sourceMap[highlightedResourceId];
    if (range) {
      const monaco = monacoRef.current;
      decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, [
        {
          range: new monaco.Range(range.start, 1, range.end, 100),
          options: {
            isWholeLine: true,
            className: 'monaco-highlight-line',
            linesDecorationsClassName: 'monaco-line-decoration',
          },
        },
      ]);
      editorRef.current.revealLineInCenter(range.start);
    }
  }, [highlightedResourceId, sourceMap]);

  const handleCopy = () => {
    navigator.clipboard.writeText(bicepCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', background: '#09090b' }}>
      <div
        style={{
          padding: '6px 14px',
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border-primary)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '11px',
          color: 'var(--text-secondary)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <FileCode size={13} color="#10b981" />
          <span>main.bicep (Synchronized Projection)</span>
        </div>
        <button
          className="btn btn-secondary btn-sm"
          onClick={handleCopy}
        >
          {copied ? <Check size={11} color="#10b981" /> : <Copy size={11} />}
          {copied ? 'Copied' : 'Copy Code'}
        </button>
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <Editor
          height="100%"
          language="bicep"
          theme="vs-dark"
          value={bicepCode}
          options={{
            readOnly: false,
            minimap: { enabled: true },
            fontSize: 13,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          }}
          onMount={handleEditorDidMount}
        />
      </div>
    </div>
  );
};
