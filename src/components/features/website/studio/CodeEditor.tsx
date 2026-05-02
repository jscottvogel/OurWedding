'use client';

import React from 'react';
import Editor from '@monaco-editor/react';

interface CodeEditorProps {
  language: 'css' | 'javascript' | 'html';
  value: string;
  onChange: (value: string | undefined) => void;
}

export function CodeEditor({ language, value, onChange }: CodeEditorProps) {
  return (
    <div className="flex-1 w-full h-full border border-slate-700">
      <Editor
        height="100%"
        theme="vs-dark"
        language={language}
        value={value}
        onChange={onChange}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          wordWrap: 'on',
          scrollBeyondLastLine: false,
          padding: { top: 16 }
        }}
      />
    </div>
  );
}
